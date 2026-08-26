import jwt from 'jsonwebtoken';
import User from '../models/Dentist.js';
import LabOrder, { STAGES } from '../models/LabOrder.js';
import Payment from '../models/Payment.js';
import logger, { auditLog } from '../utils/logger.js';
import { cookieOptions } from './authController.js';

const USER_SORT_FIELDS = ['createdAt', 'name', 'email', 'status', 'clinicName'];

// ═══════════════════════════════════════════════════════════════════════════
// SSE — Server-Sent Events broadcaster (Admin)
// adminClients is a Set of active Response objects (one per open admin tab)
// ═══════════════════════════════════════════════════════════════════════════
export const adminClients = new Set();

/**
 * Broadcast an event to every connected admin client.
 * @param {string} event  — SSE event name (e.g. 'new-registration')
 * @param {object} data   — payload (will be JSON-stringified)
 */
export function broadcastToAdmin(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of adminClients) {
    try { client.write(payload); } catch { adminClients.delete(client); }
  }
  logger.debug(`SSE broadcast "${event}" → ${adminClients.size} admin client(s)`);
}

// ═══════════════════════════════════════════════════════════════════════════
// SSE — User (Dentist) broadcaster
// userClients maps userId (string) → Set<Response>
// ═══════════════════════════════════════════════════════════════════════════
export const userClients = new Map();

/**
 * Broadcast an event to all active SSE connections for a specific user.
 * @param {string} userId — MongoDB ObjectId as string
 * @param {string} event  — SSE event name
 * @param {object} data   — payload
 */
export function broadcastToUser(userId, event, data) {
  const clients = userClients.get(userId);
  if (!clients || clients.size === 0) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    try { client.write(payload); } catch { clients.delete(client); }
  }
  logger.debug(`SSE broadcast "${event}" → ${clients.size} client(s) for user ${userId}`);
}


// ─── Middleware: verify admin JWT (cookie -> bearer header -> query param) ──
export const verifyAdmin = (req, res, next) => {
  let token = req.cookies?.dentzy_admin_jwt;
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }
  if (!token && req.query?.token) {
    token = req.query.token;
  }
  if (!token) {
    return res.status(401).json({ message: 'Admin access denied. No token.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET, { algorithms: ['HS256'] });
    if (decoded.role !== 'admin') throw new Error('Not admin');
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired admin token.' });
  }
};

// ─── GET /api/admin/events ────────────────────────────────────────────────────
export const sseEvents = (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send an initial "connected" confirmation
  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Admin SSE connected' })}\n\n`);

  // Register this client
  adminClients.add(res);
  logger.info(`Admin SSE client connected. Total: ${adminClients.size}`);

  // Send a heartbeat every 25 seconds to keep the connection alive
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch { clearInterval(heartbeat); }
  }, 25000);

  // Cleanup on disconnect
  req.on('close', () => {
    adminClients.delete(res);
    clearInterval(heartbeat);
    logger.info(`Admin SSE client disconnected. Remaining: ${adminClients.size}`);
  });
};

// ─── POST /api/admin/login ────────────────────────────────────────────────────
// Body is pre-validated by Zod (adminLoginSchema)
export const adminLogin = (req, res) => {
  const { username, password } = req.body;

  if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Invalid admin credentials.' });
  }

  const token = jwt.sign(
    { role: 'admin', username },
    process.env.ADMIN_JWT_SECRET,
    { expiresIn: '8h' }
  );

  auditLog('ADMIN_LOGIN', { username });

  // Set admin JWT as HttpOnly cookie
  res.cookie('dentzy_admin_jwt', token, cookieOptions(8 * 60 * 60 * 1000));

  return res.json({ admin: { username, role: 'admin' }, token });
};

// ─── POST /api/admin/logout ─────────────────────────────────────────────────
export const adminLogout = (req, res) => {
  res.clearCookie('dentzy_admin_jwt', cookieOptions(0));
  return res.json({ message: 'Admin logged out successfully.' });
};

// ─── GET /api/admin/me ────────────────────────────────────────────────────────
// Returns the current admin payload from the verified JWT.
export const getMe = (req, res) => {
  return res.json({ admin: req.admin });
};

// ─── GET /api/admin/users/:id ─────────────────────────────────────────────────
// Returns a dentist's profile (no password) + all their lab orders.
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const orders = await LabOrder.find({ owner: req.params.id }).sort({ createdAt: -1 });

    return res.json({ user, orders });
  } catch (error) {
    logger.error('Admin getUserById error', { error: error.message });
    return res.status(500).json({ message: 'Failed to load user details.' });
  }
};

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
export const getStats = async (req, res) => {
  try {
    const [total, pending, approved, rejected] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'pending' }),
      User.countDocuments({ status: 'approved' }),
      User.countDocuments({ status: 'rejected' }),
    ]);
    return res.json({ total, pending, approved, rejected });
  } catch (error) {
    logger.error('Admin stats error', { error: error.message });
    return res.status(500).json({ message: 'Failed to load stats.' });
  }
};

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
export const getUsers = async (req, res) => {
  try {
    const { status } = req.query;

    // Whitelist sort fields and order
    const sort = USER_SORT_FIELDS.includes(req.query.sort) ? req.query.sort : 'createdAt';
    const order = req.query.order === 'asc' ? 'asc' : 'desc';

    const filter = status && status !== 'all' ? { status } : {};
    const sortObj = { [sort]: order === 'asc' ? 1 : -1 };
    const users = await User.find(filter).select('-password').sort(sortObj);
    return res.json({ users });
  } catch (error) {
    logger.error('Admin users list error', { error: error.message });
    return res.status(500).json({ message: 'Failed to load users.' });
  }
};

// ─── GET /api/admin/users/approved ────────────────────────────────────────────
export const getApprovedUsers = async (req, res) => {
  try {
    const users = await User.find({ status: 'approved' })
      .select('_id name email clinicName')
      .sort({ name: 1 });
    return res.json({ users });
  } catch (error) {
    logger.error('Approved users list error', { error: error.message });
    return res.status(500).json({ message: 'Failed to load approved users.' });
  }
};

// ─── PATCH /api/admin/users/:id/approve ──────────────────────────────────────
export const approveUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', adminNote: '' },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    auditLog('USER_APPROVED', { userId: user._id, adminUsername: req.admin.username });
    broadcastToAdmin('user-updated', { id: user._id, status: 'approved', name: user.name });
    return res.json({ message: 'User approved successfully.', user });
  } catch (error) {
    logger.error('Approve user error', { error: error.message });
    return res.status(500).json({ message: 'Failed to approve user.' });
  }
};

// ─── PATCH /api/admin/users/:id/reject ───────────────────────────────────────
// Body is pre-validated by Zod (rejectUserSchema)
export const rejectUser = async (req, res) => {
  try {
    const { note = '' } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', adminNote: note },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    auditLog('USER_REJECTED', { userId: user._id, adminUsername: req.admin.username });
    broadcastToAdmin('user-updated', { id: user._id, status: 'rejected', name: user.name });
    return res.json({ message: 'User rejected.', user });
  } catch (error) {
    logger.error('Reject user error', { error: error.message });
    return res.status(500).json({ message: 'Failed to reject user.' });
  }
};

// ─── DELETE /api/admin/users/:id ─────────────────────────────────────────────
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Cascade delete associated lab orders and payments
    await Promise.all([
      LabOrder.deleteMany({ owner: req.params.id }),
      Payment.deleteMany({ owner: req.params.id }),
    ]);

    auditLog('USER_DELETED_BY_ADMIN', { userId: req.params.id, adminUsername: req.admin.username });
    broadcastToAdmin('user-updated', { id: req.params.id, status: 'deleted' });
    return res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    logger.error('Delete user error', { error: error.message });
    return res.status(500).json({ message: 'Failed to delete user.' });
  }
};

// ─── GET /api/admin/orders ────────────────────────────────────────────────────
export const getOrders = async (req, res) => {
  try {
    const { status, stage, search, sort = 'createdAt', order = 'desc', limit = 100 } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (stage && stage !== 'all') filter.stage = stage;
    if (search) {
      filter.$or = [
        { patientName: { $regex: search, $options: 'i' } },
        { caseId:      { $regex: search, $options: 'i' } },
      ];
    }
    const orders = await LabOrder.find(filter)
      .populate('owner', 'name email clinicName')
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .limit(Number(limit));
    return res.json({ orders });
  } catch (error) {
    logger.error('Admin orders list error', { error: error.message });
    return res.status(500).json({ message: 'Failed to load orders.' });
  }
};

// ─── POST /api/admin/orders ───────────────────────────────────────────────────
// Body is pre-validated by Zod (createOrderSchema)
export const createOrder = async (req, res) => {
  try {
    const { dentistId, patientName, serviceType, priority, dueDate, notes } = req.body;

    // Verify the dentist exists and is approved
    const dentist = await User.findById(dentistId).select('name email status');
    if (!dentist) return res.status(404).json({ message: 'Dentist not found.' });
    if (dentist.status !== 'approved') {
      return res.status(400).json({ message: 'Dentist is not approved.' });
    }

    // Generate case ID: DZ-YYYYMMDD-XXXX
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const caseId = `DZ-${datePart}-${random}`;

    const order = new LabOrder({
      owner: dentistId,
      patientName,
      caseId,
      serviceType: serviceType || 'Other',
      priority: priority || 'Normal',
      dueDate: dueDate || null,
      notes: notes || '',
      stage: 'received',
      status: 'Pending',
      createdBy: 'admin',
    });

    await order.save();

    // Populate owner for response
    await order.populate({ path: 'owner', select: 'name email clinicName' });

    auditLog('ORDER_CREATED', { orderId: order._id, caseId, dentistId, adminUsername: req.admin.username });

    // Broadcast to admin SSE
    broadcastToAdmin('order-created', {
      orderId: order._id,
      caseId: order.caseId,
      patientName: order.patientName,
      dentist: dentist.name,
    });

    // Broadcast to dentist SSE
    broadcastToUser(dentistId, 'new-order', {
      orderId: order._id,
      caseId: order.caseId,
      patientName: order.patientName,
      serviceType: order.serviceType,
      stage: order.stage,
      status: order.status,
      priority: order.priority,
    });

    return res.status(201).json({ message: 'Order created.', order });
  } catch (error) {
    logger.error('Admin create order error', { error: error.message });
    return res.status(500).json({ message: 'Failed to create order.' });
  }
};

// ─── PATCH /api/admin/orders/:id/stage ────────────────────────────────────────
// Body is pre-validated by Zod (updateOrderStageSchema)
export const updateOrderStage = async (req, res) => {
  try {
    const { stage } = req.body;

    const order = await LabOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    const oldStage = order.stage;
    order.stage = stage;

    // Auto-sync status based on stage
    if (stage === 'completed') {
      order.status = 'Completed';
    } else if (stage === 'received') {
      order.status = 'Pending';
    } else {
      order.status = 'In Progress';
    }

    await order.save();
    await order.populate({ path: 'owner', select: 'name email clinicName' });

    auditLog('ORDER_STAGE_UPDATED', {
      orderId: order._id,
      caseId: order.caseId,
      oldStage,
      newStage: stage,
      adminUsername: req.admin.username,
    });

    // Broadcast to admin SSE
    broadcastToAdmin('order-stage-updated', {
      orderId: order._id,
      caseId: order.caseId,
      oldStage,
      newStage: stage,
      status: order.status,
    });

    // Broadcast to the owning dentist SSE
    const ownerId = order.owner?._id ? order.owner._id.toString() : order.owner.toString();
    broadcastToUser(ownerId, 'order-stage-updated', {
      orderId: order._id,
      caseId: order.caseId,
      oldStage,
      newStage: stage,
      status: order.status,
      patientName: order.patientName,
    });

    return res.json({ message: `Stage updated to "${stage}".`, order });
  } catch (error) {
    logger.error('Admin stage update error', { error: error.message });
    return res.status(500).json({ message: 'Failed to update stage.' });
  }
};

// ─── DELETE /api/admin/orders/:id ─────────────────────────────────────────────
export const deleteOrder = async (req, res) => {
  try {
    const order = await LabOrder.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    auditLog('ORDER_DELETED_BY_ADMIN', { orderId: req.params.id, adminUsername: req.admin.username });
    
    broadcastToAdmin('order-deleted', { orderId: req.params.id });
    broadcastToUser(order.owner.toString(), 'order-deleted', { orderId: req.params.id });

    return res.json({ message: 'Order deleted successfully.' });
  } catch (error) {
    logger.error('Admin delete order error', { error: error.message });
    return res.status(500).json({ message: 'Failed to delete order.' });
  }
};

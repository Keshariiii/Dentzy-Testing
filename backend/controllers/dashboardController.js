import LabOrder from '../models/LabOrder.js';
import Payment from '../models/Payment.js';
import logger, { auditLog } from '../utils/logger.js';
import { userClients } from './adminController.js';

/**
 * Escape regex special characters to prevent ReDoS and syntax crashes.
 */
export const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ORDER_SORT_FIELDS = ['createdAt', 'dueDate', 'patientName', 'caseId', 'status', 'priority', 'serviceType'];
const PAYMENT_SORT_FIELDS = ['invoiceDate', 'dueDate', 'patientName', 'caseId', 'invoiceNumber', 'amount', 'status', 'createdAt'];

// ─── GET /api/dashboard/events ────────────────────────────────────────────────
export const sseEvents = (req, res) => {
  const userId = req.user._id.toString();

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send initial connection confirmation
  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'User SSE connected' })}\n\n`);

  // Register this client
  if (!userClients.has(userId)) {
    userClients.set(userId, new Set());
  }
  userClients.get(userId).add(res);
  logger.info(`User SSE connected`, { userId, totalClients: userClients.get(userId).size });

  // Heartbeat every 25 seconds
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch { clearInterval(heartbeat); }
  }, 25000);

  // Cleanup on disconnect
  req.on('close', () => {
    const clients = userClients.get(userId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) userClients.delete(userId);
    }
    clearInterval(heartbeat);
    logger.info(`User SSE disconnected`, { userId });
  });
};

// ─── GET /api/dashboard/stats ─────────────────────────────────────────────────
export const getStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const [
      totalOrders,
      pendingOrders,
      inProgressOrders,
      completedOrders,
      totalPayments,
      paidPayments,
      pendingPayments,
      overduePayments,
    ] = await Promise.all([
      LabOrder.countDocuments({ owner: userId }),
      LabOrder.countDocuments({ owner: userId, status: 'Pending' }),
      LabOrder.countDocuments({ owner: userId, status: 'In Progress' }),
      LabOrder.countDocuments({ owner: userId, status: 'Completed' }),
      Payment.countDocuments({ owner: userId }),
      Payment.countDocuments({ owner: userId, status: 'Paid' }),
      Payment.countDocuments({ owner: userId, status: 'Pending' }),
      Payment.countDocuments({ owner: userId, status: 'Overdue' }),
    ]);

    // Total revenue collected
    const revenueAgg = await Payment.aggregate([
      { $match: { owner: userId, status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    return res.json({
      orders: { total: totalOrders, pending: pendingOrders, inProgress: inProgressOrders, completed: completedOrders },
      payments: { total: totalPayments, paid: paidPayments, pending: pendingPayments, overdue: overduePayments },
      totalRevenue,
    });
  } catch (error) {
    logger.error('Dashboard stats error', { error: error.message, userId: req.user._id });
    return res.status(500).json({ message: 'Failed to load stats.' });
  }
};

// ─── GET /api/dashboard/orders ────────────────────────────────────────────────
export const getOrders = async (req, res) => {
  try {
    const { status, search, limit = 20 } = req.query;
    
    // Whitelist sort fields and order
    const sort = ORDER_SORT_FIELDS.includes(req.query.sort) ? req.query.sort : 'createdAt';
    const order = req.query.order === 'asc' ? 'asc' : 'desc';

    const filter = { owner: req.user._id };
    if (status && status !== 'all') filter.status = status;
    if (search) {
      const safeSearch = escapeRegex(search.trim());
      if (safeSearch) {
        filter.$or = [
          { patientName: { $regex: safeSearch, $options: 'i' } },
          { caseId: { $regex: safeSearch, $options: 'i' } },
        ];
      }
    }
    const orders = await LabOrder.find(filter)
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .limit(Number(limit));
    return res.json({ orders });
  } catch (error) {
    logger.error('Dashboard orders error', { error: error.message });
    return res.status(500).json({ message: 'Failed to load orders.' });
  }
};

// ─── POST /api/dashboard/orders ───────────────────────────────────────────────
// Body is pre-validated by Zod (createOrderSchema)
export const createOrder = async (req, res) => {
  try {
    const { patientName, caseId: suppliedCaseId, serviceType, status, dueDate, notes, priority } = req.body;
    // Auto-generate caseId if dentist didn't supply one (same format as admin creates)
    const now = new Date(); const datePart = `${String(now.getDate()).padStart(2,'0')}${String(now.getMonth()+1).padStart(2,'0')}${now.getFullYear()}`;
    const caseId = suppliedCaseId || `DZ-${datePart}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const order = await LabOrder.create({
      owner: req.user._id, patientName, caseId, serviceType, status, dueDate, notes, priority,
      stage: 'received', createdBy: 'dentist',
    });

    auditLog('ORDER_CREATED_BY_DENTIST', { orderId: order._id, caseId, dentistId: req.user._id });

    return res.status(201).json({ message: 'Order created.', order });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Case ID already exists. Please use a unique Case ID.' });
    }
    logger.error('Dashboard create order error', { error: error.message });
    return res.status(500).json({ message: 'Failed to create order.' });
  }
};

// ─── PATCH /api/dashboard/orders/:id ─────────────────────────────────────────
// Body is pre-validated by Zod (updateOrderSchema)
export const updateOrder = async (req, res) => {
  try {
    const order = await LabOrder.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    auditLog('ORDER_UPDATED_BY_DENTIST', { orderId: order._id, dentistId: req.user._id });

    return res.json({ message: 'Order updated.', order });
  } catch (error) {
    logger.error('Dashboard update order error', { error: error.message });
    return res.status(500).json({ message: 'Failed to update order.' });
  }
};

// ─── DELETE /api/dashboard/orders/:id ────────────────────────────────────────
export const deleteOrder = async (req, res) => {
  try {
    const order = await LabOrder.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    auditLog('ORDER_DELETED_BY_DENTIST', { orderId: req.params.id, dentistId: req.user._id });

    return res.json({ message: 'Order deleted.' });
  } catch (error) {
    logger.error('Dashboard delete order error', { error: error.message });
    return res.status(500).json({ message: 'Failed to delete order.' });
  }
};

// ─── GET /api/dashboard/payments ─────────────────────────────────────────────
export const getPayments = async (req, res) => {
  try {
    const { status, search, limit = 20 } = req.query;

    // Whitelist sort fields and order
    const sort = PAYMENT_SORT_FIELDS.includes(req.query.sort) ? req.query.sort : 'invoiceDate';
    const order = req.query.order === 'asc' ? 'asc' : 'desc';

    const filter = { owner: req.user._id };
    if (status && status !== 'all') filter.status = status;
    if (search) {
      const safeSearch = escapeRegex(search.trim());
      if (safeSearch) {
        filter.$or = [
          { patientName: { $regex: safeSearch, $options: 'i' } },
          { caseId:       { $regex: safeSearch, $options: 'i' } },
          { invoiceNumber:{ $regex: safeSearch, $options: 'i' } },
        ];
      }
    }
    const payments = await Payment.find(filter)
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .limit(Number(limit));
    return res.json({ payments });
  } catch (error) {
    logger.error('Dashboard payments error', { error: error.message });
    return res.status(500).json({ message: 'Failed to load payments.' });
  }
};

// ─── POST /api/dashboard/payments ─────────────────────────────────────────────
// Body is pre-validated by Zod (createPaymentSchema)
export const createPayment = async (req, res) => {
  try {
    const { patientName, caseId, invoiceNumber, amount, status, invoiceDate, dueDate, description } = req.body;
    const payment = await Payment.create({
      owner: req.user._id, patientName, caseId, invoiceNumber, amount, status, invoiceDate, dueDate, description,
    });

    auditLog('PAYMENT_CREATED', { paymentId: payment._id, caseId, dentistId: req.user._id });

    return res.status(201).json({ message: 'Payment record created.', payment });
  } catch (error) {
    logger.error('Dashboard create payment error', { error: error.message });
    return res.status(500).json({ message: 'Failed to create payment.' });
  }
};

// ─── GET /api/dashboard/me ────────────────────────────────────────────────────
export const getMe = (req, res) => {
  return res.json({ user: req.user });
};

import { Hono } from 'hono';
import { validate } from '../middleware/validate.js';
import { verifyAdmin } from '../middleware/auth.js';
import { adminLoginSchema, rejectUserSchema, createOrderSchema, updateOrderStageSchema } from '../validators/admin.js';
import { signJWT } from '../utils/crypto.js';
import { newId, now } from '../utils/id.js';
import logger, { auditLog } from '../utils/logger.js';
import { sendUserApprovedEmail, sendUserRejectedEmail } from '../utils/email.js';
import { checkRateLimit, getClientIP } from '../utils/rateLimit.js';

const admin = new Hono();

// ── Cookie helpers ───────────────────────────────────────────────────────────
const cookieHeader = (name, value, maxAge) =>
  `${name}=${value}; HttpOnly; Path=/; Max-Age=${Math.floor(maxAge / 1000)}; SameSite=None; Secure`;
const clearCookieHeader = (name) => `${name}=; HttpOnly; Path=/; Max-Age=0; SameSite=None; Secure`;

// ── Timing-safe compare ─────────────────────────────────────────────────────
// ponytail: portable constant-time compare — works on all Workers runtimes
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// Stage → status sync helper
const stageToStatus = (stage) => {
  if (stage === 'completed') return 'Completed';
  if (stage === 'received') return 'Pending';
  return 'In Progress';
};

// POST /api/admin/login
admin.post('/login', validate(adminLoginSchema), async (c) => {
  const { username, password } = c.get('body');

  // Rate limit: 5 admin login attempts per 15 min per IP
  const ip = getClientIP(c);
  const rl = await checkRateLimit(c.env.DB, `admin-login:${ip}`, { windowMs: 15 * 60 * 1000, max: 5 });
  if (!rl.allowed) {
    c.header('Retry-After', String(rl.retryAfterSecs));
    return c.json({ message: `Too many login attempts. Please try again in ${Math.ceil(rl.retryAfterSecs / 60)} minute(s).`, retryAfter: rl.retryAfterSecs }, 429);
  }

  const isUserValid = safeCompare(username, c.env.ADMIN_USERNAME || '');
  const isPassValid = safeCompare(password, c.env.ADMIN_PASSWORD || '');

  if (!isUserValid || !isPassValid)
    return c.json({ message: 'Invalid admin credentials.' }, 401);

  const token = await signJWT({ role: 'admin', username }, c.env.ADMIN_JWT_SECRET, '8h');

  auditLog('ADMIN_LOGIN', { username });
  c.header('Set-Cookie', cookieHeader('dentzy_admin_jwt', token, 8 * 60 * 60 * 1000));
  return c.json({ admin: { username, role: 'admin' } });
});

// POST /api/admin/logout
admin.post('/logout', (c) => {
  c.header('Set-Cookie', clearCookieHeader('dentzy_admin_jwt'));
  return c.json({ message: 'Admin logged out successfully.' });
});

// GET /api/admin/me
admin.get('/me', verifyAdmin(), (c) => c.json({ admin: c.get('admin') }));

// GET /api/admin/stats
admin.get('/stats', verifyAdmin(), async (c) => {
  try {
    const row = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END), 0) as approved,
        COALESCE(SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END), 0) as rejected
      FROM users
    `).first();
    return c.json(row);
  } catch (error) {
    logger.error('Admin stats error', { error: error.message });
    return c.json({ message: 'Failed to load stats.' }, 500);
  }
});

// GET /api/admin/users
admin.get('/users', verifyAdmin(), async (c) => {
  try {
    const status = c.req.query('status');
    const sortFields = ['createdAt', 'name', 'email', 'status', 'clinicName'];
    const sort = sortFields.includes(c.req.query('sort')) ? c.req.query('sort') : 'createdAt';
    const order = c.req.query('order') === 'asc' ? 'ASC' : 'DESC';

    let sql = 'SELECT id, name, email, status, adminNote, dob, phone, clinicName, address, createdAt, updatedAt FROM users';
    const params = [];
    if (status && status !== 'all') {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    sql += ` ORDER BY ${sort} ${order}`;

    const { results } = await c.env.DB.prepare(sql).bind(...params).all();
    return c.json({ users: results.map(u => ({ ...u, _id: u.id })) });
  } catch (error) {
    logger.error('Admin users list error', { error: error.message });
    return c.json({ message: 'Failed to load users.' }, 500);
  }
});

// GET /api/admin/users/approved
admin.get('/users/approved', verifyAdmin(), async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT id, name, email, clinicName FROM users WHERE status = 'approved' ORDER BY name ASC"
    ).all();
    // ponytail: frontend expects `_id` field from MongoDB; map `id` → `_id` for compat
    return c.json({ users: results.map(u => ({ ...u, _id: u.id })) });
  } catch (error) {
    logger.error('Approved users list error', { error: error.message });
    return c.json({ message: 'Failed to load approved users.' }, 500);
  }
});

// GET /api/admin/users/:id
admin.get('/users/:id', verifyAdmin(), async (c) => {
  try {
    const id = c.req.param('id');
    const user = await c.env.DB.prepare(
      'SELECT id, name, email, status, adminNote, dob, phone, clinicName, address, createdAt, updatedAt FROM users WHERE id = ?'
    ).bind(id).first();
    if (!user) return c.json({ message: 'User not found.' }, 404);

    const { results: orders } = await c.env.DB.prepare(
      'SELECT * FROM lab_orders WHERE ownerId = ? ORDER BY createdAt DESC'
    ).bind(id).all();

    return c.json({
      user: { ...user, _id: user.id },
      orders: orders.map(o => ({ ...o, _id: o.id })),
    });
  } catch (error) {
    logger.error('Admin getUserById error', { error: error.message });
    return c.json({ message: 'Failed to load user details.' }, 500);
  }
});

// PATCH /api/admin/users/:id/approve
admin.patch('/users/:id/approve', verifyAdmin(), async (c) => {
  try {
    const id = c.req.param('id');
    const ts = now();
    const { meta } = await c.env.DB.prepare(
      "UPDATE users SET status = 'approved', adminNote = '', updatedAt = ? WHERE id = ?"
    ).bind(ts, id).run();
    if (!meta.changes) return c.json({ message: 'User not found.' }, 404);

    const user = await c.env.DB.prepare(
      'SELECT id, name, email, status, adminNote, dob, phone, clinicName, address, createdAt, updatedAt FROM users WHERE id = ?'
    ).bind(id).first();

    auditLog('USER_APPROVED', { userId: id, adminUsername: c.get('admin').username });

    // ponytail: fire-and-forget approval email
    if (c.env.GMAIL_APP_PASSWORD) {
      const work = sendUserApprovedEmail({ env: c.env, user });
      if (c.executionCtx?.waitUntil) c.executionCtx.waitUntil(work);
      else await work;
    }

    return c.json({ message: 'User approved successfully.', user: { ...user, _id: user.id } });
  } catch (error) {
    logger.error('Approve user error', { error: error.message });
    return c.json({ message: 'Failed to approve user.' }, 500);
  }
});

// PATCH /api/admin/users/:id/reject
admin.patch('/users/:id/reject', verifyAdmin(), validate(rejectUserSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const { note } = c.get('body');
    const ts = now();
    const { meta } = await c.env.DB.prepare(
      "UPDATE users SET status = 'rejected', adminNote = ?, updatedAt = ? WHERE id = ?"
    ).bind(note || '', ts, id).run();
    if (!meta.changes) return c.json({ message: 'User not found.' }, 404);

    const user = await c.env.DB.prepare(
      'SELECT id, name, email, status, adminNote, dob, phone, clinicName, address, createdAt, updatedAt FROM users WHERE id = ?'
    ).bind(id).first();

    auditLog('USER_REJECTED', { userId: id, adminUsername: c.get('admin').username });

    // ponytail: fire-and-forget rejection email
    if (c.env.GMAIL_APP_PASSWORD) {
      const work = sendUserRejectedEmail({ env: c.env, user, note: note || '' });
      if (c.executionCtx?.waitUntil) c.executionCtx.waitUntil(work);
      else await work;
    }

    return c.json({ message: 'User rejected.', user: { ...user, _id: user.id } });
  } catch (error) {
    logger.error('Reject user error', { error: error.message });
    return c.json({ message: 'Failed to reject user.' }, 500);
  }
});

// DELETE /api/admin/users/:id
admin.delete('/users/:id', verifyAdmin(), async (c) => {
  try {
    const id = c.req.param('id');
    // FK CASCADE handles orders & payments
    // ponytail: D1 FK cascades are unreliable, delete children explicitly via batch
    const results = await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM lab_orders WHERE ownerId = ?').bind(id),
      c.env.DB.prepare('DELETE FROM payments WHERE ownerId = ?').bind(id),
      c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id),
    ]);
    if (!results[2].meta.changes) return c.json({ message: 'User not found.' }, 404);

    auditLog('USER_DELETED_BY_ADMIN', { userId: id, adminUsername: c.get('admin').username });
    return c.json({ message: 'User deleted successfully.' });
  } catch (error) {
    logger.error('Delete user error', { error: error.message });
    return c.json({ message: 'Failed to delete user.' }, 500);
  }
});

// GET /api/admin/orders
admin.get('/orders', verifyAdmin(), async (c) => {
  try {
    const status = c.req.query('status');
    const stage = c.req.query('stage');
    const search = c.req.query('search');
    const limit = Math.min(Math.max(parseInt(c.req.query('limit') || '100', 10) || 100, 1), 200);

    let sql = `SELECT o.*, u.name as ownerName, u.email as ownerEmail, u.clinicName as ownerClinicName
               FROM lab_orders o LEFT JOIN users u ON o.ownerId = u.id WHERE 1=1`;
    const params = [];

    if (status && status !== 'all') { sql += ' AND o.status = ?'; params.push(status); }
    if (stage && stage !== 'all') { sql += ' AND o.stage = ?'; params.push(stage); }
    if (search) {
      sql += ' AND (o.patientName LIKE ? OR o.caseId LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY o.createdAt DESC LIMIT ?';
    params.push(limit);

    const { results } = await c.env.DB.prepare(sql).bind(...params).all();
    // Map to match frontend expectations (owner object)
    const orders = results.map(r => ({
      ...r,
      _id: r.id,
      owner: { _id: r.ownerId, name: r.ownerName, email: r.ownerEmail, clinicName: r.ownerClinicName },
    }));
    return c.json({ orders });
  } catch (error) {
    logger.error('Admin orders list error', { error: error.message });
    return c.json({ message: 'Failed to load orders.' }, 500);
  }
});

// POST /api/admin/orders
admin.post('/orders', verifyAdmin(), validate(createOrderSchema), async (c) => {
  try {
    const { dentistId, patientName, serviceType, priority, dueDate, notes } = c.get('body');

    const dentist = await c.env.DB.prepare("SELECT id, name, email, status FROM users WHERE id = ?").bind(dentistId).first();
    if (!dentist) return c.json({ message: 'Dentist not found.' }, 404);
    if (dentist.status !== 'approved') return c.json({ message: 'Dentist is not approved.' }, 400);

    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Array.from(crypto.getRandomValues(new Uint8Array(3)), b => b.toString(36)).join('').substring(0, 4).toUpperCase();
    const caseId = `DZ-${datePart}-${random}`;
    const id = newId();
    const ts = now();

    await c.env.DB.prepare(
      `INSERT INTO lab_orders (id, ownerId, patientName, caseId, serviceType, status, stage, dueDate, notes, priority, createdBy, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 'Pending', 'received', ?, ?, ?, 'admin', ?, ?)`
    ).bind(id, dentistId, patientName, caseId, serviceType || 'Other', dueDate || null, notes || '', priority || 'Normal', ts, ts).run();

    const order = await c.env.DB.prepare('SELECT * FROM lab_orders WHERE id = ?').bind(id).first();

    auditLog('ORDER_CREATED', { orderId: id, caseId, dentistId, adminUsername: c.get('admin').username });

    return c.json({
      message: 'Order created.',
      order: { ...order, _id: order.id, owner: { _id: dentist.id, name: dentist.name, email: dentist.email } },
    }, 201);
  } catch (error) {
    logger.error('Admin create order error', { error: error.message });
    return c.json({ message: 'Failed to create order.' }, 500);
  }
});

// PATCH /api/admin/orders/:id/stage
admin.patch('/orders/:id/stage', verifyAdmin(), validate(updateOrderStageSchema), async (c) => {
  try {
    const orderId = c.req.param('id');
    const { stage } = c.get('body');
    const status = stageToStatus(stage);
    const ts = now();

    const { meta } = await c.env.DB.prepare(
      'UPDATE lab_orders SET stage = ?, status = ?, updatedAt = ? WHERE id = ?'
    ).bind(stage, status, ts, orderId).run();
    if (!meta.changes) return c.json({ message: 'Order not found.' }, 404);

    const order = await c.env.DB.prepare(
      'SELECT o.*, u.name as ownerName, u.email as ownerEmail, u.clinicName as ownerClinicName FROM lab_orders o LEFT JOIN users u ON o.ownerId = u.id WHERE o.id = ?'
    ).bind(orderId).first();

    auditLog('ORDER_STAGE_UPDATED', { orderId, caseId: order.caseId, newStage: stage, adminUsername: c.get('admin').username });

    return c.json({
      message: `Stage updated to "${stage}".`,
      order: { ...order, _id: order.id, owner: { _id: order.ownerId, name: order.ownerName, email: order.ownerEmail, clinicName: order.ownerClinicName } },
    });
  } catch (error) {
    logger.error('Admin stage update error', { error: error.message });
    return c.json({ message: 'Failed to update stage.' }, 500);
  }
});

// DELETE /api/admin/orders/:id
admin.delete('/orders/:id', verifyAdmin(), async (c) => {
  try {
    const orderId = c.req.param('id');
    const { meta } = await c.env.DB.prepare('DELETE FROM lab_orders WHERE id = ?').bind(orderId).run();
    if (!meta.changes) return c.json({ message: 'Order not found.' }, 404);

    auditLog('ORDER_DELETED_BY_ADMIN', { orderId, adminUsername: c.get('admin').username });
    return c.json({ message: 'Order deleted successfully.' });
  } catch (error) {
    logger.error('Admin delete order error', { error: error.message });
    return c.json({ message: 'Failed to delete order.' }, 500);
  }
});

export default admin;

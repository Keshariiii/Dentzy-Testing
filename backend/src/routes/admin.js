import { Hono } from 'hono';
import { validate } from '../middleware/validate.js';
import { verifyAdmin } from '../middleware/auth.js';
import { adminLoginSchema, rejectUserSchema, createOrderSchema, updateOrderStageSchema, updatePaymentStatusSchema } from '../validators/admin.js';
import { signJWT } from '../utils/crypto.js';
import { newId, now } from '../utils/id.js';
import logger, { auditLog } from '../utils/logger.js';
import { sendUserApprovedEmail, sendUserRejectedEmail, sendPaymentReminderEmail } from '../utils/email.js';
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
      `SELECT o.*, COALESCE(p.amount, 0) as paymentAmount, COALESCE(p.status, 'Pending') as paymentStatus
       FROM lab_orders o LEFT JOIN payments p ON o.caseId = p.caseId AND o.ownerId = p.ownerId
       WHERE o.ownerId = ? ORDER BY o.createdAt DESC`
    ).bind(id).all();

    return c.json({
      user: { ...user, _id: user.id },
      orders: orders.map(o => ({ ...o, _id: o.id, amount: o.paymentAmount, paymentAmount: o.paymentAmount, paymentStatus: o.paymentStatus })),
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

    let sql = `SELECT o.*, u.name as ownerName, u.email as ownerEmail, u.clinicName as ownerClinicName,
               COALESCE(p.status, 'Pending') as paymentStatus,
               COALESCE(p.paymentMode, '') as paymentMode,
               COALESCE(p.referenceNumber, '') as referenceNumber,
               COALESCE(p.amount, 0) as paymentAmount,
               p.paidAt
               FROM lab_orders o LEFT JOIN users u ON o.ownerId = u.id
               LEFT JOIN payments p ON o.caseId = p.caseId AND o.ownerId = p.ownerId WHERE 1=1`;
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
    const orders = results.map(r => ({
      ...r,
      _id: r.id,
      paymentStatus: r.paymentStatus,
      paymentMode: r.paymentMode,
      referenceNumber: r.referenceNumber,
      paymentAmount: r.paymentAmount,
      paidAt: r.paidAt,
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
    const { dentistId, patientName, serviceType, priority, dueDate, notes, amount } = c.get('body');

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

    // Auto-create payment entry for this order with specified amount
    const paymentId = newId();
    await c.env.DB.prepare(
      `INSERT INTO payments (id, ownerId, patientName, caseId, invoiceNumber, amount, currency, status, invoiceDate, dueDate, description, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 'INR', 'Pending', ?, ?, '', ?, ?)`
    ).bind(paymentId, dentistId, patientName, caseId, `INV-${caseId}`, amount || 0, ts, dueDate || null, ts, ts).run();

    auditLog('ORDER_CREATED', { orderId: id, caseId, dentistId, adminUsername: c.get('admin').username });

    return c.json({
      message: 'Order created.',
      order: { ...order, _id: order.id, amount: amount || 0, paymentAmount: amount || 0, paymentStatus: 'Pending', owner: { _id: dentist.id, name: dentist.name, email: dentist.email } },
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
    const order = await c.env.DB.prepare('SELECT caseId, ownerId FROM lab_orders WHERE id = ?').bind(orderId).first();
    if (!order) return c.json({ message: 'Order not found.' }, 404);

    await c.env.DB.prepare('DELETE FROM lab_orders WHERE id = ?').bind(orderId).run();
    await c.env.DB.prepare('DELETE FROM payments WHERE caseId = ?').bind(order.caseId).run();

    auditLog('ORDER_DELETED_BY_ADMIN', { orderId, caseId: order.caseId, adminUsername: c.get('admin').username });
    return c.json({ message: 'Order deleted successfully.' });
  } catch (error) {
    logger.error('Admin delete order error', { error: error.message });
    return c.json({ message: 'Failed to delete order.' }, 500);
  }
});

// DELETE /api/admin/payments/:id
admin.delete('/payments/:id', verifyAdmin(), async (c) => {
  try {
    const paymentId = c.req.param('id');
    let res = await c.env.DB.prepare('DELETE FROM payments WHERE id = ?').bind(paymentId).run();
    if (!res.meta.changes) {
      res = await c.env.DB.prepare('DELETE FROM payments WHERE caseId = ?').bind(paymentId).run();
    }
    if (!res.meta.changes) return c.json({ message: 'Payment record not found.' }, 404);

    auditLog('PAYMENT_DELETED_BY_ADMIN', { paymentId, adminUsername: c.get('admin').username });
    return c.json({ message: 'Payment record deleted successfully.' });
  } catch (error) {
    logger.error('Admin delete payment error', { error: error.message });
    return c.json({ message: 'Failed to delete payment.' }, 500);
  }
});

// PATCH /api/admin/payments/:id/amount — update payment amount
admin.patch('/payments/:id/amount', verifyAdmin(), async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const amount = Number(body.amount);
    if (isNaN(amount) || amount < 0) {
      return c.json({ message: 'Amount must be a valid positive number.' }, 400);
    }
    const ts = now();
    let res = await c.env.DB.prepare('UPDATE payments SET amount = ?, updatedAt = ? WHERE id = ?').bind(amount, ts, id).run();
    if (!res.meta.changes) {
      res = await c.env.DB.prepare('UPDATE payments SET amount = ?, updatedAt = ? WHERE caseId = ?').bind(amount, ts, id).run();
    }
    if (!res.meta.changes) {
      const order = await c.env.DB.prepare('SELECT caseId FROM lab_orders WHERE id = ?').bind(id).first();
      if (order) {
        res = await c.env.DB.prepare('UPDATE payments SET amount = ?, updatedAt = ? WHERE caseId = ?').bind(amount, ts, order.caseId).run();
      }
    }
    if (!res.meta.changes) {
      return c.json({ message: 'Payment record not found.' }, 404);
    }

    auditLog('PAYMENT_AMOUNT_UPDATED', { id, amount, adminUsername: c.get('admin').username });
    return c.json({ message: `Amount updated to ₹${amount.toLocaleString('en-IN')}.`, amount });
  } catch (error) {
    logger.error('Admin update payment amount error', { error: error.message });
    return c.json({ message: 'Failed to update payment amount.' }, 500);
  }
});

// GET /api/admin/payments — dedicated admin payments view with summary metrics
admin.get('/payments', verifyAdmin(), async (c) => {
  try {
    const status = c.req.query('status');
    const mode = c.req.query('mode');
    const search = c.req.query('search');
    const limit = Math.min(Math.max(parseInt(c.req.query('limit') || '100', 10) || 100, 1), 500);

    // Summary metrics — always computed across all records (unfiltered)
    const summaryRow = await c.env.DB.prepare(`
      SELECT
        COALESCE(SUM(amount), 0) as totalBilled,
        COALESCE(SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END), 0) as totalCollected,
        COALESCE(SUM(CASE WHEN status != 'Paid' THEN amount ELSE 0 END), 0) as totalPending,
        COALESCE(SUM(CASE WHEN status = 'Paid' AND paymentMode = 'Cash' THEN amount ELSE 0 END), 0) as cashTotal,
        COALESCE(SUM(CASE WHEN status = 'Paid' AND paymentMode = 'Cheque' THEN amount ELSE 0 END), 0) as chequeTotal,
        COALESCE(SUM(CASE WHEN status = 'Paid' AND paymentMode = 'UPI' THEN amount ELSE 0 END), 0) as upiTotal
      FROM payments
    `).first();

    // Filtered list query
    let sql = `SELECT o.id, o.patientName, o.caseId, o.serviceType, o.status as orderStatus, o.dueDate, o.createdAt,
       u.name as ownerName, u.email as ownerEmail, u.clinicName as ownerClinicName,
       COALESCE(p.status, 'Pending') as paymentStatus,
       COALESCE(p.paymentMode, '') as paymentMode,
       COALESCE(p.referenceNumber, '') as referenceNumber,
       COALESCE(p.amount, 0) as amount,
       p.invoiceNumber, p.paidAt
       FROM lab_orders o LEFT JOIN users u ON o.ownerId = u.id
       LEFT JOIN payments p ON o.caseId = p.caseId AND o.ownerId = p.ownerId WHERE 1=1`;
    const params = [];

    if (status && status !== 'all') {
      sql += " AND COALESCE(p.status, 'Pending') = ?";
      params.push(status);
    }
    if (mode && mode !== 'all') {
      sql += " AND COALESCE(p.paymentMode, '') = ?";
      params.push(mode);
    }
    if (search) {
      sql += ' AND (o.patientName LIKE ? OR o.caseId LIKE ? OR u.name LIKE ? OR u.clinicName LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY o.createdAt DESC LIMIT ?';
    params.push(limit);

    const { results } = await c.env.DB.prepare(sql).bind(...params).all();

    return c.json({
      summary: {
        totalBilled: summaryRow.totalBilled,
        totalCollected: summaryRow.totalCollected,
        totalPending: summaryRow.totalPending,
        byMode: { Cash: summaryRow.cashTotal, Cheque: summaryRow.chequeTotal, UPI: summaryRow.upiTotal },
      },
      payments: results.map(r => ({
        ...r,
        _id: r.id,
        owner: { name: r.ownerName, email: r.ownerEmail, clinicName: r.ownerClinicName },
      })),
    });
  } catch (error) {
    logger.error('Admin payments list error', { error: error.message });
    return c.json({ message: 'Failed to load payments.' }, 500);
  }
});

// PATCH /api/admin/orders/:id/payment — record or revert payment with mode-specific details
admin.patch('/orders/:id/payment', verifyAdmin(), validate(updatePaymentStatusSchema), async (c) => {
  try {
    const orderId = c.req.param('id');
    const { status, paymentMode, referenceNumber, amount, notes } = c.get('body');
    const ts = now();

    const order = await c.env.DB.prepare('SELECT * FROM lab_orders WHERE id = ? OR caseId = ?').bind(orderId, orderId).first();
    if (!order) return c.json({ message: 'Order not found.' }, 404);

    const modeVal = status === 'Pending' ? '' : (paymentMode || '');
    const refVal = status === 'Pending' ? '' : (referenceNumber || '');
    const paidAtVal = status === 'Paid' ? ts : null;
    const descVal = status === 'Pending' ? '' : (notes || '');

    // Upsert payment record
    const existing = await c.env.DB.prepare('SELECT id FROM payments WHERE caseId = ? AND ownerId = ?').bind(order.caseId, order.ownerId).first();
    if (existing) {
      const updates = ['status = ?', 'paymentMode = ?', 'referenceNumber = ?', 'paidAt = ?', 'description = ?', 'updatedAt = ?'];
      const binds = [status, modeVal, refVal, paidAtVal, descVal, ts];
      if (amount !== undefined) { updates.push('amount = ?'); binds.push(amount); }
      binds.push(existing.id);
      await c.env.DB.prepare(`UPDATE payments SET ${updates.join(', ')} WHERE id = ?`).bind(...binds).run();
    } else {
      const pid = newId();
      await c.env.DB.prepare(
        `INSERT INTO payments (id, ownerId, patientName, caseId, invoiceNumber, amount, currency, status, invoiceDate, dueDate, description, paymentMode, referenceNumber, paidAt, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, 'INR', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(pid, order.ownerId, order.patientName, order.caseId, `INV-${order.caseId}`, amount || 0, status, ts, order.dueDate || null, descVal, modeVal, refVal, paidAtVal, ts, ts).run();
    }

    auditLog('PAYMENT_STATUS_UPDATED', { orderId, caseId: order.caseId, newStatus: status, paymentMode: modeVal, referenceNumber: refVal, adminUsername: c.get('admin').username });

    const modeLabel = modeVal ? ` via ${modeVal}` : '';
    const refLabel = refVal ? ` (Ref: ${refVal})` : '';
    return c.json({
      message: `Payment marked as ${status}${modeLabel}${refLabel}.`,
      paymentStatus: status, paymentMode: modeVal, referenceNumber: refVal,
    });
  } catch (error) {
    logger.error('Admin payment update error', { error: error.message });
    return c.json({ message: 'Failed to update payment.' }, 500);
  }
});

// POST /api/admin/orders/:id/remind-payment — send payment reminder email
admin.post('/orders/:id/remind-payment', verifyAdmin(), async (c) => {
  try {
    const orderId = c.req.param('id');
    const order = await c.env.DB.prepare(
      'SELECT o.*, u.name as ownerName, u.email as ownerEmail FROM lab_orders o LEFT JOIN users u ON o.ownerId = u.id WHERE o.id = ?'
    ).bind(orderId).first();
    if (!order) return c.json({ message: 'Order not found.' }, 404);
    if (!order.ownerEmail) return c.json({ message: 'Dentist email not found.' }, 400);

    const payment = await c.env.DB.prepare('SELECT * FROM payments WHERE caseId = ? AND ownerId = ?').bind(order.caseId, order.ownerId).first();

    await sendPaymentReminderEmail({
      env: c.env,
      dentist: { name: order.ownerName, email: order.ownerEmail },
      order,
      payment,
    });

    auditLog('PAYMENT_REMINDER_SENT', { orderId, caseId: order.caseId, dentistEmail: order.ownerEmail, adminUsername: c.get('admin').username });
    return c.json({ message: `Payment reminder sent to ${order.ownerEmail}.` });
  } catch (error) {
    logger.error('Admin payment reminder error', { error: error.message });
    return c.json({ message: 'Failed to send reminder.' }, 500);
  }
});

export default admin;

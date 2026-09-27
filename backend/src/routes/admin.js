import { Hono } from 'hono';
import { validate } from '../middleware/validate.js';
import { verifyAdmin } from '../middleware/auth.js';
import { adminLoginSchema, rejectUserSchema, createOrderSchema, updateOrderStageSchema, updatePaymentStatusSchema, createStaffSchema } from '../validators/admin.js';
import { signJWT, hashPassword } from '../utils/crypto.js';
import { newId, now } from '../utils/id.js';
import logger, { auditLog } from '../utils/logger.js';
import { sendUserApprovedEmail, sendUserRejectedEmail, sendPaymentReminderEmail, sendStaffWelcomeEmail } from '../utils/email.js';
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
      `SELECT o.*, COALESCE(p.amount, 0) as paymentAmount, COALESCE(p.status, 'Pending') as paymentStatus,
       COALESCE(p.paymentMode, '') as paymentMode, COALESCE(p.referenceNumber, '') as referenceNumber, p.paidAt
       FROM lab_orders o LEFT JOIN payments p ON o.caseId = p.caseId AND o.ownerId = p.ownerId
       WHERE o.ownerId = ? ORDER BY o.createdAt DESC`
    ).bind(id).all();

    return c.json({
      user: { ...user, _id: user.id },
      orders: orders.map(o => ({ ...o, _id: o.id, amount: o.paymentAmount, paymentAmount: o.paymentAmount, paymentStatus: o.paymentStatus, paymentMode: o.paymentMode, referenceNumber: o.referenceNumber, paidAt: o.paidAt })),
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
    let sql = `SELECT o.id, o.ownerId, o.patientName, o.caseId, o.serviceType, o.status as orderStatus, o.dueDate, o.createdAt,
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

// ── Staff Management ────────────────────────────────────────────────────────

// GET /api/admin/staff -- list all staff
admin.get('/staff', verifyAdmin(), async (c) => {
  try {
    const rows = await c.env.DB.prepare(
      'SELECT id, username, displayName, email, designation, employeeId, status, createdAt, updatedAt FROM staff ORDER BY createdAt DESC'
    ).all();
    return c.json({ staff: rows.results || [] });
  } catch (err) {
    logger.error('Failed to fetch staff', { error: err.message });
    return c.json({ message: 'Failed to fetch staff.' }, 500);
  }
});

// POST /api/admin/staff -- create new staff account
admin.post('/staff', verifyAdmin(), validate(createStaffSchema), async (c) => {
  const { username, password, displayName, email, designation } = c.get('body');
  const id = newId();
  const ts = now();
  const hashed = await hashPassword(password);

  // ponytail: auto-generate employeeId from max existing
  const maxRow = await c.env.DB.prepare(
    "SELECT MAX(CAST(employeeId AS INTEGER)) as maxId FROM staff WHERE employeeId != ''"
  ).first();
  const employeeId = String(((maxRow?.maxId) || 0) + 1).padStart(4, '0');

  try {
    await c.env.DB.prepare(
      'INSERT INTO staff (id, username, password, displayName, email, designation, employeeId, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, username, hashed, displayName, email || '', designation || 'Lab Assistant', employeeId, 'active', ts, ts).run();

    auditLog('STAFF_CREATED', { username, displayName, employeeId, designation });

    // ponytail: fire-and-forget welcome email if email is provided
    if (email && c.env.GMAIL_APP_PASSWORD) {
      const work = sendStaffWelcomeEmail({ env: c.env, staffMember: { displayName, username, email, designation, employeeId } });
      if (c.executionCtx?.waitUntil) c.executionCtx.waitUntil(work);
      else await work;
    }

    return c.json({
      message: 'Staff account created.',
      staff: { id, username, displayName, email: email || '', designation: designation || 'Lab Assistant', employeeId, status: 'active', createdAt: ts },
    }, 201);
  } catch (err) {
    if (err.message?.includes('UNIQUE constraint')) {
      return c.json({ message: 'This username is already taken.' }, 409);
    }
    logger.error('Failed to create staff', { error: err.message });
    return c.json({ message: 'Failed to create staff account.' }, 500);
  }
});

// PATCH /api/admin/staff/:id -- edit staff details (displayName, email, designation)
admin.patch('/staff/:id', verifyAdmin(), async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const { displayName, email, designation } = body;
  const ts = now();

  const updates = ['updatedAt = ?'];
  const binds = [ts];

  if (displayName !== undefined) { updates.push('displayName = ?'); binds.push(displayName.trim()); }
  if (email !== undefined) { updates.push('email = ?'); binds.push(email.trim()); }
  if (designation !== undefined) { updates.push('designation = ?'); binds.push(designation); }

  binds.push(id);
  try {
    const { meta } = await c.env.DB.prepare(
      `UPDATE staff SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...binds).run();
    if (!meta.changes) return c.json({ message: 'Staff not found.' }, 404);

    auditLog('STAFF_EDITED', { staffId: id, displayName, email, designation });
    return c.json({ message: 'Staff details updated.' });
  } catch (err) {
    logger.error('Staff edit error', { error: err.message });
    return c.json({ message: 'Failed to update staff.' }, 500);
  }
});

// PATCH /api/admin/staff/:id/status -- toggle active/inactive
admin.patch('/staff/:id/status', verifyAdmin(), async (c) => {
  const { id } = c.req.param();
  const row = await c.env.DB.prepare(
    'SELECT id, status FROM staff WHERE id = ?'
  ).bind(id).first();
  if (!row) return c.json({ message: 'Staff not found.' }, 404);

  const newStatus = row.status === 'active' ? 'inactive' : 'active';
  await c.env.DB.prepare(
    'UPDATE staff SET status = ?, updatedAt = ? WHERE id = ?'
  ).bind(newStatus, now(), id).run();
  auditLog('STAFF_STATUS_CHANGED', { staffId: id, newStatus });
  return c.json({
    message: `Staff ${newStatus === 'active' ? 'activated' : 'deactivated'}.`,
    status: newStatus,
  });
});

// DELETE /api/admin/staff/:id -- delete staff account
admin.delete('/staff/:id', verifyAdmin(), async (c) => {
  const { id } = c.req.param();
  const row = await c.env.DB.prepare(
    'SELECT id, username FROM staff WHERE id = ?'
  ).bind(id).first();
  if (!row) return c.json({ message: 'Staff not found.' }, 404);

  // ponytail: clean up attendance records too
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM staff_attendance WHERE staff_id = ?').bind(id),
    c.env.DB.prepare('DELETE FROM staff WHERE id = ?').bind(id),
  ]);
  auditLog('STAFF_DELETED', { staffId: id, username: row.username });
  return c.json({ message: 'Staff account deleted.' });
});

// ── Staff Attendance (Admin marks manually) ─────────────────────────────────

// POST /api/admin/staff/:id/attendance — mark attendance for a date
admin.post('/staff/:id/attendance', verifyAdmin(), async (c) => {
  try {
    const staffId = c.req.param('id');
    const body = await c.req.json();
    const { date, status } = body;

    if (!date || !status) return c.json({ message: 'Date and status are required.' }, 400);
    if (!['Present', 'Absent', 'Half-day'].includes(status))
      return c.json({ message: 'Status must be Present, Absent, or Half-day.' }, 400);

    // Verify staff exists
    const staff = await c.env.DB.prepare('SELECT id FROM staff WHERE id = ?').bind(staffId).first();
    if (!staff) return c.json({ message: 'Staff not found.' }, 404);

    const id = newId();
    const ts = now();

    // Upsert: if attendance for this date already exists, update it
    const existing = await c.env.DB.prepare(
      'SELECT id FROM staff_attendance WHERE staff_id = ? AND date = ?'
    ).bind(staffId, date).first();

    if (existing) {
      await c.env.DB.prepare(
        'UPDATE staff_attendance SET status = ?, logged_by_admin = ?, created_at = ? WHERE id = ?'
      ).bind(status, c.get('admin').username, ts, existing.id).run();
    } else {
      await c.env.DB.prepare(
        'INSERT INTO staff_attendance (id, staff_id, date, status, logged_by_admin, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(id, staffId, date, status, c.get('admin').username, ts).run();
    }

    auditLog('STAFF_ATTENDANCE_MARKED', { staffId, date, status, admin: c.get('admin').username });
    return c.json({ message: `Attendance marked as ${status} for ${date}.` });
  } catch (err) {
    logger.error('Admin attendance error', { error: err.message });
    return c.json({ message: 'Failed to mark attendance.' }, 500);
  }
});

// GET /api/admin/staff/:id/attendance — get attendance history for a staff member
admin.get('/staff/:id/attendance', verifyAdmin(), async (c) => {
  try {
    const staffId = c.req.param('id');
    const month = c.req.query('month'); // optional YYYY-MM filter

    let sql = 'SELECT * FROM staff_attendance WHERE staff_id = ?';
    const params = [staffId];

    if (month) {
      sql += ' AND date LIKE ?';
      params.push(`${month}%`);
    }
    sql += ' ORDER BY date DESC';

    const { results } = await c.env.DB.prepare(sql).bind(...params).all();
    return c.json({ attendance: results || [] });
  } catch (err) {
    logger.error('Admin attendance history error', { error: err.message });
    return c.json({ message: 'Failed to load attendance.' }, 500);
  }
});

// ── Inventory Oversight (Admin) ─────────────────────────────────────────────

// GET /api/admin/staff/inventory — admin sees full inventory
admin.get('/staff/inventory', verifyAdmin(), async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM inventory ORDER BY item_name ASC'
    ).all();
    return c.json({ items: results || [] });
  } catch (err) {
    logger.error('Admin inventory list error', { error: err.message });
    return c.json({ message: 'Failed to load inventory.' }, 500);
  }
});

// POST /api/admin/staff/inventory — admin adds inventory item
admin.post('/staff/inventory', verifyAdmin(), async (c) => {
  try {
    const body = await c.req.json();
    const { item_name, quantity, unit, min_stock } = body;
    if (!item_name || !unit) return c.json({ message: 'Item name and unit are required.' }, 400);

    const id = newId();
    const ts = now();
    await c.env.DB.prepare(
      'INSERT INTO inventory (id, item_name, quantity, unit, min_stock, updated_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, item_name.trim(), quantity || 0, unit.trim(), min_stock || 0, c.get('admin').username, ts, ts).run();

    auditLog('ADMIN_INVENTORY_ADDED', { id, item_name });
    return c.json({ message: 'Item added.', item: { id, item_name, quantity: quantity || 0, unit, min_stock: min_stock || 0, created_at: ts, updated_at: ts } }, 201);
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return c.json({ message: 'Item already exists.' }, 409);
    logger.error('Admin inventory add error', { error: err.message });
    return c.json({ message: 'Failed to add item.' }, 500);
  }
});

// PATCH /api/admin/staff/inventory/:id — admin updates inventory
admin.patch('/staff/inventory/:id', verifyAdmin(), async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { quantity, item_name, unit, min_stock } = body;
    const ts = now();

    const updates = ['updated_at = ?', 'updated_by = ?'];
    const binds = [ts, c.get('admin').username];

    if (quantity !== undefined) { updates.push('quantity = ?'); binds.push(quantity); }
    if (item_name !== undefined) { updates.push('item_name = ?'); binds.push(item_name.trim()); }
    if (unit !== undefined) { updates.push('unit = ?'); binds.push(unit.trim()); }
    if (min_stock !== undefined) { updates.push('min_stock = ?'); binds.push(min_stock); }

    binds.push(id);
    const { meta } = await c.env.DB.prepare(
      `UPDATE inventory SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...binds).run();
    if (!meta.changes) return c.json({ message: 'Item not found.' }, 404);

    auditLog('ADMIN_INVENTORY_UPDATED', { id });
    return c.json({ message: 'Inventory updated.' });
  } catch (err) {
    logger.error('Admin inventory update error', { error: err.message });
    return c.json({ message: 'Failed to update inventory.' }, 500);
  }
});

// DELETE /api/admin/staff/inventory/:id — admin deletes inventory item
admin.delete('/staff/inventory/:id', verifyAdmin(), async (c) => {
  try {
    const id = c.req.param('id');
    const { meta } = await c.env.DB.prepare('DELETE FROM inventory WHERE id = ?').bind(id).run();
    if (!meta.changes) return c.json({ message: 'Item not found.' }, 404);
    auditLog('ADMIN_INVENTORY_DELETED', { id });
    return c.json({ message: 'Item deleted.' });
  } catch (err) {
    logger.error('Admin inventory delete error', { error: err.message });
    return c.json({ message: 'Failed to delete item.' }, 500);
  }
});

// ── Staff Metrics / Leaderboard (Admin) ─────────────────────────────────────

// GET /api/admin/staff/metrics — leaderboard: cases processed + attendance per staff
admin.get('/staff/metrics', verifyAdmin(), async (c) => {
  try {
    const month = c.req.query('month') || new Date().toISOString().slice(0, 7); // YYYY-MM

    // Cases processed per staff this month
    const { results: caseResults } = await c.env.DB.prepare(`
      SELECT s.id, s.displayName, s.username, s.status,
        COALESCE(counts.total, 0) as casesProcessed
      FROM staff s
      LEFT JOIN (
        SELECT assigned_staff_id, COUNT(*) as total
        FROM lab_orders
        WHERE updatedAt >= ? AND assigned_staff_id IS NOT NULL
        GROUP BY assigned_staff_id
      ) counts ON s.id = counts.assigned_staff_id
      ORDER BY casesProcessed DESC
    `).bind(`${month}-01T00:00:00.000Z`).all();

    // Attendance summary per staff this month
    const { results: attendanceResults } = await c.env.DB.prepare(`
      SELECT staff_id,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as presentDays,
        SUM(CASE WHEN status = 'Half-day' THEN 1 ELSE 0 END) as halfDays,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absentDays
      FROM staff_attendance
      WHERE date LIKE ?
      GROUP BY staff_id
    `).bind(`${month}%`).all();

    // Merge attendance into staff list
    const attendanceMap = {};
    (attendanceResults || []).forEach(a => {
      attendanceMap[a.staff_id] = { presentDays: a.presentDays, halfDays: a.halfDays, absentDays: a.absentDays };
    });

    const leaderboard = (caseResults || []).map(s => ({
      id: s.id,
      displayName: s.displayName,
      username: s.username,
      status: s.status,
      casesProcessed: s.casesProcessed,
      ...(attendanceMap[s.id] || { presentDays: 0, halfDays: 0, absentDays: 0 }),
    }));

    return c.json({ month, leaderboard });
  } catch (err) {
    logger.error('Admin staff metrics error', { error: err.message });
    return c.json({ message: 'Failed to load metrics.' }, 500);
  }
});

export default admin;


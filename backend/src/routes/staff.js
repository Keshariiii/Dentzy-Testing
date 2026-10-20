import { Hono } from 'hono';
import { validate } from '../middleware/validate.js';
import { verifyStaff } from '../middleware/auth.js';
import { staffLoginSchema } from '../validators/staff.js';
import { comparePassword, hashPassword, signJWT } from '../utils/crypto.js';
import { newId, now } from '../utils/id.js';
import logger, { auditLog } from '../utils/logger.js';
import { checkRateLimit, getClientIP } from '../utils/rateLimit.js';

const staff = new Hono();

// ── Cookie helpers ───────────────────────────────────────────────────────────
const cookieHeader = (name, value, maxAge) =>
  `${name}=${value}; HttpOnly; Path=/; Max-Age=${Math.floor(maxAge / 1000)}; SameSite=Lax; Secure`;
const clearCookieHeader = (name) =>
  `${name}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure`;

// POST /api/staff/login
staff.post('/login', validate(staffLoginSchema), async (c) => {
  const { username, password } = c.get('body');

  const ip = getClientIP(c);
  const rl = await checkRateLimit(c.env.DB, `staff-login:${ip}`, {
    windowMs: 15 * 60 * 1000, max: 5,
  });
  if (!rl.allowed) {
    c.header('Retry-After', String(rl.retryAfterSecs));
    return c.json({
      message: `Too many login attempts. Please try again in ${Math.ceil(rl.retryAfterSecs / 60)} minute(s).`,
      retryAfter: rl.retryAfterSecs,
    }, 429);
  }

  const row = await c.env.DB.prepare(
    'SELECT * FROM staff WHERE username = ? COLLATE NOCASE'
  ).bind(username).first();
  if (!row) return c.json({ message: 'Invalid staff credentials.' }, 401);
  if (row.status !== 'active')
    return c.json({ message: 'Staff account is inactive.' }, 403);

  const valid = await comparePassword(password, row.password);
  if (!valid) return c.json({ message: 'Invalid staff credentials.' }, 401);

  const token = await signJWT(
    { id: row.id, role: 'staff', username: row.username },
    c.env.STAFF_JWT_SECRET,
    '8h'
  );

  auditLog('STAFF_LOGIN', { username: row.username });
  c.header('Set-Cookie', cookieHeader('dentzy_staff_jwt', token, 8 * 60 * 60 * 1000));
  return c.json({
    staff: {
      id: row.id,
      username: row.username,
      displayName: row.displayName,
      role: 'staff',
    },
  });
});

// POST /api/staff/logout
staff.post('/logout', (c) => {
  c.header('Set-Cookie', clearCookieHeader('dentzy_staff_jwt'));
  return c.json({ message: 'Staff logged out successfully.' });
});

// GET /api/staff/me
staff.get('/me', verifyStaff(), async (c) => {
  const row = await c.env.DB.prepare(
    'SELECT id, username, displayName, email, phone, dob, status FROM staff WHERE id = ?'
  ).bind(c.get('staff').id).first();
  return c.json({ staff: { ...row, role: 'staff' } });
});

// GET /api/staff/notice — fetch broadcast notice for authenticated staff
staff.get('/notice', verifyStaff(), async (c) => {
  try {
    const row = await c.env.DB.prepare(
      'SELECT value, updated_at FROM app_settings WHERE key = ?'
    ).bind('staff_notice_bar').first();
    if (!row) return c.json({ enabled: false, message: '' });
    const notice = JSON.parse(row.value);
    return c.json({ enabled: Boolean(notice.enabled), message: notice.message || notice.messages?.[0] || '', updatedAt: row.updated_at });
  } catch {
    return c.json({ enabled: false, message: '' });
  }
});

// PUT /api/staff/profile
staff.put('/profile', verifyStaff(), async (c) => {
  try {
    const staffId = c.get('staff').id;
    const { displayName, email, phone, dob } = await c.req.json();
    const ts = now();

    const { meta } = await c.env.DB.prepare(
      'UPDATE staff SET displayName = ?, email = ?, phone = ?, dob = ?, updatedAt = ? WHERE id = ?'
    ).bind(displayName || '', email || '', phone || '', dob || '', ts, staffId).run();

    if (!meta.changes) return c.json({ message: 'Staff not found.' }, 404);

    const updated = await c.env.DB.prepare(
      'SELECT id, username, displayName, email, phone, dob, status FROM staff WHERE id = ?'
    ).bind(staffId).first();
    auditLog('STAFF_PROFILE_UPDATED', { staffId });

    return c.json({ message: 'Profile updated.', staff: { ...updated, role: 'staff' } });
  } catch (err) {
    logger.error('Staff profile update error', { error: err.message });
    return c.json({ message: 'Failed to update profile.' }, 500);
  }
});

// PUT /api/staff/change-password
staff.put('/change-password', verifyStaff(), async (c) => {
  try {
    const staffId = c.get('staff').id;
    const { currentPassword, newPassword } = await c.req.json();

    if (!currentPassword || !newPassword) {
      return c.json({ message: 'Current and new passwords are required.' }, 400);
    }
    if (newPassword.length < 6) {
      return c.json({ message: 'New password must be at least 6 characters.' }, 400);
    }

    const row = await c.env.DB.prepare('SELECT password FROM staff WHERE id = ?').bind(staffId).first();
    if (!row) return c.json({ message: 'Staff not found.' }, 404);

    const valid = await comparePassword(currentPassword, row.password);
    if (!valid) return c.json({ message: 'Incorrect current password.' }, 401);

    const hashed = await hashPassword(newPassword);
    const ts = now();
    await c.env.DB.prepare('UPDATE staff SET password = ?, updatedAt = ? WHERE id = ?').bind(hashed, ts, staffId).run();

    auditLog('STAFF_PASSWORD_CHANGED', { staffId });
    return c.json({ message: 'Password updated successfully.' });
  } catch (err) {
    logger.error('Staff password change error', { error: err.message });
    return c.json({ message: 'Failed to update password.' }, 500);
  }
});

// ── Staff Orders ─────────────────────────────────────────────────────────────

// GET /api/staff/orders — staff sees all orders (read-only financial data)
staff.get('/orders', verifyStaff(), async (c) => {
  try {
    const staffId = c.get('staff').id;
    const filter = c.req.query('filter'); // 'mine' = only assigned to me
    const limit = Math.min(Math.max(parseInt(c.req.query('limit') || '100', 10) || 100, 1), 200);

    let sql = `SELECT o.*, u.name as ownerName, u.clinicName as ownerClinicName
               FROM lab_orders o LEFT JOIN users u ON o.ownerId = u.id WHERE 1=1`;
    const params = [];

    if (filter === 'mine') {
      sql += ' AND o.assigned_staff_id = ?';
      params.push(staffId);
    }
    sql += ' ORDER BY o.createdAt DESC LIMIT ?';
    params.push(limit);

    const { results } = await c.env.DB.prepare(sql).bind(...params).all();
    return c.json({
      orders: results.map(r => ({
        ...r,
        _id: r.id,
        owner: { name: r.ownerName, clinicName: r.ownerClinicName },
      })),
    });
  } catch (err) {
    logger.error('Staff orders error', { error: err.message });
    return c.json({ message: 'Failed to load orders.' }, 500);
  }
});

// PATCH /api/staff/orders/:id/stage — staff can update production stage only
staff.patch('/orders/:id/stage', verifyStaff(), async (c) => {
  try {
    const orderId = c.req.param('id');
    const staffId = c.get('staff').id;
    const body = await c.req.json();
    const { stage } = body;

    const validStages = ['received', 'design', 'production', 'qc', 'dispatched', 'completed'];
    if (!validStages.includes(stage)) {
      return c.json({ message: 'Invalid stage.' }, 400);
    }

    // ponytail: derive status from stage, same pattern as admin.js
    const status = stage === 'completed' ? 'Completed' : stage === 'received' ? 'Pending' : 'In Progress';
    const ts = now();

    const { meta } = await c.env.DB.prepare(
      'UPDATE lab_orders SET stage = ?, status = ?, assigned_staff_id = ?, updatedAt = ? WHERE id = ?'
    ).bind(stage, status, staffId, ts, orderId).run();
    if (!meta.changes) return c.json({ message: 'Order not found.' }, 404);

    auditLog('STAFF_ORDER_STAGE_UPDATED', { orderId, newStage: stage, staffId });
    return c.json({ message: `Stage updated to "${stage}".`, stage, status });
  } catch (err) {
    logger.error('Staff stage update error', { error: err.message });
    return c.json({ message: 'Failed to update stage.' }, 500);
  }
});

// POST /api/staff/orders — staff (receptionist, admin roles) creates order for dentist
staff.post('/orders', verifyStaff(), async (c) => {
  try {
    const { dentistId, patientName, serviceType, priority, dueDate, notes, amount } = await c.req.json();
    if (!dentistId) return c.json({ message: 'Dentist is required.' }, 400);
    if (!patientName || !patientName.trim()) return c.json({ message: 'Patient name is required.' }, 400);

    const dentist = await c.env.DB.prepare("SELECT id, name, email, status FROM users WHERE id = ?").bind(dentistId).first();
    if (!dentist) return c.json({ message: 'Dentist not found.' }, 404);
    if (dentist.status !== 'approved') return c.json({ message: 'Dentist is not approved.' }, 400);

    const validServices = ['Crown', 'Bridge', 'Denture', 'Implant', 'Veneer', 'Retainer', 'Other'];
    const safeService = validServices.includes(serviceType) ? serviceType : 'Other';
    const validPriorities = ['Low', 'Normal', 'High', 'Urgent'];
    const safePriority = validPriorities.includes(priority) ? priority : 'Normal';

    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Array.from(crypto.getRandomValues(new Uint8Array(3)), b => b.toString(36)).join('').substring(0, 4).toUpperCase();
    const caseId = `DZ-${datePart}-${random}`;
    const id = newId();
    const ts = now();
    const staffUser = c.get('staff');

    await c.env.DB.prepare(
      `INSERT INTO lab_orders (id, ownerId, patientName, caseId, serviceType, status, stage, dueDate, notes, priority, createdBy, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 'Pending', 'received', ?, ?, ?, ?, ?, ?)`
    ).bind(id, dentistId, patientName.trim(), caseId, safeService, dueDate || null, notes || '', safePriority, staffUser.username || 'staff', ts, ts).run();

    const order = await c.env.DB.prepare('SELECT * FROM lab_orders WHERE id = ?').bind(id).first();

    const paymentId = newId();
    const numAmount = typeof amount === 'number' ? amount : Number(amount) || 0;
    await c.env.DB.prepare(
      `INSERT INTO payments (id, ownerId, patientName, caseId, invoiceNumber, amount, currency, status, invoiceDate, dueDate, description, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 'INR', 'Pending', ?, ?, '', ?, ?)`
    ).bind(paymentId, dentistId, patientName.trim(), caseId, `INV-${caseId}`, numAmount, ts, dueDate || null, ts, ts).run();

    auditLog('STAFF_ORDER_CREATED', { orderId: id, caseId, dentistId, staffUsername: staffUser.username });

    return c.json({
      message: 'Order created successfully.',
      order: {
        ...order,
        _id: order.id,
        amount: numAmount,
        paymentAmount: numAmount,
        paymentStatus: 'Pending',
        owner: { _id: dentist.id, name: dentist.name, email: dentist.email },
      },
    }, 201);
  } catch (err) {
    logger.error('Staff create order error', { error: err.message });
    return c.json({ message: 'Failed to create order.' }, 500);
  }
});

// ── Staff Inventory ──────────────────────────────────────────────────────────

// GET /api/staff/inventory — list all inventory items
staff.get('/inventory', verifyStaff(), async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM inventory ORDER BY item_name ASC'
    ).all();
    return c.json({ items: results || [] });
  } catch (err) {
    logger.error('Staff inventory list error', { error: err.message });
    return c.json({ message: 'Failed to load inventory.' }, 500);
  }
});

// POST /api/staff/inventory — add new inventory item
staff.post('/inventory', verifyStaff(), async (c) => {
  try {
    const body = await c.req.json();
    const { item_name, quantity, unit, min_stock } = body;
    if (!item_name || !unit) return c.json({ message: 'Item name and unit are required.' }, 400);

    const id = newId();
    const ts = now();
    await c.env.DB.prepare(
      'INSERT INTO inventory (id, item_name, quantity, unit, min_stock, updated_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, item_name.trim(), quantity || 0, unit.trim(), min_stock || 0, c.get('staff').username, ts, ts).run();

    auditLog('INVENTORY_ITEM_ADDED', { id, item_name, staffId: c.get('staff').id });
    return c.json({ message: 'Item added.', item: { id, item_name, quantity: quantity || 0, unit, min_stock: min_stock || 0 } }, 201);
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return c.json({ message: 'Item already exists.' }, 409);
    logger.error('Staff inventory add error', { error: err.message });
    return c.json({ message: 'Failed to add item.' }, 500);
  }
});

// PATCH /api/staff/inventory/:id — update stock quantity (+/- adjustment)
staff.patch('/inventory/:id', verifyStaff(), async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { quantity, item_name, unit, min_stock } = body;
    const ts = now();

    const updates = ['updated_at = ?', 'updated_by = ?'];
    const binds = [ts, c.get('staff').username];

    if (quantity !== undefined) { updates.push('quantity = ?'); binds.push(quantity); }
    if (item_name !== undefined) { updates.push('item_name = ?'); binds.push(item_name.trim()); }
    if (unit !== undefined) { updates.push('unit = ?'); binds.push(unit.trim()); }
    if (min_stock !== undefined) { updates.push('min_stock = ?'); binds.push(min_stock); }

    binds.push(id);
    const { meta } = await c.env.DB.prepare(
      `UPDATE inventory SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...binds).run();
    if (!meta.changes) return c.json({ message: 'Item not found.' }, 404);

    auditLog('INVENTORY_UPDATED', { id, staffId: c.get('staff').id });
    return c.json({ message: 'Inventory updated.' });
  } catch (err) {
    logger.error('Staff inventory update error', { error: err.message });
    return c.json({ message: 'Failed to update inventory.' }, 500);
  }
});

// DELETE /api/staff/inventory/:id — remove inventory item
staff.delete('/inventory/:id', verifyStaff(), async (c) => {
  try {
    const id = c.req.param('id');
    const { meta } = await c.env.DB.prepare('DELETE FROM inventory WHERE id = ?').bind(id).run();
    if (!meta.changes) return c.json({ message: 'Item not found.' }, 404);
    auditLog('INVENTORY_DELETED', { id, staffId: c.get('staff').id });
    return c.json({ message: 'Item deleted.' });
  } catch (err) {
    logger.error('Staff inventory delete error', { error: err.message });
    return c.json({ message: 'Failed to delete item.' }, 500);
  }
});

// ── Staff Metrics (own stats) ────────────────────────────────────────────────

// GET /api/staff/metrics — staff sees their own stats
staff.get('/metrics', verifyStaff(), async (c) => {
  try {
    const staffId = c.get('staff').id;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStr = monthStart.toISOString();

    // Cases processed this month by this staff
    const myCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM lab_orders WHERE assigned_staff_id = ? AND updatedAt >= ?'
    ).bind(staffId, monthStr).first();

    // Attendance this month
    const datePrefix = monthStart.toISOString().slice(0, 7); // YYYY-MM
    const attendance = await c.env.DB.prepare(
      "SELECT COUNT(*) as present FROM staff_attendance WHERE staff_id = ? AND date LIKE ? AND status = 'Present'"
    ).bind(staffId, `${datePrefix}%`).first();

    const halfDays = await c.env.DB.prepare(
      "SELECT COUNT(*) as half FROM staff_attendance WHERE staff_id = ? AND date LIKE ? AND status = 'Half-day'"
    ).bind(staffId, `${datePrefix}%`).first();

    return c.json({
      casesThisMonth: myCount?.count || 0,
      presentDays: attendance?.present || 0,
      halfDays: halfDays?.half || 0,
    });
  } catch (err) {
    logger.error('Staff metrics error', { error: err.message });
    return c.json({ message: 'Failed to load metrics.' }, 500);
  }
});

// ── Staff Dentist Management ─────────────────────────────────────────────────

// GET /api/staff/users — staff sees all approved dentists
staff.get('/users', verifyStaff(), async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT id, name, email, phone, clinicName, address, createdAt FROM users WHERE status = 'approved' ORDER BY name ASC"
    ).all();
    return c.json({ users: results.map(u => ({ ...u, _id: u.id })) });
  } catch (err) {
    logger.error('Staff users list error', { error: err.message });
    return c.json({ message: 'Failed to load dentists.' }, 500);
  }
});

// GET /api/staff/users/:id — staff sees a specific dentist with orders & payments
staff.get('/users/:id', verifyStaff(), async (c) => {
  try {
    const id = c.req.param('id');
    const user = await c.env.DB.prepare(
      "SELECT id, name, email, phone, clinicName, address, createdAt FROM users WHERE id = ? AND status = 'approved'"
    ).bind(id).first();
    if (!user) return c.json({ message: 'Dentist not found.' }, 404);

    const { results: orders } = await c.env.DB.prepare(
      `SELECT o.*, COALESCE(p.amount, 0) as paymentAmount, COALESCE(p.status, 'Pending') as paymentStatus,
       COALESCE(p.paymentMode, '') as paymentMode, COALESCE(p.referenceNumber, '') as referenceNumber,
       COALESCE(p.batchId, '') as batchId, p.paidAt, p.id as paymentId
       FROM lab_orders o LEFT JOIN payments p ON o.caseId = p.caseId AND o.ownerId = p.ownerId
       WHERE o.ownerId = ? ORDER BY o.createdAt DESC`
    ).bind(id).all();

    return c.json({
      user: { ...user, _id: user.id },
      orders: orders.map(o => ({ ...o, _id: o.id })),
    });
  } catch (err) {
    logger.error('Staff user detail error', { error: err.message });
    return c.json({ message: 'Failed to load dentist details.' }, 500);
  }
});

// PATCH /api/staff/orders/:id — staff can update order fields (status, dueDate, notes, priority)
staff.patch('/orders/:id', verifyStaff(), async (c) => {
  try {
    const orderId = c.req.param('id');
    const body = await c.req.json();
    const { status, dueDate, notes, priority, stage } = body;
    const ts = now();

    const updates = ['updatedAt = ?'];
    const binds = [ts];

    if (status !== undefined) { updates.push('status = ?'); binds.push(status); }
    if (dueDate !== undefined) { updates.push('dueDate = ?'); binds.push(dueDate); }
    if (notes !== undefined) { updates.push('notes = ?'); binds.push(notes); }
    if (priority !== undefined) { updates.push('priority = ?'); binds.push(priority); }
    if (stage !== undefined) {
      updates.push('stage = ?'); binds.push(stage);
      // ponytail: auto-assign staff when updating stage
      updates.push('assigned_staff_id = ?'); binds.push(c.get('staff').id);
    }

    binds.push(orderId);
    const { meta } = await c.env.DB.prepare(
      `UPDATE lab_orders SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...binds).run();
    if (!meta.changes) return c.json({ message: 'Order not found.' }, 404);

    auditLog('STAFF_ORDER_UPDATED', { orderId, staffId: c.get('staff').id });
    return c.json({ message: 'Order updated.' });
  } catch (err) {
    logger.error('Staff order update error', { error: err.message });
    return c.json({ message: 'Failed to update order.' }, 500);
  }
});

// GET /api/staff/payments — staff sees all payments
staff.get('/payments', verifyStaff(), async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT p.*, u.name as ownerName, u.email as ownerEmail, u.clinicName as ownerClinicName
       FROM payments p LEFT JOIN users u ON p.ownerId = u.id ORDER BY p.createdAt DESC LIMIT 200`
    ).all();
    return c.json({
      payments: results.map(r => ({
        ...r, _id: r.id,
        owner: { name: r.ownerName, email: r.ownerEmail, clinicName: r.ownerClinicName },
      })),
    });
  } catch (err) {
    logger.error('Staff payments list error', { error: err.message });
    return c.json({ message: 'Failed to load payments.' }, 500);
  }
});

// PATCH /api/staff/payments/:id — staff updates payment status
staff.patch('/payments/:id', verifyStaff(), async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { status, paymentMode, referenceNumber } = body;
    const ts = now();

    if (!status) return c.json({ message: 'Status is required.' }, 400);

    const updates = ['status = ?', 'updatedAt = ?'];
    const binds = [status, ts];

    if (paymentMode !== undefined) { updates.push('paymentMode = ?'); binds.push(paymentMode); }
    if (referenceNumber !== undefined) { updates.push('referenceNumber = ?'); binds.push(referenceNumber); }
    if (status === 'Paid') { updates.push('paidAt = ?'); binds.push(ts); }
    else { updates.push('paidAt = ?'); binds.push(null); }

    binds.push(id);
    const { meta } = await c.env.DB.prepare(
      `UPDATE payments SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...binds).run();
    if (!meta.changes) return c.json({ message: 'Payment not found.' }, 404);

    auditLog('STAFF_PAYMENT_UPDATED', { paymentId: id, status, staffId: c.get('staff').id });
    return c.json({ message: `Payment marked as ${status}.` });
  } catch (err) {
    logger.error('Staff payment update error', { error: err.message });
    return c.json({ message: 'Failed to update payment.' }, 500);
  }
});

// POST /api/staff/payments/batch — staff updates multiple orders' payments in one single payment details
staff.post('/payments/batch', verifyStaff(), async (c) => {
  try {
    const body = await c.req.json();
    const { orderIds = [], paymentIds = [], status = 'Paid', paymentMode = '', referenceNumber = '', notes = '' } = body;
    const targetIds = Array.from(new Set([...orderIds, ...paymentIds])).filter(Boolean);

    if (targetIds.length === 0) {
      return c.json({ message: 'At least one order or payment ID is required.' }, 400);
    }

    const ts = now();
    const batchId = 'BATCH-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    const modeVal = status === 'Pending' ? '' : (paymentMode || '');
    const refVal = status === 'Pending' ? '' : (referenceNumber || '');
    const paidAtVal = status === 'Paid' ? ts : null;
    const descVal = status === 'Pending' ? '' : (notes || '');

    let updatedCount = 0;

    for (const id of targetIds) {
      let payment = await c.env.DB.prepare('SELECT * FROM payments WHERE id = ?').bind(id).first();

      if (!payment) {
        const order = await c.env.DB.prepare('SELECT * FROM lab_orders WHERE id = ? OR caseId = ?').bind(id, id).first();
        if (order) {
          payment = await c.env.DB.prepare('SELECT * FROM payments WHERE caseId = ? AND ownerId = ?').bind(order.caseId, order.ownerId).first();
          if (!payment) {
            const pid = newId();
            await c.env.DB.prepare(
              `INSERT INTO payments (id, ownerId, patientName, caseId, invoiceNumber, amount, currency, status, invoiceDate, dueDate, description, paymentMode, referenceNumber, paidAt, batchId, createdAt, updatedAt)
               VALUES (?, ?, ?, ?, ?, ?, 'INR', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(pid, order.ownerId, order.patientName, order.caseId, `INV-${order.caseId}`, order.amount || 0, status, ts, order.dueDate || null, descVal, modeVal, refVal, paidAtVal, batchId, ts, ts).run();
            updatedCount++;
            continue;
          }
        }
      }

      if (payment) {
        const updates = ['status = ?', 'paymentMode = ?', 'referenceNumber = ?', 'paidAt = ?', 'description = ?', 'batchId = ?', 'updatedAt = ?'];
        const binds = [status, modeVal, refVal, paidAtVal, descVal, batchId, ts, payment.id];
        await c.env.DB.prepare(`UPDATE payments SET ${updates.join(', ')} WHERE id = ?`).bind(...binds).run();
        updatedCount++;
      }
    }

    auditLog('STAFF_BATCH_PAYMENTS_UPDATED', {
      targetCount: targetIds.length,
      updatedCount,
      status,
      paymentMode: modeVal,
      referenceNumber: refVal,
      batchId,
      staffId: c.get('staff').id,
    });

    const modeLabel = modeVal ? ` via ${modeVal}` : '';
    const refLabel = refVal ? ` (Ref: ${refVal})` : '';
    return c.json({
      message: `Updated ${updatedCount} ${updatedCount === 1 ? 'order' : 'orders'} to ${status}${modeLabel}${refLabel}.`,
      updatedCount,
      batchId,
      status,
      paymentMode: modeVal,
      referenceNumber: refVal,
    });
  } catch (err) {
    logger.error('Staff batch payment update error', { error: err.message });
    return c.json({ message: 'Failed to update batch payments.' }, 500);
  }
});

export default staff;


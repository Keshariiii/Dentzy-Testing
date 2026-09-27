import { Hono } from 'hono';
import { validate } from '../middleware/validate.js';
import { verifyStaff } from '../middleware/auth.js';
import { staffLoginSchema } from '../validators/staff.js';
import { comparePassword, signJWT } from '../utils/crypto.js';
import { newId, now } from '../utils/id.js';
import logger, { auditLog } from '../utils/logger.js';
import { checkRateLimit, getClientIP } from '../utils/rateLimit.js';

const staff = new Hono();

// ── Cookie helpers ───────────────────────────────────────────────────────────
const cookieHeader = (name, value, maxAge) =>
  `${name}=${value}; HttpOnly; Path=/; Max-Age=${Math.floor(maxAge / 1000)}; SameSite=None; Secure`;
const clearCookieHeader = (name) =>
  `${name}=; HttpOnly; Path=/; Max-Age=0; SameSite=None; Secure`;

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
staff.get('/me', verifyStaff(), (c) => c.json({ staff: c.get('staff') }));

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

export default staff;

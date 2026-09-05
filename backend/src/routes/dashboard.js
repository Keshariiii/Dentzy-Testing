import { Hono } from 'hono';
import { validate } from '../middleware/validate.js';
import { verifyUser } from '../middleware/auth.js';
import { updateOrderSchema } from '../validators/dashboard.js';
import { now } from '../utils/id.js';
import logger, { auditLog } from '../utils/logger.js';

const dashboard = new Hono();

// All dashboard routes require authenticated, approved user
dashboard.use('*', verifyUser());

const ORDER_SORT_FIELDS = ['createdAt', 'dueDate', 'patientName', 'caseId', 'status', 'priority', 'serviceType'];

// GET /api/dashboard/stats
dashboard.get('/stats', async (c) => {
  const userId = c.get('user').id;
  try {
    const orderStats = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END), 0) as pending,
        COALESCE(SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END), 0) as inProgress,
        COALESCE(SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END), 0) as completed
      FROM lab_orders WHERE ownerId = ?
    `).bind(userId).first();

    const paymentStats = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status = 'Paid' THEN 1 ELSE 0 END), 0) as paid,
        COALESCE(SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END), 0) as pending,
        COALESCE(SUM(CASE WHEN status = 'Overdue' THEN 1 ELSE 0 END), 0) as overdue
      FROM payments WHERE ownerId = ?
    `).bind(userId).first();

    return c.json({
      orders: { total: orderStats.total, pending: orderStats.pending, inProgress: orderStats.inProgress, completed: orderStats.completed },
      payments: { total: paymentStats.total, paid: paymentStats.paid, pending: paymentStats.pending, overdue: paymentStats.overdue },
    });
  } catch (error) {
    logger.error('Dashboard stats error', { error: error.message, userId });
    return c.json({ message: 'Failed to load stats.' }, 500);
  }
});

// GET /api/dashboard/orders
dashboard.get('/orders', async (c) => {
  const userId = c.get('user').id;
  try {
    const status = c.req.query('status');
    const search = c.req.query('search');
    const limit = Math.min(Math.max(parseInt(c.req.query('limit') || '20', 10) || 20, 1), 100);
    const sort = ORDER_SORT_FIELDS.includes(c.req.query('sort')) ? c.req.query('sort') : 'createdAt';
    const order = c.req.query('order') === 'asc' ? 'ASC' : 'DESC';

    let sql = 'SELECT * FROM lab_orders WHERE ownerId = ?';
    const params = [userId];

    if (status && status !== 'all') { sql += ' AND status = ?'; params.push(status); }
    if (search) {
      sql += ' AND (patientName LIKE ? OR caseId LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ` ORDER BY ${sort} ${order} LIMIT ?`;
    params.push(limit);

    const { results } = await c.env.DB.prepare(sql).bind(...params).all();
    // Map id → _id for frontend compat
    return c.json({ orders: results.map(o => ({ ...o, _id: o.id })) });
  } catch (error) {
    logger.error('Dashboard orders error', { error: error.message });
    return c.json({ message: 'Failed to load orders.' }, 500);
  }
});

// POST /api/dashboard/orders — disabled, admin-only
dashboard.post('/orders', (c) => c.json({ message: 'Order creation is managed exclusively by lab administration.' }, 403));

// PATCH /api/dashboard/orders/:id
dashboard.patch('/orders/:id', validate(updateOrderSchema), async (c) => {
  const userId = c.get('user').id;
  const orderId = c.req.param('id');
  const body = c.get('body');

  const sets = [];
  const vals = [];
  const allowed = ['patientName', 'caseId', 'serviceType', 'dueDate', 'notes', 'priority'];
  for (const key of allowed) {
    if (body[key] !== undefined) { sets.push(`${key} = ?`); vals.push(body[key]); }
  }
  if (sets.length === 0) return c.json({ message: 'No changes provided.' }, 400);

  sets.push('updatedAt = ?'); vals.push(now());
  vals.push(orderId, userId);

  try {
    const { meta } = await c.env.DB.prepare(
      `UPDATE lab_orders SET ${sets.join(', ')} WHERE id = ? AND ownerId = ?`
    ).bind(...vals).run();
    if (!meta.changes) return c.json({ message: 'Order not found.' }, 404);

    const order = await c.env.DB.prepare('SELECT * FROM lab_orders WHERE id = ?').bind(orderId).first();

    auditLog('ORDER_UPDATED_BY_DENTIST', { orderId, dentistId: userId });
    return c.json({ message: 'Order updated.', order: { ...order, _id: order.id } });
  } catch (error) {
    logger.error('Dashboard update order error', { error: error.message });
    return c.json({ message: 'Failed to update order.' }, 500);
  }
});

// DELETE /api/dashboard/orders/:id
dashboard.delete('/orders/:id', async (c) => {
  const userId = c.get('user').id;
  const orderId = c.req.param('id');
  try {
    const { meta } = await c.env.DB.prepare(
      'DELETE FROM lab_orders WHERE id = ? AND ownerId = ?'
    ).bind(orderId, userId).run();
    if (!meta.changes) return c.json({ message: 'Order not found.' }, 404);

    auditLog('ORDER_DELETED_BY_DENTIST', { orderId, dentistId: userId });
    return c.json({ message: 'Order deleted.' });
  } catch (error) {
    logger.error('Dashboard delete order error', { error: error.message });
    return c.json({ message: 'Failed to delete order.' }, 500);
  }
});

// GET /api/dashboard/payments — returns lab orders with payment status
dashboard.get('/payments', async (c) => {
  const userId = c.get('user').id;
  try {
    const status = c.req.query('status');
    const search = c.req.query('search');
    const limit = Math.min(Math.max(parseInt(c.req.query('limit') || '50', 10) || 50, 1), 100);

    let sql = `SELECT o.id, o.patientName, o.caseId, o.serviceType, o.status as orderStatus, o.dueDate, o.createdAt,
       COALESCE(p.status, 'Pending') as paymentStatus, COALESCE(p.amount, 0) as amount, p.invoiceNumber
       FROM lab_orders o LEFT JOIN payments p ON o.caseId = p.caseId AND o.ownerId = p.ownerId
       WHERE o.ownerId = ?`;
    const params = [userId];

    if (status && status !== 'all') { sql += ' AND COALESCE(p.status, \'Pending\') = ?'; params.push(status); }
    if (search) {
      sql += ' AND (o.patientName LIKE ? OR o.caseId LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY o.createdAt DESC LIMIT ?';
    params.push(limit);

    const { results } = await c.env.DB.prepare(sql).bind(...params).all();
    return c.json({ payments: results.map(r => ({ ...r, _id: r.id })) });
  } catch (error) {
    logger.error('Dashboard payments error', { error: error.message });
    return c.json({ message: 'Failed to load payments.' }, 500);
  }
});


// GET /api/dashboard/me
dashboard.get('/me', (c) => c.json({ user: c.get('user') }));

export default dashboard;

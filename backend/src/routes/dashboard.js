import { Hono } from 'hono';
import { validate } from '../middleware/validate.js';
import { verifyUser } from '../middleware/auth.js';
import { updateOrderSchema } from '../validators/dashboard.js';
import { now } from '../utils/id.js';
import logger, { auditLog } from '../utils/logger.js';
import { calculateOrderAmount } from '../utils/pricing.js';

const dashboard = new Hono();

function safeWait(c, promise) {
  try {
    if (c.executionCtx?.waitUntil) {
      c.executionCtx.waitUntil(promise);
      return;
    }
  } catch {}
  promise?.catch?.(() => {});
}

// All dashboard routes require authenticated, approved user
dashboard.use('*', verifyUser());

const ORDER_SORT_MAP = {
  createdAt: 'o.createdAt',
  dueDate: 'o.dueDate',
  patientName: 'o.patientName',
  caseId: 'o.caseId',
  status: 'o.status',
  priority: 'o.priority',
  serviceType: 'o.serviceType',
};

// GET /api/dashboard/stats
dashboard.get('/stats', async (c) => {
  const userId = c.get('user').id;
  try {
    // ponytail: batch both stats queries into a single D1 round-trip
    const [orderRes, paymentRes] = await c.env.DB.batch([
      c.env.DB.prepare(`
        SELECT
          COUNT(CASE WHEN status != 'Cancelled' THEN 1 END) as total,
          COALESCE(SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END), 0) as pending,
          COALESCE(SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END), 0) as inProgress,
          COALESCE(SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END), 0) as completed
        FROM lab_orders WHERE ownerId = ?
      `).bind(userId),
      c.env.DB.prepare(`
        SELECT
          COUNT(CASE WHEN status != 'Cancelled' THEN 1 END) as total,
          COALESCE(SUM(CASE WHEN status = 'Paid' THEN 1 ELSE 0 END), 0) as paid,
          COALESCE(SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END), 0) as pending,
          COALESCE(SUM(CASE WHEN status = 'Overdue' THEN 1 ELSE 0 END), 0) as overdue,
          COALESCE(SUM(CASE WHEN status IN ('Pending','Overdue') THEN amount ELSE 0 END), 0) as totalUnpaid
        FROM payments WHERE ownerId = ?
      `).bind(userId),
    ]);
    const orderStats = orderRes.results[0];
    const paymentStats = paymentRes.results[0];

    return c.json({
      orders: { total: orderStats.total, pending: orderStats.pending, inProgress: orderStats.inProgress, completed: orderStats.completed },
      payments: { total: paymentStats.total, paid: paymentStats.paid, pending: paymentStats.pending, overdue: paymentStats.overdue, totalUnpaid: paymentStats.totalUnpaid },
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
    const sortCol = ORDER_SORT_MAP[c.req.query('sort')] || 'o.createdAt';
    const order = c.req.query('order') === 'asc' ? 'ASC' : 'DESC';

    let sql = `SELECT o.*,
               COALESCE(p.amount, 0) as amount,
               COALESCE(p.amount, 0) as paymentAmount,
               COALESCE(p.status, 'Pending') as paymentStatus,
               COALESCE(p.paymentMode, '') as paymentMode,
               COALESCE(p.referenceNumber, '') as referenceNumber,
               COALESCE(p.batchId, '') as batchId,
               p.invoiceNumber,
               p.paidAt
               FROM lab_orders o
               LEFT JOIN payments p ON o.caseId = p.caseId AND o.ownerId = p.ownerId
               WHERE o.ownerId = ?`;
    const params = [userId];

    if (status && status !== 'all') { sql += ' AND o.status = ?'; params.push(status); }
    if (search) {
      sql += ' AND (o.patientName LIKE ? OR o.caseId LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ` ORDER BY ${sortCol} ${order} LIMIT ?`;
    params.push(limit);

    const { results } = await c.env.DB.prepare(sql).bind(...params).all();
    // Map id → _id for frontend compat and ensure financial and batch fields are returned
    return c.json({
      orders: results.map(o => {
        let effAmount = Number(o.paymentAmount) || Number(o.amount) || 0;
        if (effAmount <= 0) {
          const calc = calculateOrderAmount(o);
          effAmount = calc.amount;
          safeWait(c, c.env.DB.prepare('UPDATE payments SET amount = ?, updatedAt = ? WHERE caseId = ? AND ownerId = ? AND (amount IS NULL OR amount <= 0)')
            .bind(effAmount, now(), o.caseId, o.ownerId).run());
        }
        return {
          ...o,
          _id: o.id,
          amount: effAmount,
          paymentAmount: effAmount,
          paymentStatus: o.paymentStatus,
          paymentMode: o.paymentMode,
          referenceNumber: o.referenceNumber,
          batchId: o.batchId || '',
          paidAt: o.paidAt,
        };
      }),
    });
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

  try {
    const existing = await c.env.DB.prepare(
      'SELECT stage, status FROM lab_orders WHERE id = ? AND ownerId = ?'
    ).bind(orderId, userId).first();
    if (!existing) return c.json({ message: 'Order not found.' }, 404);
    if (existing.stage !== 'received' || existing.status !== 'Pending') {
      return c.json({ message: 'Order is already in production and cannot be modified directly. Please contact lab support.' }, 403);
    }

    const sets = [];
    const vals = [];
    const allowed = ['patientName', 'serviceType', 'dueDate', 'notes', 'priority'];
    for (const key of allowed) {
      if (body[key] !== undefined) { sets.push(`${key} = ?`); vals.push(body[key]); }
    }
    if (sets.length === 0) return c.json({ message: 'No changes provided.' }, 400);

    sets.push('updatedAt = ?'); vals.push(now());
    vals.push(orderId, userId);

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

// DELETE /api/dashboard/orders/:id — Soft-cancel dentist order
dashboard.delete('/orders/:id', async (c) => {
  const userId = c.get('user').id;
  const orderId = c.req.param('id');
  try {
    const order = await c.env.DB.prepare(
      'SELECT id, caseId, stage, status FROM lab_orders WHERE id = ? AND ownerId = ?'
    ).bind(orderId, userId).first();
    if (!order) return c.json({ message: 'Order not found.' }, 404);

    // Guard: only received & pending orders can be cancelled directly by dentists
    if (order.stage !== 'received' || order.status !== 'Pending') {
      return c.json({
        message: 'Order is already in production and cannot be cancelled directly. Please contact lab support.',
        code: 'ORDER_IN_PRODUCTION',
      }, 403);
    }

    // Safeguard: block deletion if payment is already Paid
    const paidPayment = await c.env.DB.prepare(
      "SELECT id FROM payments WHERE caseId = ? AND status = 'Paid'"
    ).bind(order.caseId).first();

    if (paidPayment) {
      return c.json({
        message: `Cannot delete order ${order.caseId} because payment has already been completed. Please contact lab administration for cancellations.`,
        code: 'PAID_ORDER_DELETION_BLOCKED',
      }, 400);
    }

    const ts = now();
    await c.env.DB.batch([
      c.env.DB.prepare("UPDATE lab_orders SET status = 'Cancelled', assigned_staff_id = NULL, updatedAt = ? WHERE id = ? AND ownerId = ?").bind(ts, orderId, userId),
      c.env.DB.prepare("UPDATE payments SET status = 'Cancelled', updatedAt = ? WHERE caseId = ? AND ownerId = ?").bind(ts, order.caseId, userId),
    ]);

    auditLog('ORDER_CANCELLED_BY_DENTIST', { orderId, caseId: order.caseId, dentistId: userId });
    return c.json({ message: 'Order cancelled.' });
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
       COALESCE(p.status, 'Pending') as paymentStatus,
       COALESCE(p.paymentMode, '') as paymentMode,
       COALESCE(p.referenceNumber, '') as referenceNumber,
       COALESCE(p.batchId, '') as batchId,
       COALESCE(p.amount, 0) as amount, p.invoiceNumber, p.paidAt
       FROM lab_orders o LEFT JOIN payments p ON o.caseId = p.caseId AND o.ownerId = p.ownerId
       WHERE o.ownerId = ?`;
    const params = [userId];

    if (status && status !== 'all') { sql += " AND COALESCE(p.status, 'Pending') = ?"; params.push(status); }
    if (search) {
      sql += ' AND (o.patientName LIKE ? OR o.caseId LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY o.createdAt DESC LIMIT ?';
    params.push(limit);

    const { results } = await c.env.DB.prepare(sql).bind(...params).all();
    return c.json({
      payments: results.map(r => {
        let effAmount = Number(r.amount) || 0;
        if (effAmount <= 0) {
          const calc = calculateOrderAmount(r);
          effAmount = calc.amount;
        }
        return {
          ...r,
          _id: r.id,
          amount: effAmount,
        };
      }),
    });
  } catch (error) {
    logger.error('Dashboard payments error', { error: error.message });
    return c.json({ message: 'Failed to load payments.' }, 500);
  }
});

// GET /api/dashboard/notice — dentist notice bar config + private IST birthday greeting
const DEFAULT_NOTICE = {
  enabled: true,
  messages: [
    'Welcome to Dentzy Clinical Lab Portal',
    'Standard turnaround: 5-7 working days  |  Rush: 2-3 working days',
    'New: Zirconia monolithic crowns with multi-shade gradients now available',
    'Submit STL files for faster digital impression processing',
    'Invoices are generated upon case dispatch — check the Payments tab',
    'All cases backed by the Dentzy 5-10 Years Quality Guarantee',
    'Lab support: Mon-Sat, 9 AM to 6 PM IST',
  ],
};

function checkDentistBirthdayIST(dob) {
  if (!dob || typeof dob !== 'string') return { isBirthday: false, todayIST: null };
  const parts = dob.trim().slice(0, 10).split('-');
  if (parts.length < 3) return { isBirthday: false, todayIST: null };
  const dobMonth = parseInt(parts[1], 10);
  const dobDay = parseInt(parts[2], 10);
  if (!dobMonth || !dobDay) return { isBirthday: false, todayIST: null };

  const todayIST = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const [, istMonth, istDay] = todayIST.split('-').map(Number);
  return { isBirthday: dobMonth === istMonth && dobDay === istDay, todayIST };
}

dashboard.get('/notice', async (c) => {
  const user = c.get('user');
  const { isBirthday, todayIST } = checkDentistBirthdayIST(user?.dob);
  const cleanName = (user?.name || 'Doctor').replace(/^dr\.?\s+/i, '').trim() || 'Doctor';
  const birthdayMsg = `🎂 Happy Birthday, Dr. ${cleanName}! Wishing you a wonderful year ahead from the Dentzy team!`;

  try {
    const row = await c.env.DB.prepare(
      "SELECT value FROM app_settings WHERE key = 'dentist_notice_bar'"
    ).first();
    let enabled = DEFAULT_NOTICE.enabled;
    let baseMessages = [...DEFAULT_NOTICE.messages];

    if (row?.value) {
      const parsed = JSON.parse(row.value);
      enabled = !!parsed.enabled;
      baseMessages = Array.isArray(parsed.messages) ? parsed.messages : [];
    }

    if (isBirthday) {
      return c.json({
        enabled: true,
        isBirthday: true,
        birthdayDate: todayIST,
        messages: [birthdayMsg, ...baseMessages],
      });
    }
    return c.json({ enabled, isBirthday: false, messages: baseMessages });
  } catch (error) {
    logger.error('Dashboard notice error', { error: error.message });
    if (isBirthday) {
      return c.json({
        enabled: true,
        isBirthday: true,
        birthdayDate: todayIST,
        messages: [birthdayMsg, ...DEFAULT_NOTICE.messages],
      });
    }
    return c.json(DEFAULT_NOTICE);
  }
});

// GET /api/dashboard/me
dashboard.get('/me', (c) => c.json({ user: c.get('user') }));

export default dashboard;

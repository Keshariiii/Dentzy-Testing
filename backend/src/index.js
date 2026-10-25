import { Hono } from 'hono';
import { cors } from 'hono/cors';
import auth from './routes/auth.js';
import admin from './routes/admin.js';
import dashboard from './routes/dashboard.js';
import contact from './routes/contact.js';
import staff from './routes/staff.js';
import { sendEmail } from './utils/email.js';
import { verifyAnyAuth } from './middleware/auth.js';

const app = new Hono();

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use('*', async (c, next) => {
  const origins = (c.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);

  const corsMiddleware = cors({
    origin: (origin) => {
      if (!origin) return '*';
      // Exact match
      if (origins.includes(origin)) return origin;
      // Wildcard match (e.g. https://*.pages.dev)
      for (const o of origins) {
        if (o.includes('*')) {
          const re = new RegExp('^' + o.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
          if (re.test(origin)) return origin;
        }
      }
      // Local network — dev only
      if (c.env.NODE_ENV !== 'production') {
        try {
          const host = new URL(origin).hostname;
          if (host === 'localhost' || host === '127.0.0.1' || /^192\.168\./.test(host) || /^10\./.test(host))
            return origin;
        } catch { }
      }
      return null;
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  });

  return corsMiddleware(c, next);
});

// ── Security headers (100% HTTPS & Protection) ──────────────────────────────
app.use('*', async (c, next) => {
  await next();
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', async (c) => {
  let dbOk = false;
  try {
    await c.env.DB.prepare('SELECT 1').first();
    dbOk = true;
  } catch { }
  return c.json({ status: 'ok', db: dbOk ? 'connected' : 'error', time: new Date().toISOString() });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.route('/api/auth', auth);
app.route('/api/admin', admin);
app.route('/api/staff', staff);
app.route('/api/dashboard', dashboard);
app.route('/api/contact', contact);

// ── Batch Invoice (Admin, Staff, or owning Dentist) ───────────────────────────
app.get('/api/payments/batch/:batchId', verifyAnyAuth(), async (c) => {
  const batchId = c.req.param('batchId');
  const role = c.get('role');
  const user = c.get('user');

  const { results: batchPayments } = await c.env.DB.prepare(
    `SELECT p.*, o.serviceType, COALESCE(o.teeth_data, '[]') as teethData, o.dueDate, u.name as dentistName, u.clinicName, u.phone as dentistPhone, u.address as dentistAddress
     FROM payments p
     LEFT JOIN lab_orders o ON p.caseId = o.caseId AND p.ownerId = o.ownerId
     LEFT JOIN users u ON p.ownerId = u.id
     WHERE p.batchId = ?`
  ).bind(batchId).all();

  if (!batchPayments || batchPayments.length === 0) {
    return c.json({ message: 'Batch invoice not found.' }, 404);
  }

  // ponytail: strict cross-tenant isolation, verify EVERY record belongs to authenticated dentist
  if (role === 'user' && batchPayments.some(p => p.ownerId !== user.id)) {
    return c.json({ message: 'Forbidden' }, 403);
  }

  const first = batchPayments[0];
  const items = batchPayments.map(p => {
    let teethStr = '1 unit';
    try {
      const arr = JSON.parse(p.teethData || '[]');
      if (Array.isArray(arr) && arr.length > 0) {
        teethStr = `${arr.join(', ')} (${arr.length} ${arr.length === 1 ? 'unit' : 'units'})`;
      }
    } catch {}

    return {
      caseId: p.caseId,
      patientName: p.patientName,
      service: p.serviceType || 'Dental Prosthetics',
      teeth: teethStr,
      amount: Number(p.amount) || 0,
      dueDate: p.dueDate,
    };
  });
  const totalAmount = items.reduce((s, it) => s + it.amount, 0);

  return c.json({
    batchId,
    statementNumber: batchId,
    status: first.status,
    paymentMode: first.paymentMode || '',
    referenceNumber: first.referenceNumber || '',
    paidAt: first.paidAt || null,
    notes: first.description || '',
    dentist: {
      name: first.dentistName || 'Registered Practitioner',
      clinicName: first.clinicName || '',
      phone: first.dentistPhone || '',
      address: first.dentistAddress || 'Maharashtra, India',
    },
    items,
    totalAmount,
  });
});

// ── Unpaid Statement / Outstanding Bill (Admin, Staff, or owning Dentist) ────
app.get('/api/payments/unpaid-statement', verifyAnyAuth(), async (c) => {
  const role = c.get('role');
  const user = c.get('user');
  const requestedDentistId = c.req.query('dentistId');
  const month = c.req.query('month');

  let targetOwnerId = user?.id;
  if (role === 'admin' || role === 'staff') {
    if (!requestedDentistId) {
      return c.json({ message: 'Dentist ID (dentistId) is required for administrative billing statements.' }, 400);
    }
    targetOwnerId = requestedDentistId;
  } else if (role === 'user') {
    if (requestedDentistId && requestedDentistId !== user.id) {
      return c.json({ message: 'Forbidden' }, 403);
    }
    targetOwnerId = user.id;
  }

  let sql = `
    SELECT o.id as orderId, o.caseId, o.patientName, o.serviceType,
           COALESCE(o.teeth_data, '[]') as teethData, o.dueDate, o.createdAt,
           COALESCE(p.id, '') as paymentId,
           COALESCE(p.amount, 0) as amount,
           COALESCE(p.status, 'Pending') as status,
           u.name as dentistName, u.clinicName, u.phone as dentistPhone, u.address as dentistAddress
    FROM lab_orders o
    LEFT JOIN payments p ON o.caseId = p.caseId AND o.ownerId = p.ownerId
    LEFT JOIN users u ON o.ownerId = u.id
    WHERE o.ownerId = ? AND COALESCE(p.status, 'Pending') IN ('Pending', 'Overdue')
  `;
  const params = [targetOwnerId];

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    sql += ' AND o.createdAt LIKE ?';
    params.push(`${month}%`);
  }

  sql += ' ORDER BY o.createdAt ASC';

  const { results } = await c.env.DB.prepare(sql).bind(...params).all();

  const dentistInfo = results && results.length > 0 ? {
    name: results[0].dentistName || 'Registered Practitioner',
    clinicName: results[0].clinicName || '',
    phone: results[0].dentistPhone || '',
    address: results[0].dentistAddress || '',
  } : await (async () => {
    const u = await c.env.DB.prepare('SELECT name, clinicName, phone, address FROM users WHERE id = ?').bind(targetOwnerId).first();
    return {
      name: u?.name || 'Registered Practitioner',
      clinicName: u?.clinicName || '',
      phone: u?.phone || '',
      address: u?.address || '',
    };
  })();

  const items = (results || []).map(row => {
    let teethStr = '1 unit';
    try {
      const arr = JSON.parse(row.teethData || '[]');
      if (Array.isArray(arr) && arr.length > 0) {
        teethStr = `${arr.join(', ')} (${arr.length} ${arr.length === 1 ? 'unit' : 'units'})`;
      }
    } catch {}

    return {
      orderId: row.orderId,
      caseId: row.caseId,
      patientName: row.patientName,
      service: row.serviceType || 'Dental Prosthetics Restoration',
      teeth: teethStr,
      amount: Number(row.amount) || 0,
      dueDate: row.dueDate,
      createdAt: row.createdAt,
      status: row.status,
    };
  });

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const monthTag = month || new Date().toISOString().slice(0, 7);
  const randSuffix = (targetOwnerId || 'USER').slice(-4).toUpperCase();

  return c.json({
    statementType: 'UNPAID_BILL',
    statementNumber: `BILL-${monthTag.replace('-', '')}-${randSuffix}`,
    month: month || 'All Outstanding',
    status: 'Pending',
    paymentMode: '',
    referenceNumber: '',
    paidAt: null,
    dentist: dentistInfo,
    items,
    totalAmount,
  });
});

// ── Single Invoice (Admin, Staff, or owning Dentist) ──────────────────────────
app.get('/api/payments/single/:id', verifyAnyAuth(), async (c) => {
  const id = c.req.param('id');
  const role = c.get('role');
  const user = c.get('user');

  const payment = await c.env.DB.prepare(
    `SELECT p.*, o.serviceType, COALESCE(o.teeth_data, '[]') as teethData, o.dueDate as orderDueDate,
            u.name as dentistName, u.clinicName, u.phone as dentistPhone, u.address as dentistAddress
     FROM payments p
     LEFT JOIN lab_orders o ON p.caseId = o.caseId AND p.ownerId = o.ownerId
     LEFT JOIN users u ON p.ownerId = u.id
     WHERE p.id = ? OR p.caseId = ? OR o.id = ?`
  ).bind(id, id, id).first();

  if (!payment) {
    return c.json({ message: 'Invoice not found.' }, 404);
  }

  if (role === 'user' && payment.ownerId !== user.id) {
    return c.json({ message: 'Forbidden' }, 403);
  }

  let parsedTeeth = '';
  try {
    const arr = JSON.parse(payment.teethData || '[]');
    if (Array.isArray(arr) && arr.length > 0) {
      parsedTeeth = `${arr.join(', ')} (${arr.length} ${arr.length === 1 ? 'unit' : 'units'})`;
    }
  } catch {}

  return c.json({
    id: payment.id,
    caseId: payment.caseId,
    invoiceNumber: payment.invoiceNumber || `INV-${payment.caseId}`,
    patientName: payment.patientName,
    serviceType: payment.serviceType || 'Dental Prosthetics',
    teeth: parsedTeeth || '1 unit',
    amount: Number(payment.amount) || 0,
    status: payment.status,
    paymentMode: payment.paymentMode || '',
    referenceNumber: payment.referenceNumber || '',
    paidAt: payment.paidAt || null,
    dueDate: payment.dueDate || payment.orderDueDate || null,
    createdAt: payment.createdAt,
    dentist: {
      name: payment.dentistName || 'Registered Practitioner',
      clinicName: payment.clinicName || '',
      phone: payment.dentistPhone || '',
      address: payment.dentistAddress || 'Maharashtra, India',
    },
  });
});

// ── Root ─────────────────────────────────────────────────────────────────────
app.get('/', (c) => c.text('Dentzy Backend is Running'));

// ── Global error handler ─────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error(JSON.stringify({ level: 'error', message: err.message, stack: err.stack, url: c.req.url }));

  if (err.message?.includes('UNIQUE constraint failed'))
    return c.json({ message: 'Duplicate entry. This value is already in use.' }, 409);

  return c.json({ message: 'Internal server error.' }, 500);
});

export default app;

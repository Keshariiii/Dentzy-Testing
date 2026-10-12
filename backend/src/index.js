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
    `SELECT p.*, o.serviceType, o.teeth, o.dueDate, u.name as dentistName, u.clinicName, u.phone as dentistPhone, u.address as dentistAddress
     FROM payments p
     LEFT JOIN lab_orders o ON p.caseId = o.caseId AND p.ownerId = o.ownerId
     LEFT JOIN users u ON p.ownerId = u.id
     WHERE p.batchId = ?`
  ).bind(batchId).all();

  if (!batchPayments || batchPayments.length === 0) {
    return c.json({ message: 'Batch invoice not found.' }, 404);
  }

  // Authorization check: if authenticated as dentist, ensure dentist owns the records
  if (role === 'user' && batchPayments[0].ownerId !== user.id) {
    return c.json({ message: 'Forbidden' }, 403);
  }

  const first = batchPayments[0];
  const items = batchPayments.map(p => ({
    caseId: p.caseId,
    patientName: p.patientName,
    service: p.serviceType || 'Dental Prosthetics',
    teeth: p.teeth || '1 unit',
    amount: Number(p.amount) || 0,
    dueDate: p.dueDate,
  }));
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

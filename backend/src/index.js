import { Hono } from 'hono';
import { cors } from 'hono/cors';
import auth from './routes/auth.js';
import admin from './routes/admin.js';
import dashboard from './routes/dashboard.js';
import contact from './routes/contact.js';

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
        } catch {}
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
  } catch {}
  return c.json({ status: 'ok', db: dbOk ? 'connected' : 'error', time: new Date().toISOString() });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.route('/api/auth', auth);
app.route('/api/admin', admin);
app.route('/api/dashboard', dashboard);
app.route('/api/contact', contact);

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

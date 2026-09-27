import { Hono } from 'hono';
import { validate } from '../middleware/validate.js';
import { verifyStaff } from '../middleware/auth.js';
import { staffLoginSchema } from '../validators/staff.js';
import { comparePassword, signJWT } from '../utils/crypto.js';
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

export default staff;

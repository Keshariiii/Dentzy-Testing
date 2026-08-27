import { verifyJWT } from '../utils/crypto.js';

// Cookie parser helper — Workers doesn't have cookie-parser
const parseCookies = (cookieHeader) => {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    })
  );
};

const extractToken = (c, cookieName) => {
  // 1. Cookie
  const cookies = parseCookies(c.req.header('Cookie'));
  if (cookies[cookieName]) return cookies[cookieName];
  // 2. Bearer header
  const auth = c.req.header('Authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  // 3. Query param
  const q = c.req.query('token');
  if (q) return q;
  return null;
};

export const verifyUser = () => async (c, next) => {
  const token = extractToken(c, 'dentzy_jwt');
  if (!token) return c.json({ message: 'Access denied. Please log in.' }, 401);

  try {
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    // Check user exists and is approved
    const user = await c.env.DB.prepare(
      'SELECT id, name, email, status, dob, phone, clinicName, address, createdAt, updatedAt FROM users WHERE id = ?'
    ).bind(payload.id).first();
    if (!user) return c.json({ message: 'User not found.' }, 401);
    if (user.status !== 'approved') return c.json({ message: 'Your account is not approved yet.' }, 403);
    c.set('user', user);
    await next();
  } catch {
    return c.json({ message: 'Invalid or expired token. Please log in again.' }, 401);
  }
};

export const verifyAdmin = () => async (c, next) => {
  const token = extractToken(c, 'dentzy_admin_jwt');
  if (!token) return c.json({ message: 'Admin access denied. No token.' }, 401);

  try {
    const payload = await verifyJWT(token, c.env.ADMIN_JWT_SECRET);
    if (payload.role !== 'admin') throw new Error('Not admin');
    c.set('admin', payload);
    await next();
  } catch {
    return c.json({ message: 'Invalid or expired admin token.' }, 401);
  }
};

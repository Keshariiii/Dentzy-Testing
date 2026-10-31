import { verifyJWT } from '../utils/crypto.js';
import { isExecutiveRole } from '../utils/roles.js';

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

// ponytail: dual-token admin verifier - native admin token OR executive staff token (CEO/CTO)
export const verifyAdmin = () => async (c, next) => {
  // 1. Check primary admin token
  const adminToken = extractToken(c, 'dentzy_admin_jwt');
  if (adminToken && c.env.ADMIN_JWT_SECRET) {
    try {
      const payload = await verifyJWT(adminToken, c.env.ADMIN_JWT_SECRET);
      if (payload.role === 'admin') {
        c.set('admin', payload);
        return await next();
      }
    } catch {}
  }

  // 2. Check executive staff token fallback (CEO/CTO have full admin parity)
  const staffToken = extractToken(c, 'dentzy_staff_jwt');
  if (staffToken && c.env.STAFF_JWT_SECRET) {
    try {
      const payload = await verifyJWT(staffToken, c.env.STAFF_JWT_SECRET);
      if (payload.role === 'staff' && payload.id) {
        const staff = await c.env.DB.prepare(
          'SELECT id, username, displayName, designation, employeeId, email, phone, dob, status FROM staff WHERE id = ?'
        ).bind(payload.id).first();

        if (staff && staff.status === 'active' && isExecutiveRole(staff.designation)) {
          c.set('admin', {
            id: staff.id,
            username: staff.username,
            displayName: staff.displayName,
            designation: staff.designation,
            role: 'admin',
            isExecutiveStaff: true,
          });
          c.set('staff', { ...staff, role: 'staff' });
          return await next();
        }
      }
    } catch {}
  }

  return c.json({ message: 'Admin access denied. Insufficient permissions.' }, 401);
};

export const verifyStaff = () => async (c, next) => {
  const token = extractToken(c, 'dentzy_staff_jwt');
  if (!token) return c.json({ message: 'Staff access denied. No token.' }, 401);

  try {
    const payload = await verifyJWT(token, c.env.STAFF_JWT_SECRET);
    if (payload.role !== 'staff') throw new Error('Not staff');
    const staff = await c.env.DB.prepare(
      'SELECT id, username, displayName, designation, employeeId, email, phone, dob, status FROM staff WHERE id = ?'
    ).bind(payload.id).first();
    if (!staff) return c.json({ message: 'Staff not found.' }, 401);
    if (staff.status !== 'active') return c.json({ message: 'Staff account is inactive.' }, 403);
    c.set('staff', { ...payload, ...staff, role: 'staff' });
    await next();
  } catch {
    return c.json({ message: 'Invalid or expired staff token.' }, 401);
  }
};

export const verifyAnyAuth = () => async (c, next) => {
  const adminToken = extractToken(c, 'dentzy_admin_jwt');
  if (adminToken && c.env.ADMIN_JWT_SECRET) {
    try {
      const payload = await verifyJWT(adminToken, c.env.ADMIN_JWT_SECRET);
      if (payload.role === 'admin') {
        c.set('role', 'admin');
        c.set('admin', payload);
        return next();
      }
    } catch {}
  }

  const staffToken = extractToken(c, 'dentzy_staff_jwt');
  if (staffToken && c.env.STAFF_JWT_SECRET) {
    try {
      const payload = await verifyJWT(staffToken, c.env.STAFF_JWT_SECRET);
      if (payload.role === 'staff') {
        c.set('role', 'staff');
        c.set('staff', payload);
        return next();
      }
    } catch {}
  }

  const userToken = extractToken(c, 'dentzy_jwt');
  if (userToken && c.env.JWT_SECRET) {
    try {
      const payload = await verifyJWT(userToken, c.env.JWT_SECRET);
      c.set('role', 'user');
      c.set('user', payload);
      return next();
    } catch {}
  }

  return c.json({ message: 'Access denied. Please log in.' }, 401);
};

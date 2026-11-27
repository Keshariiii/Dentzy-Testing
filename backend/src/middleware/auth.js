import { verifyJWT, passwordVersion } from '../utils/crypto.js';
import { isExecutiveRole } from '../utils/roles.js';
import { extractToken } from '../utils/cookies.js';
import { isTokenRevoked } from '../utils/rateLimit.js';

function isPasswordVersionValid(payload, passwordHash) {
  return !(payload?.pv && passwordHash && payload.pv !== passwordVersion(passwordHash));
}

export const verifyUser = () => async (c, next) => {
  const token = extractToken(c, 'dentzy_jwt');
  if (!token || !c.env.JWT_SECRET) return c.json({ message: 'Access denied. Please log in.' }, 401);

  try {
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    if (await isTokenRevoked(c.env.DB, payload.jti)) {
      return c.json({ message: 'Session revoked. Please log in again.' }, 401);
    }
    const row = await c.env.DB.prepare(
      'SELECT id, name, email, status, dob, phone, clinicName, address, password, createdAt, updatedAt FROM users WHERE id = ?'
    ).bind(payload.id).first();
    if (!row) return c.json({ message: 'User not found.' }, 401);
    if (!isPasswordVersionValid(payload, row.password)) {
      return c.json({ message: 'Session expired after password change. Please log in again.' }, 401);
    }
    if (row.status !== 'approved') return c.json({ message: 'Your account is not approved yet.' }, 403);
    const { password: _, ...user } = row;
    c.set('user', user);
    c.set('userPv', passwordVersion(row.password));
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
      if (payload.role === 'admin' && !(await isTokenRevoked(c.env.DB, payload.jti))) {
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
      if (payload.role === 'staff' && payload.id && !(await isTokenRevoked(c.env.DB, payload.jti))) {
        const row = await c.env.DB.prepare(
          'SELECT id, username, displayName, designation, employeeId, email, phone, dob, status, password FROM staff WHERE id = ?'
        ).bind(payload.id).first();

        if (row && row.status === 'active' && isExecutiveRole(row.designation) && isPasswordVersionValid(payload, row.password)) {
          const { password: _, ...staff } = row;
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
  if (!token || !c.env.STAFF_JWT_SECRET) return c.json({ message: 'Staff access denied. No token.' }, 401);

  try {
    const payload = await verifyJWT(token, c.env.STAFF_JWT_SECRET);
    if (payload.role !== 'staff') throw new Error('Not staff');
    if (await isTokenRevoked(c.env.DB, payload.jti)) {
      return c.json({ message: 'Staff session revoked. Please log in again.' }, 401);
    }
    const row = await c.env.DB.prepare(
      'SELECT id, username, displayName, designation, employeeId, email, phone, dob, status, password FROM staff WHERE id = ?'
    ).bind(payload.id).first();
    if (!row) return c.json({ message: 'Staff not found.' }, 401);
    if (!isPasswordVersionValid(payload, row.password)) {
      return c.json({ message: 'Staff session expired. Please log in again.' }, 401);
    }
    if (row.status !== 'active') return c.json({ message: 'Staff account is inactive.' }, 403);
    const { password: _, ...staff } = row;
    c.set('staff', { ...payload, ...staff, role: 'staff' });
    c.set('staffPv', passwordVersion(row.password));
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
      if (payload.role === 'admin' && !(await isTokenRevoked(c.env.DB, payload.jti))) {
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
      if (payload.role === 'staff' && payload.id && !(await isTokenRevoked(c.env.DB, payload.jti))) {
        const row = await c.env.DB.prepare(
          'SELECT id, username, displayName, designation, status, password FROM staff WHERE id = ?'
        ).bind(payload.id).first();
        if (row && row.status === 'active' && isPasswordVersionValid(payload, row.password)) {
          const { password: _, ...staff } = row;
          c.set('role', 'staff');
          c.set('staff', { ...payload, ...staff, role: 'staff' });
          return next();
        }
      }
    } catch {}
  }

  const userToken = extractToken(c, 'dentzy_jwt');
  if (userToken && c.env.JWT_SECRET) {
    try {
      const payload = await verifyJWT(userToken, c.env.JWT_SECRET);
      if (payload.id && !(await isTokenRevoked(c.env.DB, payload.jti))) {
        const row = await c.env.DB.prepare(
          'SELECT id, name, email, status, password FROM users WHERE id = ?'
        ).bind(payload.id).first();
        if (row && row.status === 'approved' && isPasswordVersionValid(payload, row.password)) {
          const { password: _, ...user } = row;
          c.set('role', 'user');
          c.set('user', user);
          return next();
        }
      }
    } catch {}
  }

  return c.json({ message: 'Access denied. Please log in.' }, 401);
};

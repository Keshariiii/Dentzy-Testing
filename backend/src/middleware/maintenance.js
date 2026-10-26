// ponytail: Fast zero-leak Hono middleware checking D1 maintenance_mode with admin immunity
import { verifyJWT } from '../utils/crypto.js';

// Parse cookie string into key-value map without external libraries
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
  const cookies = parseCookies(c.req.header('Cookie'));
  if (cookies[cookieName]) return cookies[cookieName];
  const auth = c.req.header('Authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
};

// ponytail: Reusable response builder keeping payload standardized across all blocked routes
export const buildMaintenance503 = (c, maintenance, affectedRole) => {
  c.header('Retry-After', '300');
  return c.json({
    code: 'MAINTENANCE_MODE',
    maintenance: true,
    target: maintenance?.target || 'both',
    affectedRole,
    message: 'Dentzy is undergoing scheduled maintenance. Your patient files and orders are completely safe.',
    customMessage: maintenance?.customMessage || 'We are upgrading our ceramic CAD/CAM milling server to serve your clinic faster.',
    estimatedTime: maintenance?.estimatedTime || 'Expected back online: Today at 6:00 PM IST',
    showEmergencyContact: maintenance?.showEmergencyContact !== false,
    hotline: '+91 95036 68112',
    whatsapp: '919503668112',
    updatedAt: maintenance?.updatedAt || null,
  }, 503);
};

export const maintenanceGuard = () => async (c, next) => {
  const path = c.req.path;

  // 1. Critical immunity paths — NEVER block under any circumstance
  // ponytail: Early return for admin, health, status, and logout routes preserves emergency control
  if (
    path === '/' ||
    path === '/api/health' ||
    path === '/api/maintenance/status' ||
    path.startsWith('/api/admin') ||
    path === '/api/auth/logout' ||
    path === '/api/staff/logout'
  ) {
    return next();
  }

  // 2. Fetch current maintenance state from DB
  let maintenance = null;
  try {
    const row = await c.env.DB.prepare(
      "SELECT value, updated_at FROM app_settings WHERE key = 'maintenance_mode'"
    ).first();
    if (row?.value) {
      maintenance = JSON.parse(row.value);
      maintenance.updatedAt = row.updated_at;
    }
  } catch {
    // If DB read fails, fail open to normal operation to avoid outage amplification
    return next();
  }

  // If maintenance mode is not active, allow request
  if (!maintenance || !maintenance.enabled) {
    return next();
  }

  const target = maintenance.target || 'both';
  const dentistBlocked = target === 'dentists' || target === 'both';
  const staffBlocked = target === 'staff' || target === 'both';

  // 3. Shared endpoints (e.g. /api/payments/*)
  // ponytail: For shared routes, inspect JWT identity to allow Admin and only block affected roles
  if (path.startsWith('/api/payments')) {
    const adminToken = extractToken(c, 'dentzy_admin_jwt');
    if (adminToken && c.env.ADMIN_JWT_SECRET) {
      try {
        const payload = await verifyJWT(adminToken, c.env.ADMIN_JWT_SECRET);
        if (payload?.role === 'admin') {
          return next();
        }
      } catch {}
    }

    const staffToken = extractToken(c, 'dentzy_staff_jwt');
    if (staffToken && c.env.STAFF_JWT_SECRET) {
      try {
        const payload = await verifyJWT(staffToken, c.env.STAFF_JWT_SECRET);
        if (payload?.role === 'staff') {
          if (staffBlocked) {
            return buildMaintenance503(c, maintenance, 'staff');
          }
          return next();
        }
      } catch {}
    }

    const dentistToken = extractToken(c, 'dentzy_jwt');
    if (dentistToken && c.env.JWT_SECRET) {
      try {
        const payload = await verifyJWT(dentistToken, c.env.JWT_SECRET);
        if (payload?.id) {
          if (dentistBlocked) {
            return buildMaintenance503(c, maintenance, 'dentist');
          }
          return next();
        }
      } catch {}
    }

    // If unauthenticated or token expired, but target blocks dentists (or both), block as dentist
    if (dentistBlocked) {
      return buildMaintenance503(c, maintenance, 'dentist');
    }
    if (staffBlocked) {
      return buildMaintenance503(c, maintenance, 'staff');
    }
    return next();
  }

  // 4. Dentist Dashboard routes (/api/dashboard/*)
  if (path.startsWith('/api/dashboard')) {
    if (dentistBlocked) {
      return buildMaintenance503(c, maintenance, 'dentist');
    }
    return next();
  }

  // 5. Dentist Auth routes (/api/auth/*) except logout
  if (path.startsWith('/api/auth')) {
    if (dentistBlocked) {
      return buildMaintenance503(c, maintenance, 'dentist');
    }
    return next();
  }

  // 6. Staff routes (/api/staff/*) except logout
  if (path.startsWith('/api/staff')) {
    if (staffBlocked) {
      return buildMaintenance503(c, maintenance, 'staff');
    }
    return next();
  }

  return next();
};

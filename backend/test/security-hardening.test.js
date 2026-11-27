import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/index.js';
import {
  hashPassword,
  passwordVersion,
  signJWT,
  createOtpToken,
  verifyOtpToken,
} from '../src/utils/crypto.js';

function createSecurityMockEnv(overrides = {}) {
  const rateLimits = [];
  const users = new Map();
  const staff = new Map();
  const orders = new Map();
  const payments = new Map();

  function runQuery(query, args) {
    if (query.includes('DELETE FROM rate_limits WHERE key LIKE ? AND ts < ?')) {
      const prefix = String(args[0] || '').replace(/%$/, '');
      const tsLimit = args[1];
      for (let i = rateLimits.length - 1; i >= 0; i--) {
        if (rateLimits[i].key.startsWith(prefix) && rateLimits[i].ts < tsLimit) {
          rateLimits.splice(i, 1);
        }
      }
      return { results: [], meta: { changes: 1 } };
    }
    if (query.includes('DELETE FROM rate_limits WHERE key = ? AND ts < ?')) {
      for (let i = rateLimits.length - 1; i >= 0; i--) {
        if (rateLimits[i].key === args[0] && rateLimits[i].ts < args[1]) {
          rateLimits.splice(i, 1);
        }
      }
      return { results: [], meta: { changes: 1 } };
    }
    if (query.includes('DELETE FROM rate_limits WHERE key = ?')) {
      for (let i = rateLimits.length - 1; i >= 0; i--) {
        if (rateLimits[i].key === args[0]) rateLimits.splice(i, 1);
      }
      return { results: [], meta: { changes: 1 } };
    }
    if (query.includes('SELECT COUNT(*) as cnt FROM rate_limits')) {
      const cnt = rateLimits.filter(r => r.key === args[0] && r.ts >= args[1]).length;
      return { results: [{ cnt }] };
    }
    if (query.includes('INSERT INTO rate_limits')) {
      rateLimits.push({ key: args[0], ts: args[1] });
      return { results: [], meta: { changes: 1 } };
    }
    return { results: [], meta: { changes: 0 } };
  }

  const db = {
    async batch(statements) {
      return Promise.all(statements.map(s => s._batchExec()));
    },
    prepare(query) {
      const execWithArgs = (args) => ({
        _batchExec: async () => runQuery(query, args),
        run: async () => runQuery(query, args),
        first: async () => {
          if (query.includes('FROM rate_limits WHERE key = ? AND ts >= ?')) {
            return rateLimits.find(r => r.key === args[0] && r.ts >= args[1]) || null;
          }
          if (query.includes('FROM rate_limits WHERE key = ? LIMIT 1')) {
            return rateLimits.find(r => r.key === args[0]) || null;
          }
          if (query.includes('FROM users WHERE email = ?')) {
            const target = String(args[0] || '').toLowerCase();
            for (const u of users.values()) {
              if (u.email.toLowerCase() === target) return { ...u };
            }
            return null;
          }
          if (query.includes('FROM users WHERE id = ?')) {
            const u = users.get(args[0]);
            return u ? { ...u } : null;
          }
          if (query.includes('FROM staff WHERE id = ?')) {
            const s = staff.get(args[0]);
            return s ? { ...s } : null;
          }
          if (query.includes('FROM lab_orders WHERE id = ?')) {
            const o = orders.get(args[0]);
            return o ? { ...o } : null;
          }
          if (query.includes('FROM lab_orders o') && query.includes('JOIN users u')) {
            const o = orders.get(args[0]);
            if (!o) return null;
            const u = users.get(o.ownerId) || {};
            return { ...o, dentistName: u.name, clinicName: u.clinicName, address: u.address, phone: u.phone };
          }
          if (query.includes('FROM payments p')) {
            return payments.get(args[0]) || null;
          }
          return null;
        },
        all: async () => ({ results: [] }),
      });

      return {
        bind: (...args) => execWithArgs(args),
        ...execWithArgs([]),
      };
    },
  };

  return {
    users,
    staff,
    orders,
    payments,
    rateLimits,
    env: {
      DB: db,
      JWT_SECRET: 'sec-user-secret',
      ADMIN_JWT_SECRET: 'sec-admin-secret',
      STAFF_JWT_SECRET: 'sec-staff-secret',
      ADMIN_USERNAME: 'admin',
      ADMIN_PASSWORD: 'SuperSecretAdminPassword!',
      ALLOWED_ORIGINS: 'https://dentzy-testing.pages.dev,https://*.dentzy-testing.pages.dev',
      NODE_ENV: 'production',
      ...overrides,
    },
  };
}

function extractCookieValue(setCookieHeader, name) {
  const match = String(setCookieHeader || '').match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}

describe('Security Hardening Regression Suite', () => {
  let ctx;

  beforeEach(() => {
    ctx = createSecurityMockEnv();
  });

  it('rejects arbitrary *.pages.dev origins and allows project preview subdomains only', async () => {
    const evilRes = await app.request('/api/health', {
      headers: { Origin: 'https://evil-attacker.pages.dev' },
    }, ctx.env);
    assert.equal(evilRes.headers.get('access-control-allow-origin'), null);

    const injectedDotRes = await app.request('/api/health', {
      headers: { Origin: 'https://evil.sub.dentzy-testing.pages.dev' },
    }, ctx.env);
    assert.equal(injectedDotRes.headers.get('access-control-allow-origin'), null);

    const validPreviewRes = await app.request('/api/health', {
      headers: { Origin: 'https://abc123.dentzy-testing.pages.dev' },
    }, ctx.env);
    assert.equal(validPreviewRes.headers.get('access-control-allow-origin'), 'https://abc123.dentzy-testing.pages.dev');
    assert.equal(validPreviewRes.headers.get('access-control-allow-credentials'), 'true');
  });

  it('sets HttpOnly SameSite=Lax cookies and never leaks JWT tokens in JSON on admin or dentist login', async () => {
    const pwHash = await hashPassword('DentistPass123!');
    ctx.users.set('u-1', {
      id: 'u-1',
      name: 'Dr. Secure',
      email: 'secure@dentzy.in',
      password: pwHash,
      status: 'approved',
      createdAt: 1000,
    });

    const userRes = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'secure@dentzy.in', password: 'DentistPass123!' }),
    }, ctx.env);
    assert.equal(userRes.status, 200);
    const userCookie = userRes.headers.get('set-cookie') || '';
    assert.match(userCookie, /HttpOnly/i);
    assert.match(userCookie, /SameSite=Lax/i);
    assert.match(userCookie, /Secure/i);
    assert.doesNotMatch(userCookie, /SameSite=None/i);
    const userJson = await userRes.json();
    assert.equal(userJson.token, undefined);

    const adminRes = await app.request('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'SuperSecretAdminPassword!' }),
    }, ctx.env);
    assert.equal(adminRes.status, 200);
    const adminCookie = adminRes.headers.get('set-cookie') || '';
    assert.match(adminCookie, /dentzy_admin_jwt=/);
    assert.match(adminCookie, /SameSite=Lax/i);
    const adminJson = await adminRes.json();
    assert.equal(adminJson.token, undefined);
  });

  it('fails closed on admin login when ADMIN_USERNAME or ADMIN_PASSWORD are missing', async () => {
    const { env } = createSecurityMockEnv({ ADMIN_USERNAME: '', ADMIN_PASSWORD: '' });
    const res = await app.request('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'any' }),
    }, env);
    assert.equal(res.status, 500);
  });

  it('revokes JWT jti on /logout for dentist, staff, and admin portals', async () => {
    const pwHash = await hashPassword('Pass12345!');
    ctx.users.set('u-1', {
      id: 'u-1',
      name: 'Dr. Revoke',
      email: 'revoke@dentzy.in',
      password: pwHash,
      status: 'approved',
    });
    ctx.staff.set('s-1', {
      id: 's-1',
      username: 'staff_revoke',
      displayName: 'Staff Revoke',
      designation: 'Receptionist',
      status: 'active',
      password: pwHash,
    });

    const userJwt = await signJWT({ id: 'u-1', pv: passwordVersion(pwHash) }, ctx.env.JWT_SECRET, '1h');
    await app.request('/api/auth/logout', {
      method: 'POST',
      headers: { Cookie: `dentzy_jwt=${userJwt}` },
    }, ctx.env);
    const userMeAfter = await app.request('/api/auth/me', {
      headers: { Cookie: `dentzy_jwt=${userJwt}` },
    }, ctx.env);
    assert.equal(userMeAfter.status, 401);

    const staffJwt = await signJWT({ id: 's-1', role: 'staff', username: 'staff_revoke', pv: passwordVersion(pwHash) }, ctx.env.STAFF_JWT_SECRET, '1h');
    await app.request('/api/staff/logout', {
      method: 'POST',
      headers: { Cookie: `dentzy_staff_jwt=${staffJwt}` },
    }, ctx.env);
    const staffMeAfter = await app.request('/api/staff/me', {
      headers: { Cookie: `dentzy_staff_jwt=${staffJwt}` },
    }, ctx.env);
    assert.equal(staffMeAfter.status, 401);

    const adminLoginRes = await app.request('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'SuperSecretAdminPassword!' }),
    }, ctx.env);
    const adminJwt = extractCookieValue(adminLoginRes.headers.get('set-cookie'), 'dentzy_admin_jwt');
    assert.ok(adminJwt);
    await app.request('/api/admin/logout', {
      method: 'POST',
      headers: { Cookie: `dentzy_admin_jwt=${adminJwt}` },
    }, ctx.env);
    const adminMeAfter = await app.request('/api/admin/me', {
      headers: { Cookie: `dentzy_admin_jwt=${adminJwt}` },
    }, ctx.env);
    assert.equal(adminMeAfter.status, 401);
  });

  it('invalidates existing dentist JWT immediately after password hash changes (pv mismatch)', async () => {
    const oldHash = await hashPassword('OldPassword123!');
    const newHash = await hashPassword('NewPassword456!');
    ctx.users.set('u-pv', {
      id: 'u-pv',
      name: 'Dr. PV',
      email: 'pv@dentzy.in',
      password: oldHash,
      status: 'approved',
    });

    const staleJwt = await signJWT({ id: 'u-pv', pv: passwordVersion(oldHash) }, ctx.env.JWT_SECRET, '1h');
    const beforeRes = await app.request('/api/auth/me', {
      headers: { Cookie: `dentzy_jwt=${staleJwt}` },
    }, ctx.env);
    assert.equal(beforeRes.status, 200);

    ctx.users.get('u-pv').password = newHash;
    const afterRes = await app.request('/api/auth/me', {
      headers: { Cookie: `dentzy_jwt=${staleJwt}` },
    }, ctx.env);
    assert.equal(afterRes.status, 401);
  });

  it('verifyAnyAuth rejects inactive staff and pending dentists', async () => {
    ctx.payments.set('pay-1', { id: 'pay-1', ownerId: 'u-pend', caseId: 'DZ-1', amount: 500, status: 'Paid' });
    ctx.staff.set('s-inactive', {
      id: 's-inactive',
      username: 'offboarded',
      designation: 'Receptionist',
      status: 'inactive',
      password: 'x',
    });
    ctx.users.set('u-pend', {
      id: 'u-pend',
      name: 'Dr. Pending',
      email: 'pending@dentzy.in',
      status: 'pending',
      password: 'x',
    });

    const inactiveStaffJwt = await signJWT({ id: 's-inactive', role: 'staff', username: 'offboarded' }, ctx.env.STAFF_JWT_SECRET, '1h');
    const staffRes = await app.request('/api/payments/single/pay-1', {
      headers: { Cookie: `dentzy_staff_jwt=${inactiveStaffJwt}` },
    }, ctx.env);
    assert.equal(staffRes.status, 401);

    const pendingUserJwt = await signJWT({ id: 'u-pend' }, ctx.env.JWT_SECRET, '1h');
    const userRes = await app.request('/api/payments/single/pay-1', {
      headers: { Cookie: `dentzy_jwt=${pendingUserJwt}` },
    }, ctx.env);
    assert.equal(userRes.status, 401);
  });

  it('enforces staff RBAC across stage updates, inventory writes, and pre-QC delivery blocks', async () => {
    ctx.staff.set('s-delivery', { id: 's-delivery', username: 'rider', designation: 'Delivery', status: 'active' });
    ctx.staff.set('s-acrylic', { id: 's-acrylic', username: 'acr', designation: 'Acrylic', status: 'active' });
    ctx.staff.set('s-ceramic', { id: 's-ceramic', username: 'cer', designation: 'Ceramic', status: 'active' });
    ctx.users.set('u-1', { id: 'u-1', name: 'Dr. Clinic', clinicName: 'Smile', address: 'Mumbai', phone: '999', status: 'approved' });
    ctx.orders.set('ord-cer', {
      id: 'ord-cer',
      ownerId: 'u-1',
      caseId: 'DZ-100',
      stage: 'production',
      status: 'In Progress',
      assigned_department: 'Ceramic',
      assigned_staff_id: 's-ceramic',
    });

    const deliveryToken = await signJWT({ id: 's-delivery', role: 'staff', username: 'rider' }, ctx.env.STAFF_JWT_SECRET, '1h');
    const acrylicToken = await signJWT({ id: 's-acrylic', role: 'staff', username: 'acr' }, ctx.env.STAFF_JWT_SECRET, '1h');
    const ceramicToken = await signJWT({ id: 's-ceramic', role: 'staff', username: 'cer' }, ctx.env.STAFF_JWT_SECRET, '1h');

    // Delivery blocked from production stage mutation
    const delivStageRes = await app.request('/api/staff/orders/ord-cer/stage', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: `dentzy_staff_jwt=${deliveryToken}` },
      body: JSON.stringify({ stage: 'qc' }),
    }, ctx.env);
    assert.equal(delivStageRes.status, 403);

    // Acrylic technician blocked from Ceramic department order
    const crossDeptRes = await app.request('/api/staff/orders/ord-cer/stage', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: `dentzy_staff_jwt=${acrylicToken}` },
      body: JSON.stringify({ stage: 'qc' }),
    }, ctx.env);
    assert.equal(crossDeptRes.status, 403);

    // Production technician blocked from creating inventory items
    const invRes = await app.request('/api/staff/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `dentzy_staff_jwt=${ceramicToken}` },
      body: JSON.stringify({ item_name: 'Zirconia Block', unit: 'pcs', quantity: 5 }),
    }, ctx.env);
    assert.equal(invRes.status, 403);

    // Delivery blocked from dispatching order still in production (pre-QC)
    const preQcRes = await app.request('/api/staff/deliveries/ord-cer/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: `dentzy_staff_jwt=${deliveryToken}` },
      body: JSON.stringify({ status: 'dispatched' }),
    }, ctx.env);
    assert.equal(preQcRes.status, 400);
  });

  it('prevents OTP single-use replay and prevents pending account enumeration on forgot-password', async () => {
    const otpToken = await createOtpToken('doc@dentzy.in', '654321', ctx.env.JWT_SECRET);
    const firstVerify = await verifyOtpToken(otpToken, 'doc@dentzy.in', '654321', ctx.env.JWT_SECRET, ctx.env.DB);
    assert.equal(firstVerify.valid, true);

    const replayVerify = await verifyOtpToken(otpToken, 'doc@dentzy.in', '654321', ctx.env.JWT_SECRET, ctx.env.DB);
    assert.equal(replayVerify.valid, false);
    assert.match(replayVerify.message, /already used/i);

    const devCtx = createSecurityMockEnv({ NODE_ENV: 'development', RECAPTCHA_SECRET_KEY: '' });
    devCtx.users.set('u-pend', { id: 'u-pend', name: 'Dr. Pending', email: 'pending@dentzy.in', status: 'pending' });

    const enumRes = await app.request('/api/auth/forgot-password/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'pending@dentzy.in' }),
    }, devCtx.env);
    assert.equal(enumRes.status, 200);
    const enumBody = await enumRes.json();
    assert.equal(enumBody.otpToken, undefined);
  });
});

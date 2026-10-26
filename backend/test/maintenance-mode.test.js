import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import app from '../src/index.js';

describe('Role-Based Maintenance Mode API Matrix', () => {
  const setup = async (maintenanceSetting) => {
    const adminSecret = 'test-admin-secret';
    const staffSecret = 'test-staff-secret';
    const userSecret = 'test-user-secret';

    const adminToken = await new SignJWT({ role: 'admin', username: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(adminSecret));

    const staffToken = await new SignJWT({ id: 'staff-1', role: 'staff', username: 'staff1' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(staffSecret));

    const dentistToken = await new SignJWT({ id: 'dentist-1', role: 'user', email: 'dentist@dentzy.in' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(userSecret));

    const store = new Map();
    if (maintenanceSetting) {
      store.set('maintenance_mode', JSON.stringify(maintenanceSetting));
    }

    const mockEnv = {
      DB: {
        prepare: (query) => {
          return {
            bind: (...args) => {
              return {
                first: async () => {
                  if (query.includes('FROM staff WHERE id = ?')) {
                    return { id: args[0], username: 'staff1', displayName: 'Staff One', status: 'active' };
                  }
                  if (query.includes('FROM users WHERE id = ?')) {
                    return { id: args[0], name: 'Dr. Dentist', email: 'dentist@dentzy.in', status: 'approved' };
                  }
                  if (query.includes('FROM app_settings WHERE key =')) {
                    const key = args[0] || (query.includes('maintenance_mode') ? 'maintenance_mode' : null);
                    if (key && store.has(key)) {
                      return { value: store.get(key), updated_at: '2026-10-26T12:00:00Z', updated_by: 'admin' };
                    }
                  }
                  if (query.includes('FROM payments')) {
                    return { id: 'p-1', caseId: 'DZ-1', ownerId: 'dentist-1', amount: 1500, status: 'Pending' };
                  }
                  return null;
                },
                all: async () => {
                  if (query.includes('FROM payments')) {
                    return { results: [{ id: 'p-1', caseId: 'DZ-1', ownerId: 'dentist-1', amount: 1500, status: 'Pending' }] };
                  }
                  if (query.includes('FROM lab_orders')) {
                    return { results: [{ id: 'order-1', caseId: 'DZ-1', ownerId: 'dentist-1', patientName: 'John', status: 'In Progress' }] };
                  }
                  return { results: [] };
                },
                run: async () => {
                  if (query.includes('maintenance_mode') || args.includes('maintenance_mode')) {
                    store.set('maintenance_mode', args[0]);
                  }
                  return { meta: { changes: 1 } };
                },
              };
            },
            first: async () => {
              if (query.includes('SELECT 1')) return { 1: 1 };
              if (query.includes('maintenance_mode') && store.has('maintenance_mode')) {
                return { value: store.get('maintenance_mode'), updated_at: '2026-10-26T12:00:00Z', updated_by: 'admin' };
              }
              return null;
            },
          };
        },
      },
      ADMIN_JWT_SECRET: adminSecret,
      STAFF_JWT_SECRET: staffSecret,
      JWT_SECRET: userSecret,
    };

    return { adminToken, staffToken, dentistToken, mockEnv, store };
  };

  it('Public status /api/maintenance/status returns 200 in all states and never blocks', async () => {
    const { mockEnv } = await setup({
      enabled: true,
      target: 'both',
      customMessage: 'System maintenance active',
      estimatedTime: 'Back at 6 PM',
      showEmergencyContact: true,
    });
    const res = await app.request('/api/maintenance/status', {}, mockEnv);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.enabled, true);
    assert.equal(body.target, 'both');
    assert.equal(body.customMessage, 'System maintenance active');
    assert.ok(body.serverTime);
  });

  it('State 1: enabled = false (Normal Operation) allows all roles', async () => {
    const { adminToken, staffToken, dentistToken, mockEnv } = await setup({
      enabled: false,
      target: 'both',
    });

    const dentistRes = await app.request('/api/dashboard/orders', {
      headers: { Cookie: `dentzy_jwt=${dentistToken}` },
    }, mockEnv);
    assert.equal(dentistRes.status, 200);

    const staffRes = await app.request('/api/staff/orders', {
      headers: { Cookie: `dentzy_staff_jwt=${staffToken}` },
    }, mockEnv);
    assert.equal(staffRes.status, 200);

    const adminRes = await app.request('/api/admin/orders', {
      headers: { Cookie: `dentzy_admin_jwt=${adminToken}` },
    }, mockEnv);
    assert.equal(adminRes.status, 200);
  });

  it('State 2: enabled = true, target = "dentists" blocks dentist and permits staff/admin', async () => {
    const { adminToken, staffToken, dentistToken, mockEnv } = await setup({
      enabled: true,
      target: 'dentists',
      customMessage: 'Upgrading CAD/CAM server for dentists',
      estimatedTime: 'Back at 5 PM',
      showEmergencyContact: true,
    });

    // Dentist dashboard is blocked with 503
    const dentistRes = await app.request('/api/dashboard/orders', {
      headers: { Cookie: `dentzy_jwt=${dentistToken}` },
    }, mockEnv);
    assert.equal(dentistRes.status, 503);
    assert.equal(dentistRes.headers.get('Retry-After'), '300');
    const dentistBody = await dentistRes.json();
    assert.equal(dentistBody.code, 'MAINTENANCE_MODE');
    assert.equal(dentistBody.affectedRole, 'dentist');
    assert.equal(dentistBody.target, 'dentists');
    assert.equal(dentistBody.customMessage, 'Upgrading CAD/CAM server for dentists');

    // Dentist auth login endpoint is blocked with 503
    const dentistLoginRes = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dentist@dentzy.in', password: 'Password123!' }),
    }, mockEnv);
    assert.equal(dentistLoginRes.status, 503);

    // Dentist logout is ALLOWED
    const dentistLogoutRes = await app.request('/api/auth/logout', { method: 'POST' }, mockEnv);
    assert.notEqual(dentistLogoutRes.status, 503);

    // Staff is NOT blocked
    const staffRes = await app.request('/api/staff/orders', {
      headers: { Cookie: `dentzy_staff_jwt=${staffToken}` },
    }, mockEnv);
    assert.equal(staffRes.status, 200);

    // Admin is NOT blocked
    const adminRes = await app.request('/api/admin/orders', {
      headers: { Cookie: `dentzy_admin_jwt=${adminToken}` },
    }, mockEnv);
    assert.equal(adminRes.status, 200);
  });

  it('State 3: enabled = true, target = "staff" blocks staff and permits dentists/admin', async () => {
    const { adminToken, staffToken, dentistToken, mockEnv } = await setup({
      enabled: true,
      target: 'staff',
      customMessage: 'Lab staff maintenance in progress',
      estimatedTime: 'Back at 6 PM',
      showEmergencyContact: true,
    });

    // Staff is blocked with 503
    const staffRes = await app.request('/api/staff/orders', {
      headers: { Cookie: `dentzy_staff_jwt=${staffToken}` },
    }, mockEnv);
    assert.equal(staffRes.status, 503);
    assert.equal(staffRes.headers.get('Retry-After'), '300');
    const staffBody = await staffRes.json();
    assert.equal(staffBody.code, 'MAINTENANCE_MODE');
    assert.equal(staffBody.affectedRole, 'staff');

    // Staff logout is ALLOWED
    const staffLogoutRes = await app.request('/api/staff/logout', { method: 'POST' }, mockEnv);
    assert.notEqual(staffLogoutRes.status, 503);

    // Dentist is NOT blocked
    const dentistRes = await app.request('/api/dashboard/orders', {
      headers: { Cookie: `dentzy_jwt=${dentistToken}` },
    }, mockEnv);
    assert.equal(dentistRes.status, 200);

    // Admin is NOT blocked
    const adminRes = await app.request('/api/admin/orders', {
      headers: { Cookie: `dentzy_admin_jwt=${adminToken}` },
    }, mockEnv);
    assert.equal(adminRes.status, 200);
  });

  it('State 4: enabled = true, target = "both" blocks dentists and staff while admin retains 100% access', async () => {
    const { adminToken, staffToken, dentistToken, mockEnv } = await setup({
      enabled: true,
      target: 'both',
      customMessage: 'Global maintenance',
      estimatedTime: 'Back soon',
      showEmergencyContact: true,
    });

    // Dentist blocked
    const dentistRes = await app.request('/api/dashboard/orders', {
      headers: { Cookie: `dentzy_jwt=${dentistToken}` },
    }, mockEnv);
    assert.equal(dentistRes.status, 503);

    // Staff blocked
    const staffRes = await app.request('/api/staff/orders', {
      headers: { Cookie: `dentzy_staff_jwt=${staffToken}` },
    }, mockEnv);
    assert.equal(staffRes.status, 503);

    // Admin is NEVER blocked
    const adminRes = await app.request('/api/admin/orders', {
      headers: { Cookie: `dentzy_admin_jwt=${adminToken}` },
    }, mockEnv);
    assert.equal(adminRes.status, 200);

    // Admin can turn maintenance mode OFF via PUT /api/admin/settings/maintenance
    const turnOffRes = await app.request('/api/admin/settings/maintenance', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `dentzy_admin_jwt=${adminToken}`,
      },
      body: JSON.stringify({ enabled: false, target: 'both' }),
    }, mockEnv);
    assert.equal(turnOffRes.status, 200);

    // Health check is NEVER blocked
    const healthRes = await app.request('/api/health', {}, mockEnv);
    assert.equal(healthRes.status, 200);
  });

  it('Shared invoice endpoint (/api/payments/batch/:id) allows admin, blocks locked roles', async () => {
    const { adminToken, staffToken, dentistToken, mockEnv } = await setup({
      enabled: true,
      target: 'dentists',
    });

    // Admin allowed
    const adminRes = await app.request('/api/payments/batch/batch-1', {
      headers: { Cookie: `dentzy_admin_jwt=${adminToken}` },
    }, mockEnv);
    assert.equal(adminRes.status, 200);

    // Staff allowed when target is 'dentists'
    const staffRes = await app.request('/api/payments/batch/batch-1', {
      headers: { Cookie: `dentzy_staff_jwt=${staffToken}` },
    }, mockEnv);
    assert.equal(staffRes.status, 200);

    // Dentist blocked when target is 'dentists'
    const dentistRes = await app.request('/api/payments/batch/batch-1', {
      headers: { Cookie: `dentzy_jwt=${dentistToken}` },
    }, mockEnv);
    assert.equal(dentistRes.status, 503);
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import app from '../src/index.js';
import { verifyAdmin, verifyStaff } from '../src/middleware/auth.js';

describe('Executive Auth Bridge & Full Staff Profile', () => {
  const adminSecret = 'test-admin-secret-exec';
  const staffSecret = 'test-staff-secret-exec';
  const userSecret = 'test-user-secret-exec';

  const createToken = async (payload, secret) => {
    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(secret));
  };

  const createMockDb = (staffMap = new Map(), maintenanceSetting = null) => {
    return {
      prepare: (query) => {
        return {
          bind: (...args) => {
            return {
              first: async () => {
                if (query.includes('FROM staff WHERE id = ?')) {
                  const staffId = args[0];
                  return staffMap.get(staffId) || null;
                }
                if (query.includes('FROM app_settings WHERE key =')) {
                  const key = args[0] || (query.includes('maintenance_mode') ? 'maintenance_mode' : null);
                  if (key === 'maintenance_mode' && maintenanceSetting) {
                    return { value: JSON.stringify(maintenanceSetting), updated_at: '2026-10-31T10:00:00Z' };
                  }
                }
                if (query.includes('FROM payments')) {
                  return { id: 'p-1', caseId: 'DZ-1', ownerId: 'dentist-1', amount: 1500, status: 'Pending' };
                }
                return null;
              },
              all: async () => {
                if (query.includes('FROM lab_orders')) {
                  return { results: [] };
                }
                if (query.includes('FROM payments')) {
                  return { results: [{ id: 'p-1', caseId: 'DZ-1', ownerId: 'dentist-1', amount: 1500, status: 'Pending' }] };
                }
                return { results: [] };
              },
              run: async () => ({ meta: { changes: 1 } }),
            };
          },
          first: async () => {
            if (query.includes('SELECT 1')) return { 1: 1 };
            if (query.includes("app_settings WHERE key = 'maintenance_mode'") && maintenanceSetting) {
              return { value: JSON.stringify(maintenanceSetting), updated_at: '2026-10-31T10:00:00Z' };
            }
            return null;
          },
          all: async () => ({ results: [] }),
          run: async () => ({ meta: { changes: 1 } }),
        };
      },
    };
  };

  const createEnv = (staffMap = new Map(), maintenanceSetting = null) => ({
    DB: createMockDb(staffMap, maintenanceSetting),
    ADMIN_JWT_SECRET: adminSecret,
    STAFF_JWT_SECRET: staffSecret,
    JWT_SECRET: userSecret,
    ALLOWED_ORIGINS: 'http://localhost:3000',
  });

  describe('verifyAdmin() Executive Fallback', () => {
    it('accepts CEO staff token and sets admin with isExecutiveStaff: true', async () => {
      const staffMap = new Map([
        [
          'ceo-1',
          {
            id: 'ceo-1',
            username: 'ceo_jane',
            displayName: 'Jane Doe',
            designation: 'CEO',
            employeeId: '1',
            email: 'jane@dentzy.in',
            phone: '9876543210',
            dob: '1985-05-15',
            status: 'active',
          },
        ],
      ]);
      const mockEnv = createEnv(staffMap);
      const ceoToken = await createToken({ id: 'ceo-1', role: 'staff', username: 'ceo_jane' }, staffSecret);

      const res = await app.request('/api/admin/me', {
        headers: { Cookie: `dentzy_staff_jwt=${ceoToken}` },
      }, mockEnv);

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.admin.role, 'admin');
      assert.equal(body.admin.isExecutiveStaff, true);
      assert.equal(body.admin.id, 'ceo-1');
      assert.equal(body.admin.username, 'ceo_jane');
      assert.equal(body.admin.displayName, 'Jane Doe');
      assert.equal(body.admin.designation, 'CEO');
    });

    it('accepts CTO staff token with case-insensitive designation', async () => {
      const staffMap = new Map([
        [
          'cto-1',
          {
            id: 'cto-1',
            username: 'cto_alex',
            displayName: 'Alex Smith',
            designation: 'cto',
            employeeId: '2',
            email: 'alex@dentzy.in',
            phone: '9876543211',
            dob: '1988-08-20',
            status: 'active',
          },
        ],
      ]);
      const mockEnv = createEnv(staffMap);
      const ctoToken = await createToken({ id: 'cto-1', role: 'staff', username: 'cto_alex' }, staffSecret);

      const res = await app.request('/api/admin/me', {
        headers: { Authorization: `Bearer ${ctoToken}` },
      }, mockEnv);

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.admin.role, 'admin');
      assert.equal(body.admin.isExecutiveStaff, true);
      assert.equal(body.admin.username, 'cto_alex');
    });

    it('rejects Receptionist staff token with 401', async () => {
      const staffMap = new Map([
        [
          'rec-1',
          {
            id: 'rec-1',
            username: 'receptionist_1',
            displayName: 'Rupa',
            designation: 'Receptionist',
            employeeId: '3',
            email: 'rupa@dentzy.in',
            phone: '9876543212',
            dob: '1995-01-10',
            status: 'active',
          },
        ],
      ]);
      const mockEnv = createEnv(staffMap);
      const recToken = await createToken({ id: 'rec-1', role: 'staff', username: 'receptionist_1' }, staffSecret);

      const res = await app.request('/api/admin/me', {
        headers: { Cookie: `dentzy_staff_jwt=${recToken}` },
      }, mockEnv);

      assert.equal(res.status, 401);
      const body = await res.json();
      assert.match(body.message, /Admin access denied/i);
    });

    it('rejects Ceramic production staff token with 401', async () => {
      const staffMap = new Map([
        [
          'cer-1',
          {
            id: 'cer-1',
            username: 'ceramic_tech',
            displayName: 'Karan',
            designation: 'Ceramic',
            employeeId: '4',
            status: 'active',
          },
        ],
      ]);
      const mockEnv = createEnv(staffMap);
      const cerToken = await createToken({ id: 'cer-1', role: 'staff', username: 'ceramic_tech' }, staffSecret);

      const res = await app.request('/api/admin/me', {
        headers: { Cookie: `dentzy_staff_jwt=${cerToken}` },
      }, mockEnv);

      assert.equal(res.status, 401);
    });

    it('rejects inactive CEO staff token with 401', async () => {
      const staffMap = new Map([
        [
          'ceo-inactive',
          {
            id: 'ceo-inactive',
            username: 'old_ceo',
            displayName: 'Old CEO',
            designation: 'CEO',
            employeeId: '5',
            status: 'inactive',
          },
        ],
      ]);
      const mockEnv = createEnv(staffMap);
      const token = await createToken({ id: 'ceo-inactive', role: 'staff', username: 'old_ceo' }, staffSecret);

      const res = await app.request('/api/admin/me', {
        headers: { Cookie: `dentzy_staff_jwt=${token}` },
      }, mockEnv);

      assert.equal(res.status, 401);
    });

    it('accepts native admin token normally', async () => {
      const mockEnv = createEnv();
      const adminToken = await createToken({ role: 'admin', username: 'dentzy_admin' }, adminSecret);

      const res = await app.request('/api/admin/me', {
        headers: { Cookie: `dentzy_admin_jwt=${adminToken}` },
      }, mockEnv);

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.admin.role, 'admin');
      assert.equal(body.admin.username, 'dentzy_admin');
      assert.equal(body.admin.isExecutiveStaff, undefined);
    });

    it('rejects request with missing or invalid tokens with 401', async () => {
      const mockEnv = createEnv();

      // No token
      const resNoToken = await app.request('/api/admin/me', {}, mockEnv);
      assert.equal(resNoToken.status, 401);

      // Invalid token
      const resBadToken = await app.request('/api/admin/me', {
        headers: { Cookie: 'dentzy_admin_jwt=invalid.token.here' },
      }, mockEnv);
      assert.equal(resBadToken.status, 401);
    });
  });

  describe('verifyStaff() Full Profile Attachment', () => {
    it('attaches full profile fields (id, username, displayName, designation, employeeId, email, phone, dob, status) to c.get("staff")', async () => {
      const staffRecord = {
        id: 'staff-42',
        username: 'cadcam_master',
        displayName: 'Ravi Tech',
        designation: 'CAD/CAM',
        employeeId: '42',
        email: 'ravi@dentzy.in',
        phone: '9988776655',
        dob: '1992-03-25',
        status: 'active',
      };
      const staffMap = new Map([['staff-42', staffRecord]]);
      const mockEnv = createEnv(staffMap);
      const token = await createToken({ id: 'staff-42', role: 'staff', username: 'cadcam_master' }, staffSecret);

      let contextStaff = null;
      const fakeContext = {
        req: {
          header: (name) => {
            if (name === 'Cookie') return `dentzy_staff_jwt=${token}`;
            return null;
          },
        },
        env: mockEnv,
        set: (key, val) => {
          if (key === 'staff') contextStaff = val;
        },
        json: (body, status) => ({ body, status }),
      };

      let nextCalled = false;
      const middleware = verifyStaff();
      await middleware(fakeContext, async () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true);
      assert.ok(contextStaff);
      assert.equal(contextStaff.id, 'staff-42');
      assert.equal(contextStaff.username, 'cadcam_master');
      assert.equal(contextStaff.displayName, 'Ravi Tech');
      assert.equal(contextStaff.designation, 'CAD/CAM');
      assert.equal(contextStaff.employeeId, '42');
      assert.equal(contextStaff.email, 'ravi@dentzy.in');
      assert.equal(contextStaff.phone, '9988776655');
      assert.equal(contextStaff.dob, '1992-03-25');
      assert.equal(contextStaff.status, 'active');
      assert.equal(contextStaff.role, 'staff');
    });

    it('returns 403 when staff status is inactive', async () => {
      const staffMap = new Map([
        [
          'staff-inactive',
          {
            id: 'staff-inactive',
            username: 'inactive_user',
            displayName: 'Inactive User',
            designation: 'Ceramic',
            employeeId: '10',
            status: 'inactive',
          },
        ],
      ]);
      const mockEnv = createEnv(staffMap);
      const token = await createToken({ id: 'staff-inactive', role: 'staff', username: 'inactive_user' }, staffSecret);

      let response = null;
      const fakeContext = {
        req: {
          header: (name) => (name === 'Cookie' ? `dentzy_staff_jwt=${token}` : null),
        },
        env: mockEnv,
        set: () => {},
        json: (body, status) => {
          response = { body, status };
          return response;
        },
      };

      const middleware = verifyStaff();
      await middleware(fakeContext, async () => {});

      assert.ok(response);
      assert.equal(response.status, 403);
      assert.match(response.body.message, /inactive/i);
    });

    it('returns 401 when staff record is not found in database', async () => {
      const mockEnv = createEnv(new Map());
      const token = await createToken({ id: 'deleted-staff', role: 'staff', username: 'ghost' }, staffSecret);

      let response = null;
      const fakeContext = {
        req: {
          header: (name) => (name === 'Cookie' ? `dentzy_staff_jwt=${token}` : null),
        },
        env: mockEnv,
        set: () => {},
        json: (body, status) => {
          response = { body, status };
          return response;
        },
      };

      const middleware = verifyStaff();
      await middleware(fakeContext, async () => {});

      assert.ok(response);
      assert.equal(response.status, 401);
      assert.match(response.body.message, /not found/i);
    });
  });

  describe('Maintenance Mode Executive Bypass', () => {
    it('bypasses maintenance mode for CEO staff token on /api/staff/orders', async () => {
      const staffMap = new Map([
        [
          'ceo-1',
          {
            id: 'ceo-1',
            username: 'ceo_boss',
            displayName: 'CEO Boss',
            designation: 'CEO',
            employeeId: '1',
            status: 'active',
          },
        ],
      ]);
      const mockEnv = createEnv(staffMap, { enabled: true, target: 'staff' });
      const ceoToken = await createToken({ id: 'ceo-1', role: 'staff', username: 'ceo_boss' }, staffSecret);

      const res = await app.request('/api/staff/orders', {
        headers: { Cookie: `dentzy_staff_jwt=${ceoToken}` },
      }, mockEnv);

      // Should bypass maintenance mode 503 and return 200
      assert.equal(res.status, 200);
    });

    it('bypasses maintenance mode for CTO staff token on /api/staff/orders when target is "both"', async () => {
      const staffMap = new Map([
        [
          'cto-1',
          {
            id: 'cto-1',
            username: 'cto_leader',
            displayName: 'CTO Leader',
            designation: 'CTO',
            employeeId: '2',
            status: 'active',
          },
        ],
      ]);
      const mockEnv = createEnv(staffMap, { enabled: true, target: 'both' });
      const ctoToken = await createToken({ id: 'cto-1', role: 'staff', username: 'cto_leader' }, staffSecret);

      const res = await app.request('/api/staff/orders', {
        headers: { Cookie: `dentzy_staff_jwt=${ctoToken}` },
      }, mockEnv);

      assert.equal(res.status, 200);
    });

    it('blocks non-executive staff token (Receptionist) with 503 during maintenance', async () => {
      const staffMap = new Map([
        [
          'rec-1',
          {
            id: 'rec-1',
            username: 'rec_user',
            displayName: 'Receptionist User',
            designation: 'Receptionist',
            employeeId: '3',
            status: 'active',
          },
        ],
      ]);
      const mockEnv = createEnv(staffMap, { enabled: true, target: 'staff' });
      const recToken = await createToken({ id: 'rec-1', role: 'staff', username: 'rec_user' }, staffSecret);

      const res = await app.request('/api/staff/orders', {
        headers: { Cookie: `dentzy_staff_jwt=${recToken}` },
      }, mockEnv);

      assert.equal(res.status, 503);
      const body = await res.json();
      assert.equal(body.code, 'MAINTENANCE_MODE');
      assert.equal(body.affectedRole, 'staff');
    });

    it('blocks inactive CEO staff token with 503 during maintenance', async () => {
      const staffMap = new Map([
        [
          'ceo-inactive',
          {
            id: 'ceo-inactive',
            username: 'ceo_inactive',
            displayName: 'CEO Inactive',
            designation: 'CEO',
            employeeId: '1',
            status: 'inactive',
          },
        ],
      ]);
      const mockEnv = createEnv(staffMap, { enabled: true, target: 'staff' });
      const token = await createToken({ id: 'ceo-inactive', role: 'staff', username: 'ceo_inactive' }, staffSecret);

      const res = await app.request('/api/staff/orders', {
        headers: { Cookie: `dentzy_staff_jwt=${token}` },
      }, mockEnv);

      assert.equal(res.status, 503);
    });

    it('bypasses maintenance mode for CEO staff token on shared route /api/payments/batch/:id', async () => {
      const staffMap = new Map([
        [
          'ceo-1',
          {
            id: 'ceo-1',
            username: 'ceo_boss',
            displayName: 'CEO Boss',
            designation: 'CEO',
            employeeId: '1',
            status: 'active',
          },
        ],
      ]);
      const mockEnv = createEnv(staffMap, { enabled: true, target: 'staff' });
      const ceoToken = await createToken({ id: 'ceo-1', role: 'staff', username: 'ceo_boss' }, staffSecret);

      const res = await app.request('/api/payments/batch/batch-1', {
        headers: { Cookie: `dentzy_staff_jwt=${ceoToken}` },
      }, mockEnv);

      assert.equal(res.status, 200);
    });
  });
});

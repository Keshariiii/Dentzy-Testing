import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Hono } from 'hono';
import { verifyAdmin, verifyStaff } from '../src/middleware/auth.js';
import { signJWT } from '../src/utils/crypto.js';
import {
  normalizeDesignation,
  inferDepartment,
  isExecutiveRole,
  isProductionRole,
  isDeliveryRole,
  isReceptionistRole,
} from '../src/utils/roles.js';

// Mock in-memory SQLite-like DB helper for adversarial boundary tests
function createMockDB(data = {}) {
  const staffTable = data.staff || [];
  const ordersTable = data.lab_orders || [];
  const deliveryTasksTable = data.delivery_tasks || [];

  return {
    prepare(sql) {
      return {
        bind(...params) {
          return {
            async first() {
              if (sql.includes('SELECT') && sql.includes('FROM staff WHERE id = ?')) {
                return staffTable.find(s => s.id === params[0]) || null;
              }
              if (sql.includes('SELECT') && sql.includes('FROM staff WHERE username = ?')) {
                return staffTable.find(s => s.username?.toLowerCase() === params[0]?.toLowerCase()) || null;
              }
              if (sql.includes('SELECT') && sql.includes('FROM staff WHERE designation = ? AND status = ?')) {
                return staffTable.find(s => s.designation === params[0] && s.status === params[1]) || null;
              }
              if (sql.includes('SELECT') && sql.includes('FROM lab_orders WHERE id = ?')) {
                return ordersTable.find(o => o.id === params[0]) || null;
              }
              return null;
            },
            async all() {
              if (sql.includes('FROM lab_orders')) {
                let res = [...ordersTable];
                if (sql.includes('o.assigned_department = ?')) {
                  const dept = params[0];
                  res = res.filter(o => o.assigned_department === dept || o.assigned_staff_id === params[1]);
                }
                return { results: res };
              }
              return { results: [] };
            },
            async run() {
              return { meta: { changes: 1 } };
            },
          };
        },
      };
    },
  };
}

describe('Adversarial Limit Testing: Role Taxonomies & Fuzzing', () => {
  test('fuzzing normalizeDesignation with malicious and extreme inputs', () => {
    assert.equal(normalizeDesignation(''), 'Ceramic');
    assert.equal(normalizeDesignation(null), 'Ceramic');
    assert.equal(normalizeDesignation(undefined), 'Ceramic');
    assert.equal(normalizeDesignation(12345), 'Ceramic');
    assert.equal(normalizeDesignation({ role: 'CEO' }), 'Ceramic');
    assert.equal(normalizeDesignation('   cEo   '), 'CEO');
    assert.equal(normalizeDesignation('CTO\n'), 'CTO');
    assert.equal(normalizeDesignation('DROP TABLE users;--'), 'Ceramic');
    assert.equal(normalizeDesignation('<script>alert(1)</script>'), 'Ceramic');
    assert.equal(normalizeDesignation('__proto__'), 'Ceramic');
    assert.equal(normalizeDesignation('toString'), 'Ceramic');
  });

  test('fuzzing inferDepartment with edge cases', () => {
    assert.equal(inferDepartment(null, null), 'Ceramic');
    assert.equal(inferDepartment('', ''), 'Ceramic');
    assert.equal(inferDepartment('Acrylic Partial', 'Crown'), 'Acrylic');
    assert.equal(inferDepartment('Unknown Category', 'Denture'), 'Acrylic');
    assert.equal(inferDepartment('Super Zirconia Translucent', 'Bridge'), 'CAD/CAM');
    assert.equal(inferDepartment('Titanium Milling Disc', 'Implant'), 'Milling');
    assert.equal(inferDepartment('Furnace Sintering Cycle', 'Other'), 'Sintering');
    assert.equal(inferDepartment('High Res 3D Printed Cast', 'Model'), '3D Printing');
  });
});

describe('Adversarial Security: verifyAdmin Boundary Enforcement', () => {
  const STAFF_SECRET = 'test-staff-secret-key-for-jwt-signing-minimum-32-chars';
  const ADMIN_SECRET = 'test-admin-secret-key-for-jwt-signing-minimum-32-chars';

  test('rejects technicians attempting executive privilege escalation', async () => {
    const techUser = { id: 'staff-tech-1', username: 'ceramic_dan', designation: 'Ceramic', status: 'active' };
    const mockDb = createMockDB({ staff: [techUser] });
    const techToken = await signJWT({ id: techUser.id, role: 'staff', username: techUser.username }, STAFF_SECRET, '1h');

    const app = new Hono();
    app.use('/admin/*', verifyAdmin());
    app.get('/admin/secret-data', (c) => c.json({ ok: true }));

    const res = await app.request('/admin/secret-data', {
      headers: {
        Authorization: `Bearer ${techToken}`,
      },
    }, { DB: mockDb, STAFF_JWT_SECRET: STAFF_SECRET, ADMIN_JWT_SECRET: ADMIN_SECRET });

    assert.equal(res.status, 401);
  });

  test('rejects inactive CEO from accessing admin endpoints', async () => {
    const inactiveCeo = { id: 'staff-ceo-inactive', username: 'ex_ceo', designation: 'CEO', status: 'inactive' };
    const mockDb = createMockDB({ staff: [inactiveCeo] });
    const ceoToken = await signJWT({ id: inactiveCeo.id, role: 'staff', username: inactiveCeo.username }, STAFF_SECRET, '1h');

    const app = new Hono();
    app.use('/admin/*', verifyAdmin());
    app.get('/admin/overview', (c) => c.json({ ok: true }));

    const res = await app.request('/admin/overview', {
      headers: {
        Authorization: `Bearer ${ceoToken}`,
      },
    }, { DB: mockDb, STAFF_JWT_SECRET: STAFF_SECRET, ADMIN_JWT_SECRET: ADMIN_SECRET });

    assert.equal(res.status, 401);
  });

  test('permits active CTO with full executive staff context populated', async () => {
    const activeCto = {
      id: 'staff-cto-1',
      username: 'tech_chief',
      displayName: 'Dr. CTO',
      designation: 'CTO',
      employeeId: 'EMP-002',
      email: 'cto@dentzy.in',
      phone: '+919503668112',
      dob: '1988-06-12',
      status: 'active',
    };
    const mockDb = createMockDB({ staff: [activeCto] });
    const ctoToken = await signJWT({ id: activeCto.id, role: 'staff', username: activeCto.username }, STAFF_SECRET, '1h');

    let interceptedAdmin = null;
    const app = new Hono();
    app.use('/admin/*', verifyAdmin());
    app.get('/admin/overview', (c) => {
      interceptedAdmin = c.get('admin');
      return c.json({ ok: true, admin: interceptedAdmin });
    });

    const res = await app.request('/admin/overview', {
      headers: {
        Authorization: `Bearer ${ctoToken}`,
      },
    }, { DB: mockDb, STAFF_JWT_SECRET: STAFF_SECRET, ADMIN_JWT_SECRET: ADMIN_SECRET });

    assert.equal(res.status, 200);
    assert.equal(interceptedAdmin.isExecutiveStaff, true);
    assert.equal(interceptedAdmin.designation, 'CTO');
    assert.equal(interceptedAdmin.role, 'admin');
  });
});

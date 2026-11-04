import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import app from '../src/index.js';
import { hashPassword } from '../src/utils/crypto.js';
import { createStaffSchema } from '../src/validators/admin.js';

describe('SEC-01 & QA-02: Designation-Based RBAC, Workflow Guards & 8-Char Password Floor', () => {
  const staffSecret = 'test-staff-secret-key-rbac';
  const userSecret = 'test-user-secret-key-rbac';

  const createStaffToken = async (payload) => {
    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(new TextEncoder().encode(staffSecret));
  };

  const createUserToken = async (payload) => {
    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(new TextEncoder().encode(userSecret));
  };

  let staffTable;
  let usersTable;
  let ordersTable;
  let paymentsTable;
  let mockEnv;

  beforeEach(async () => {
    staffTable = new Map();
    usersTable = new Map();
    ordersTable = new Map();
    paymentsTable = new Map();

    const hashedPassword = await hashPassword('ValidPass123!');

    // Ceramic production staff
    staffTable.set('staff-ceramic', {
      id: 'staff-ceramic',
      username: 'ceramist_bob',
      password: hashedPassword,
      displayName: 'Bob Ceramist',
      designation: 'Ceramic',
      status: 'active',
    });

    // Receptionist staff
    staffTable.set('staff-receptionist', {
      id: 'staff-receptionist',
      username: 'reception_alice',
      password: hashedPassword,
      displayName: 'Alice Receptionist',
      designation: 'Receptionist',
      status: 'active',
    });

    // CEO staff
    staffTable.set('staff-ceo', {
      id: 'staff-ceo',
      username: 'ceo_charlie',
      password: hashedPassword,
      displayName: 'Charlie CEO',
      designation: 'CEO',
      status: 'active',
    });

    // Dentist user
    usersTable.set('dentist-1', {
      id: 'dentist-1',
      name: 'Dr. Smith',
      email: 'smith@dental.com',
      status: 'approved',
    });

    // Orders
    ordersTable.set('order-received', {
      id: 'order-received',
      ownerId: 'dentist-1',
      patientName: 'Jane Doe',
      caseId: 'DZ-REC-01',
      serviceType: 'Crown',
      status: 'Pending',
      stage: 'received',
      assigned_department: 'Ceramic',
      assigned_staff_id: 'staff-ceramic',
    });

    ordersTable.set('order-in-prod', {
      id: 'order-in-prod',
      ownerId: 'dentist-1',
      patientName: 'Mark Stone',
      caseId: 'DZ-PROD-01',
      serviceType: 'Crown',
      status: 'In Progress',
      stage: 'production',
      assigned_department: 'Ceramic',
      assigned_staff_id: 'staff-ceramic',
    });

    ordersTable.set('order-dispatched', {
      id: 'order-dispatched',
      ownerId: 'dentist-1',
      patientName: 'Sarah Connor',
      caseId: 'DZ-DISP-01',
      serviceType: 'Crown',
      status: 'In Progress',
      stage: 'dispatched',
      assigned_department: 'Ceramic',
      assigned_staff_id: 'staff-ceramic',
    });

    ordersTable.set('order-completed', {
      id: 'order-completed',
      ownerId: 'dentist-1',
      patientName: 'David Lee',
      caseId: 'DZ-COMP-01',
      serviceType: 'Crown',
      status: 'Completed',
      stage: 'completed',
      assigned_department: 'Ceramic',
      assigned_staff_id: 'staff-ceramic',
    });

    const createStmt = (query, boundArgs = []) => ({
      bind: (...args) => createStmt(query, args),
      first: async () => {
        if (query.includes('FROM staff WHERE id = ?')) {
          const s = staffTable.get(boundArgs[0]);
          return s ? { ...s } : null;
        }
        if (query.includes('FROM users WHERE id = ?')) {
          const u = usersTable.get(boundArgs[0]);
          return u ? { ...u } : null;
        }
        if (query.includes('FROM lab_orders WHERE id = ? AND ownerId = ?')) {
          const o = ordersTable.get(boundArgs[0]);
          return (o && o.ownerId === boundArgs[1]) ? { ...o } : null;
        }
        if (query.includes('FROM lab_orders WHERE id = ?')) {
          const o = ordersTable.get(boundArgs[0]);
          return o ? { ...o } : null;
        }
        if (query.includes('SELECT COALESCE(SUM(amount),0) as totalDebt')) {
          return { totalDebt: 0 };
        }
        return null;
      },
      all: async () => {
        if (query.includes('FROM users WHERE status = \'approved\'')) {
          return { results: Array.from(usersTable.values()) };
        }
        if (query.includes('FROM payments')) {
          return { results: [] };
        }
        if (query.includes('FROM lab_orders')) {
          return { results: Array.from(ordersTable.values()) };
        }
        return { results: [] };
      },
      run: async () => {
        if (query.includes('UPDATE lab_orders SET')) {
          const id = boundArgs[boundArgs.length - 1];
          const o = ordersTable.get(id);
          if (o) {
            if (query.includes('stage = ?')) o.stage = boundArgs[0];
            if (query.includes('status = ?')) o.status = boundArgs[1];
            return { meta: { changes: 1 } };
          }
        }
        if (query.includes('DELETE FROM inventory WHERE id = ?')) {
          return { meta: { changes: 1 } };
        }
        if (query.includes('UPDATE staff SET password = ?')) {
          const s = staffTable.get(boundArgs[2]);
          if (s) { s.password = boundArgs[0]; return { meta: { changes: 1 } }; }
        }
        return { meta: { changes: 1 } };
      },
    });

    mockEnv = {
      DB: {
        prepare: (query) => createStmt(query),
      },
      STAFF_JWT_SECRET: staffSecret,
      JWT_SECRET: userSecret,
    };
  });

  describe('1. SEC-01: requireStaffRoles Designation-Based RBAC Enforcement', () => {
    it('blocks production staff (Ceramic) from calling POST /api/staff/orders', async () => {
      const token = await createStaffToken({
        id: 'staff-ceramic',
        role: 'staff',
        username: 'ceramist_bob',
        designation: 'Ceramic',
      });

      const res = await app.request('/api/staff/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `dentzy_staff_jwt=${token}`,
        },
        body: JSON.stringify({
          dentistId: 'dentist-1',
          patientName: 'Test Patient',
          serviceType: 'Crown',
        }),
      }, mockEnv);

      assert.equal(res.status, 403);
      const data = await res.json();
      assert.match(data.message, /Forbidden: Your staff designation does not have permission for this action/);
    });

    it('blocks production staff from calling GET /api/staff/users and GET /api/staff/payments', async () => {
      const token = await createStaffToken({
        id: 'staff-ceramic',
        role: 'staff',
        username: 'ceramist_bob',
        designation: 'Ceramic',
      });

      const usersRes = await app.request('/api/staff/users', {
        headers: { Cookie: `dentzy_staff_jwt=${token}` },
      }, mockEnv);
      assert.equal(usersRes.status, 403);

      const payRes = await app.request('/api/staff/payments', {
        headers: { Cookie: `dentzy_staff_jwt=${token}` },
      }, mockEnv);
      assert.equal(payRes.status, 403);
    });

    it('blocks production staff from calling DELETE /api/staff/inventory/:id', async () => {
      const token = await createStaffToken({
        id: 'staff-ceramic',
        role: 'staff',
        username: 'ceramist_bob',
        designation: 'Ceramic',
      });

      const res = await app.request('/api/staff/inventory/inv-1', {
        method: 'DELETE',
        headers: { Cookie: `dentzy_staff_jwt=${token}` },
      }, mockEnv);
      assert.equal(res.status, 403);
    });

    it('allows Receptionist to access GET /api/staff/users', async () => {
      const token = await createStaffToken({
        id: 'staff-receptionist',
        role: 'staff',
        username: 'reception_alice',
        designation: 'Receptionist',
      });

      const res = await app.request('/api/staff/users', {
        headers: { Cookie: `dentzy_staff_jwt=${token}` },
      }, mockEnv);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.users));
    });

    it('allows CEO to access GET /api/staff/users', async () => {
      const token = await createStaffToken({
        id: 'staff-ceo',
        role: 'staff',
        username: 'ceo_charlie',
        designation: 'CEO',
      });

      const res = await app.request('/api/staff/users', {
        headers: { Cookie: `dentzy_staff_jwt=${token}` },
      }, mockEnv);
      assert.equal(res.status, 200);
    });
  });

  describe('2. QA-02: Technician Stage Progression Guards in PATCH /api/staff/orders/:id/stage', () => {
    it('returns 404 when order does not exist', async () => {
      const token = await createStaffToken({
        id: 'staff-ceramic',
        role: 'staff',
        username: 'ceramist_bob',
        designation: 'Ceramic',
      });

      const res = await app.request('/api/staff/orders/non-existent/stage', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `dentzy_staff_jwt=${token}`,
        },
        body: JSON.stringify({ stage: 'design' }),
      }, mockEnv);

      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.message, 'Order not found.');
    });

    it('blocks production technician from modifying an already dispatched order', async () => {
      const token = await createStaffToken({
        id: 'staff-ceramic',
        role: 'staff',
        username: 'ceramist_bob',
        designation: 'Ceramic',
      });

      const res = await app.request('/api/staff/orders/order-dispatched/stage', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `dentzy_staff_jwt=${token}`,
        },
        body: JSON.stringify({ stage: 'qc' }),
      }, mockEnv);

      assert.equal(res.status, 403);
      const data = await res.json();
      assert.match(data.message, /Completed or dispatched orders cannot be modified by production staff/);
    });

    it('blocks production technician from modifying an already completed order', async () => {
      const token = await createStaffToken({
        id: 'staff-ceramic',
        role: 'staff',
        username: 'ceramist_bob',
        designation: 'Ceramic',
      });

      const res = await app.request('/api/staff/orders/order-completed/stage', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `dentzy_staff_jwt=${token}`,
        },
        body: JSON.stringify({ stage: 'production' }),
      }, mockEnv);

      assert.equal(res.status, 403);
      const data = await res.json();
      assert.match(data.message, /Completed or dispatched orders cannot be modified by production staff/);
    });

    it('blocks production technician from setting stage beyond QC (e.g. dispatched)', async () => {
      const token = await createStaffToken({
        id: 'staff-ceramic',
        role: 'staff',
        username: 'ceramist_bob',
        designation: 'Ceramic',
      });

      const res = await app.request('/api/staff/orders/order-in-prod/stage', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `dentzy_staff_jwt=${token}`,
        },
        body: JSON.stringify({ stage: 'dispatched' }),
      }, mockEnv);

      assert.equal(res.status, 403);
      const data = await res.json();
      assert.match(data.message, /Production staff can only advance stages up to QC/);
    });

    it('allows production technician to advance stage up to QC', async () => {
      const token = await createStaffToken({
        id: 'staff-ceramic',
        role: 'staff',
        username: 'ceramist_bob',
        designation: 'Ceramic',
      });

      const res = await app.request('/api/staff/orders/order-in-prod/stage', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `dentzy_staff_jwt=${token}`,
        },
        body: JSON.stringify({ stage: 'qc' }),
      }, mockEnv);

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.stage, 'qc');
    });
  });

  describe('3. QA-02: Dentist Order Modification Lock in PATCH /api/dashboard/orders/:id', () => {
    it('allows dentist to update order when stage is received and status is Pending', async () => {
      const userToken = await createUserToken({
        id: 'dentist-1',
        role: 'user',
        email: 'smith@dental.com',
      });

      const res = await app.request('/api/dashboard/orders/order-received', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `dentzy_jwt=${userToken}`,
        },
        body: JSON.stringify({ notes: 'Updated notes from dentist' }),
      }, mockEnv);

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.message, 'Order updated.');
    });

    it('blocks dentist from updating order when order is already in production', async () => {
      const userToken = await createUserToken({
        id: 'dentist-1',
        role: 'user',
        email: 'smith@dental.com',
      });

      const res = await app.request('/api/dashboard/orders/order-in-prod', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `dentzy_jwt=${userToken}`,
        },
        body: JSON.stringify({ notes: 'Attempted mid-production note update' }),
      }, mockEnv);

      assert.equal(res.status, 403);
      const data = await res.json();
      assert.match(data.message, /Order is already in production and cannot be modified directly/);
    });

    it('returns 404 when dentist attempts to update non-existent order', async () => {
      const userToken = await createUserToken({
        id: 'dentist-1',
        role: 'user',
        email: 'smith@dental.com',
      });

      const res = await app.request('/api/dashboard/orders/non-existent-order', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `dentzy_jwt=${userToken}`,
        },
        body: JSON.stringify({ notes: 'Missing order' }),
      }, mockEnv);

      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.message, 'Order not found.');
    });
  });

  describe('4. SEC-01: 8-Character Password Floor', () => {
    it('createStaffSchema rejects passwords shorter than 8 characters', () => {
      const result7 = createStaffSchema.safeParse({
        username: 'new_staff',
        password: 'Pass123', // 7 chars
        displayName: 'New Staff',
      });
      assert.equal(result7.success, false);
      assert.match(result7.error.issues[0].message, /Password must be at least 8 characters/);

      const result8 = createStaffSchema.safeParse({
        username: 'new_staff',
        password: 'Pass1234', // 8 chars
        displayName: 'New Staff',
      });
      assert.equal(result8.success, true);
    });

    it('PUT /api/staff/change-password rejects new passwords shorter than 8 characters', async () => {
      const token = await createStaffToken({
        id: 'staff-ceramic',
        role: 'staff',
        username: 'ceramist_bob',
        designation: 'Ceramic',
      });

      const res = await app.request('/api/staff/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `dentzy_staff_jwt=${token}`,
        },
        body: JSON.stringify({
          currentPassword: 'ValidPass123!',
          newPassword: 'short12', // 7 chars
        }),
      }, mockEnv);

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.message, 'New password must be at least 8 characters.');
    });

    it('PUT /api/staff/change-password accepts valid 8+ character new password', async () => {
      const token = await createStaffToken({
        id: 'staff-ceramic',
        role: 'staff',
        username: 'ceramist_bob',
        designation: 'Ceramic',
      });

      const res = await app.request('/api/staff/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `dentzy_staff_jwt=${token}`,
        },
        body: JSON.stringify({
          currentPassword: 'ValidPass123!',
          newPassword: 'ValidNewPass88!',
        }),
      }, mockEnv);

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.message, 'Password updated successfully.');
    });
  });
});

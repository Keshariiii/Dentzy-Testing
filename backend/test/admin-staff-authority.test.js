import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import app from '../src/index.js';

describe('Admin Staff Authority & Order Auto-Routing', () => {
  const adminSecret = 'test-admin-secret-authority';

  const createAdminToken = async (payload) => {
    return new SignJWT({ role: 'admin', username: 'admin', ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(adminSecret));
  };

  it('DELETE /api/admin/staff/:id allows deleting a receptionist staff account', async () => {
    const adminToken = await createAdminToken({ id: 'admin-exec-1' });

    let batchQueries = [];
    const mockEnv = {
      ADMIN_JWT_SECRET: adminSecret,
      DB: {
        prepare: (query) => ({
          bind: (...args) => ({
            first: async () => {
              if (query.includes('FROM staff WHERE id = ?')) {
                return { id: 'staff-rec-1', username: 'reception1', designation: 'Receptionist' };
              }
              return null;
            },
            run: async () => ({ meta: { changes: 1 } }),
          }),
        }),
        batch: async (statements) => {
          batchQueries = statements;
          return [{ meta: { changes: 1 } }, { meta: { changes: 1 } }, { meta: { changes: 1 } }];
        },
      },
    };

    const res = await app.request('/api/admin/staff/staff-rec-1', {
      method: 'DELETE',
      headers: {
        Cookie: `dentzy_admin_jwt=${adminToken}`,
      },
    }, mockEnv);

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.message, 'Staff account deleted.');
    assert.equal(batchQueries.length, 3);
  });

  it('DELETE /api/admin/staff/:id blocks self-deletion when admin ID equals target ID', async () => {
    const adminToken = await createAdminToken({ id: 'self-admin-id' });

    const mockEnv = {
      ADMIN_JWT_SECRET: adminSecret,
      DB: {
        prepare: () => ({
          bind: () => ({
            first: async () => ({ id: 'self-admin-id', username: 'selfadmin', designation: 'CEO' }),
            run: async () => ({ meta: { changes: 1 } }),
          }),
        }),
        batch: async () => [],
      },
    };

    const res = await app.request('/api/admin/staff/self-admin-id', {
      method: 'DELETE',
      headers: {
        Cookie: `dentzy_admin_jwt=${adminToken}`,
      },
    }, mockEnv);

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.code, 'CANNOT_DELETE_SELF');
    assert.match(body.message, /cannot delete your own active account/i);
  });

  it('POST /api/admin/orders saves assigned_department and auto-assigns active staff in department', async () => {
    const adminToken = await createAdminToken({ id: 'admin-1' });

    let capturedOrderInsert = null;
    let staffQueryDesignation = null;

    const mockEnv = {
      ADMIN_JWT_SECRET: adminSecret,
      DB: {
        prepare: (query) => ({
          bind: (...args) => ({
            first: async () => {
              if (query.includes('FROM users WHERE id = ?')) {
                return { id: 'dentist-1', name: 'Dr. Smile', email: 'smile@example.com', status: 'approved' };
              }
              if (query.includes('FROM payments WHERE ownerId=?')) {
                return { totalDebt: 0 };
              }
              if (query.includes('FROM staff WHERE designation = ?')) {
                staffQueryDesignation = args[0];
                return { id: 'staff-cad-tech-99' };
              }
              if (query.includes('FROM lab_orders WHERE id = ?')) {
                return {
                  id: args[0],
                  caseId: 'DZ-TEST-100',
                  ownerId: 'dentist-1',
                  assigned_department: 'CAD/CAM',
                  assigned_staff_id: 'staff-cad-tech-99',
                  stage: 'received',
                };
              }
              return null;
            },
            run: async () => {
              if (query.includes('INSERT INTO lab_orders')) {
                capturedOrderInsert = { query, args };
              }
              return { meta: { changes: 1 } };
            },
          }),
        }),
      },
    };

    // Case A: service_category = 'Zirconia Crown' -> infers CAD/CAM
    const res = await app.request('/api/admin/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `dentzy_admin_jwt=${adminToken}`,
      },
      body: JSON.stringify({
        dentistId: 'dentist-1',
        patientName: 'Jane Doe',
        serviceType: 'Crown',
        service_category: 'Zirconia Crown',
        priority: 'Normal',
      }),
    }, mockEnv);

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.order.assigned_department, 'CAD/CAM');
    assert.equal(body.order.assigned_staff_id, 'staff-cad-tech-99');
    assert.equal(staffQueryDesignation, 'CAD/CAM');

    assert.ok(capturedOrderInsert, 'Order insert query was executed');
    assert.ok(capturedOrderInsert.query.includes('assigned_department'), 'Query includes assigned_department column');
    assert.ok(capturedOrderInsert.query.includes('assigned_staff_id'), 'Query includes assigned_staff_id column');
    assert.ok(capturedOrderInsert.args.includes('CAD/CAM'), 'CAD/CAM department bound to query');
    assert.ok(capturedOrderInsert.args.includes('staff-cad-tech-99'), 'Staff ID bound to query');
  });

  it('PATCH /api/admin/orders/:id/stage advancing to qc sets qc_completed_at and creates delivery_tasks', async () => {
    const adminToken = await createAdminToken({ id: 'admin-1' });

    let orderUpdate = null;
    let deliveryTaskInsert = null;

    const mockEnv = {
      ADMIN_JWT_SECRET: adminSecret,
      DB: {
        prepare: (query) => ({
          bind: (...args) => ({
            first: async () => {
              if (query.includes('FROM lab_orders o LEFT JOIN users u')) {
                return {
                  id: 'order-123',
                  caseId: 'DZ-TEST-123',
                  ownerId: 'dentist-1',
                  patientName: 'Alice Springs',
                  dueDate: '2026-11-05',
                  clinicName: 'Bright Smiles Clinic',
                  ownerClinicName: 'Bright Smiles Clinic',
                  name: 'Dr. Dentist',
                  ownerName: 'Dr. Dentist',
                  address: '123 Marine Drive',
                  phone: '+919876543210',
                };
              }
              return null;
            },
            run: async () => {
              if (query.includes('UPDATE lab_orders SET')) {
                orderUpdate = { query, args };
                return { meta: { changes: 1 } };
              }
              if (query.includes('INSERT INTO delivery_tasks')) {
                deliveryTaskInsert = { query, args };
                return { meta: { changes: 1 } };
              }
              return { meta: { changes: 1 } };
            },
          }),
        }),
      },
    };

    const res = await app.request('/api/admin/orders/order-123/stage', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `dentzy_admin_jwt=${adminToken}`,
      },
      body: JSON.stringify({ stage: 'qc' }),
    }, mockEnv);

    assert.equal(res.status, 200);
    assert.ok(orderUpdate, 'lab_orders update was executed');
    assert.ok(orderUpdate.query.includes('qc_completed_at'), 'Sets qc_completed_at on lab_orders');
    assert.ok(deliveryTaskInsert, 'delivery_tasks record was created/upserted');
    assert.equal(deliveryTaskInsert.args[1], 'order-123'); // order_id
    assert.equal(deliveryTaskInsert.args[2], 'Bright Smiles Clinic'); // clinic_name
    assert.equal(deliveryTaskInsert.args[3], 'Dr. Dentist'); // dentist_name
    assert.equal(deliveryTaskInsert.args[4], '123 Marine Drive'); // address
    assert.equal(deliveryTaskInsert.args[5], '+919876543210'); // contact_phone
    assert.equal(deliveryTaskInsert.args[6], 'Alice Springs'); // patient_name
    assert.equal(deliveryTaskInsert.args[7], 'DZ-TEST-123'); // case_id
    assert.equal(deliveryTaskInsert.args[8], '2026-11-05'); // due_date
  });

  it('PATCH /api/admin/orders/:id/stage updates dispatched_at and delivered_at timestamps', async () => {
    const adminToken = await createAdminToken({ id: 'admin-1' });

    let lastUpdate = null;

    const mockEnv = {
      ADMIN_JWT_SECRET: adminSecret,
      DB: {
        prepare: (query) => ({
          bind: (...args) => ({
            first: async () => ({
              id: 'order-456',
              caseId: 'DZ-TEST-456',
              ownerId: 'dentist-1',
            }),
            run: async () => {
              if (query.includes('UPDATE lab_orders SET')) {
                lastUpdate = { query, args };
              }
              return { meta: { changes: 1 } };
            },
          }),
        }),
      },
    };

    // Dispatched stage
    const resDispatched = await app.request('/api/admin/orders/order-456/stage', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `dentzy_admin_jwt=${adminToken}`,
      },
      body: JSON.stringify({ stage: 'dispatched' }),
    }, mockEnv);

    assert.equal(resDispatched.status, 200);
    assert.ok(lastUpdate.query.includes('dispatched_at'), 'Sets dispatched_at on lab_orders');

    // Completed stage
    const resCompleted = await app.request('/api/admin/orders/order-456/stage', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `dentzy_admin_jwt=${adminToken}`,
      },
      body: JSON.stringify({ stage: 'completed' }),
    }, mockEnv);

    assert.equal(resCompleted.status, 200);
    assert.ok(lastUpdate.query.includes('delivered_at'), 'Sets delivered_at on lab_orders');
  });
});

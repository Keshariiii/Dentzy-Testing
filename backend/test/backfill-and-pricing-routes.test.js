import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import app from '../src/index.js';

describe('Recalculate All Orders and Auto-Calculation Routes', () => {
  it('POST /api/admin/orders/recalculate-all scans orders and updates 0-amounts', async () => {
    const adminSecret = 'test-admin-secret';
    const secretKey = new TextEncoder().encode(adminSecret);
    const token = await new SignJWT({ id: 'admin-1', role: 'admin', username: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secretKey);

    const mockOrders = [
      { id: 'ord-1', ownerId: 'd-1', patientName: 'P1', caseId: 'DZ-001', serviceType: 'Crown', teeth_data: '["11","12"]', dueDate: null, paymentId: null, paymentAmount: null },
      { id: 'ord-2', ownerId: 'd-2', patientName: 'P2', caseId: 'DZ-002', serviceType: 'Denture', teeth_data: null, dueDate: null, paymentId: 'pay-2', paymentAmount: 0 },
      { id: 'ord-3', ownerId: 'd-3', patientName: 'P3', caseId: 'DZ-003', serviceType: 'Crown', teeth_data: '["21"]', dueDate: null, paymentId: 'pay-3', paymentAmount: 750 },
    ];

    const mockEnv = {
      DB: {
        prepare: () => ({
          bind: () => ({
            first: async () => ({ id: 'admin-1', username: 'admin' }),
            all: async () => ({ results: mockOrders }),
            run: async () => ({ meta: { changes: 1 } }),
          }),
        }),
      },
      ADMIN_JWT_SECRET: adminSecret,
    };

    const res = await app.fetch(
      new Request('http://localhost/api/admin/orders/recalculate-all', {
        method: 'POST',
        headers: { Cookie: `dentzy_admin_jwt=${token}` },
      }),
      mockEnv
    );

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.totalScanned, 3);
    assert.equal(data.insertedPayments, 1);
    assert.equal(data.updatedPayments, 1);
  });

  it('POST /api/admin/orders auto-calculates amount when amount is 0 and stores teeth_data', async () => {
    const adminSecret = 'test-admin-secret';
    const secretKey = new TextEncoder().encode(adminSecret);
    const token = await new SignJWT({ id: 'admin-1', role: 'admin', username: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secretKey);

    let insertedPaymentAmount = 0;
    const mockEnv = {
      DB: {
        prepare: (sql) => ({
          bind: (...args) => ({
            first: async () => ({ id: 'dentist-1', name: 'Dr. Dent', email: 'dent@test.com', status: 'approved' }),
            run: async () => {
              if (sql.includes('INSERT INTO payments')) {
                insertedPaymentAmount = args[5]; // amount argument
              }
              return { meta: { changes: 1 } };
            },
          }),
        }),
      },
      ADMIN_JWT_SECRET: adminSecret,
    };

    const res = await app.fetch(
      new Request('http://localhost/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: `dentzy_admin_jwt=${token}` },
        body: JSON.stringify({
          dentistId: 'dentist-1',
          patientName: 'Jane Doe',
          serviceType: 'Crown',
          teeth_data: ['11', '12'],
          amount: 0,
        }),
      }),
      mockEnv
    );

    assert.equal(res.status, 201);
    assert.equal(insertedPaymentAmount, 1500); // 750 * 2 teeth
  });

  it('PATCH /api/staff/payments/:id/amount updates payment amount for staff member', async () => {
    const staffSecret = 'test-staff-secret';
    const secretKey = new TextEncoder().encode(staffSecret);
    const token = await new SignJWT({ id: 'staff-1', role: 'staff', username: 'receptionist', staffRole: 'receptionist' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secretKey);

    let updatedAmount = 0;
    const mockEnv = {
      DB: {
        prepare: (sql) => ({
          bind: (...args) => ({
            first: async () => ({ id: 'staff-1', status: 'active', role: 'receptionist' }),
            run: async () => {
              if (sql.includes('UPDATE payments SET amount =')) {
                updatedAmount = args[0];
                return { meta: { changes: 1 } };
              }
              return { meta: { changes: 0 } };
            },
          }),
        }),
      },
      STAFF_JWT_SECRET: staffSecret,
    };

    const res = await app.fetch(
      new Request('http://localhost/api/staff/payments/pay-123/amount', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: `dentzy_staff_jwt=${token}` },
        body: JSON.stringify({ amount: 4200 }),
      }),
      mockEnv
    );

    assert.equal(res.status, 200);
    assert.equal(updatedAmount, 4200);
  });

  it('GET /api/dashboard/orders computes fallback on the fly when DB amount is 0', async () => {
    const userSecret = 'test-jwt-secret';
    const secretKey = new TextEncoder().encode(userSecret);
    const token = await new SignJWT({ id: 'dentist-1', role: 'user', name: 'Dr. John' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secretKey);

    const mockOrder = {
      id: 'ord-zero',
      ownerId: 'dentist-1',
      patientName: 'Zero Patient',
      caseId: 'DZ-ZERO',
      serviceType: 'Crown',
      teeth_data: '["11"]',
      status: 'In Progress',
      priority: 'Normal',
      paymentAmount: 0,
      paymentStatus: 'Pending',
    };

    const mockEnv = {
      DB: {
        prepare: () => ({
          bind: () => ({
            first: async () => ({ id: 'dentist-1', status: 'approved' }),
            all: async () => ({ results: [mockOrder] }),
            run: async () => ({ meta: { changes: 1 } }),
          }),
        }),
      },
      JWT_SECRET: userSecret,
    };

    const res = await app.fetch(
      new Request('http://localhost/api/dashboard/orders', {
        headers: { Cookie: `dentzy_jwt=${token}` },
      }),
      mockEnv
    );

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.orders[0].amount, 750);
    assert.equal(body.orders[0].paymentAmount, 750);
  });
});

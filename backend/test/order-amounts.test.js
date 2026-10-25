import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import app from '../src/index.js';

describe('Order Amounts and Batch ID Visibility', () => {
  it('GET /api/dashboard/orders returns amount, paymentStatus, and batchId', async () => {
    const userSecret = 'test-jwt-secret';
    const secretKey = new TextEncoder().encode(userSecret);
    const token = await new SignJWT({ id: 'dentist-1', role: 'user', name: 'Dr. Smith' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secretKey);

    const mockOrder = {
      id: 'ord-101',
      ownerId: 'dentist-1',
      patientName: 'John Doe',
      caseId: 'DZ-101',
      serviceType: 'Crown',
      status: 'In Progress',
      priority: 'Standard',
      amount: 4500,
      paymentAmount: 4500,
      paymentStatus: 'Paid',
      paymentMode: 'UPI',
      referenceNumber: 'UPI-12345',
      batchId: 'BATCH-OCT26-01',
      invoiceNumber: 'INV-101',
      paidAt: '2026-10-25T10:00:00Z',
    };

    const mockEnv = {
      DB: {
        prepare: () => ({
          bind: () => ({
            first: async () => ({ id: 'dentist-1', status: 'approved' }),
            all: async () => ({ results: [mockOrder] }),
          }),
        }),
      },
      JWT_SECRET: userSecret,
    };

    const res = await app.fetch(
      new Request('http://localhost/api/dashboard/orders', {
        headers: {
          Cookie: `dentzy_jwt=${token}`,
        },
      }),
      mockEnv
    );

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.orders.length, 1);
    const o = body.orders[0];
    assert.equal(o.amount, 4500);
    assert.equal(o.paymentAmount, 4500);
    assert.equal(o.paymentStatus, 'Paid');
    assert.equal(o.paymentMode, 'UPI');
    assert.equal(o.batchId, 'BATCH-OCT26-01');
    assert.equal(o._id, 'ord-101');
  });

  it('GET /api/staff/orders returns order amount, paymentStatus, and batchId', async () => {
    const staffSecret = 'test-staff-secret';
    const secretKey = new TextEncoder().encode(staffSecret);
    const token = await new SignJWT({ id: 'staff-1', role: 'staff', username: 'receptionist', staffRole: 'receptionist' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secretKey);

    const mockOrder = {
      id: 'ord-102',
      ownerId: 'dentist-1',
      patientName: 'Jane Smith',
      caseId: 'DZ-102',
      ownerName: 'Dr. Smith',
      ownerClinicName: 'Smile Clinic',
      amount: 3200,
      paymentAmount: 3200,
      paymentStatus: 'Pending',
      paymentMode: '',
      referenceNumber: '',
      batchId: '',
      paidAt: null,
    };

    const mockEnv = {
      DB: {
        prepare: () => ({
          bind: () => ({
            first: async () => ({ id: 'staff-1', status: 'active', role: 'receptionist' }),
            all: async () => ({ results: [mockOrder] }),
          }),
        }),
      },
      STAFF_JWT_SECRET: staffSecret,
    };

    const res = await app.fetch(
      new Request('http://localhost/api/staff/orders', {
        headers: {
          Cookie: `dentzy_staff_jwt=${token}`,
        },
      }),
      mockEnv
    );

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.orders.length, 1);
    const o = body.orders[0];
    assert.equal(o.amount, 3200);
    assert.equal(o.paymentStatus, 'Pending');
    assert.equal(o.owner.name, 'Dr. Smith');
  });
});

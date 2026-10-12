import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import app from '../src/index.js';

describe('Batch Payments Settlement', () => {
  it('POST /api/admin/payments/batch updates multiple payments at once with single payment details', async () => {
    const adminSecret = 'test-admin-secret';
    const secretKey = new TextEncoder().encode(adminSecret);
    const adminToken = await new SignJWT({ role: 'admin', username: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secretKey);

    const updatedPaymentIds = [];
    const mockPayments = [
      { id: 'p1', caseId: 'DZ-101', ownerId: 'd1', amount: 1500, status: 'Pending' },
      { id: 'p2', caseId: 'DZ-102', ownerId: 'd1', amount: 2500, status: 'Pending' },
    ];

    const mockEnv = {
      DB: {
        prepare: (query) => {
          return {
            bind: (...args) => {
              if (query.includes('SELECT * FROM payments WHERE id = ?')) {
                const target = mockPayments.find(p => p.id === args[0]);
                return {
                  first: async () => target || null,
                  all: async () => ({ results: target ? [target] : [] }),
                  run: async () => ({ meta: { changes: 1 } }),
                };
              }
              if (query.includes('UPDATE payments SET')) {
                // last arg is payment.id
                const pId = args[args.length - 1];
                updatedPaymentIds.push(pId);
                return {
                  first: async () => null,
                  all: async () => ({ results: [] }),
                  run: async () => ({ meta: { changes: 1 } }),
                };
              }
              return {
                first: async () => null,
                all: async () => ({ results: [] }),
                run: async () => ({ meta: { changes: 1 } }),
              };
            },
            first: async () => null,
            all: async () => ({ results: [] }),
            run: async () => ({ meta: { changes: 1 } }),
          };
        },
        batch: async (stmts) => stmts.map(() => ({ results: [], meta: { changes: 0 } })),
      },
      ADMIN_JWT_SECRET: adminSecret,
    };

    const res = await app.fetch(
      new Request('http://localhost/api/admin/payments/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          paymentIds: ['p1', 'p2'],
          status: 'Paid',
          paymentMode: 'UPI',
          referenceNumber: 'UTR-9876543210',
          notes: 'October monthly settlement',
        }),
      }),
      mockEnv
    );

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.updatedCount, 2);
    assert.equal(data.paymentMode, 'UPI');
    assert.equal(data.referenceNumber, 'UTR-9876543210');
    assert.equal(updatedPaymentIds.length, 2);
    assert.deepEqual(updatedPaymentIds, ['p1', 'p2']);
  });

  it('POST /api/staff/payments/batch rejects empty orderIds/paymentIds list', async () => {
    const staffSecret = 'test-staff-secret';
    const secretKey = new TextEncoder().encode(staffSecret);
    const staffToken = await new SignJWT({
      role: 'staff',
      id: 'staff-1',
      username: 'reception1',
      designation: 'Receptionist',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secretKey);

    const mockEnv = {
      DB: {
        prepare: (query) => ({
          bind: () => ({
            first: async () => {
              if (query.includes('FROM staff WHERE id = ?')) {
                return { id: 'staff-1', username: 'reception1', displayName: 'Receptionist', status: 'active' };
              }
              return null;
            },
            all: async () => ({ results: [] }),
            run: async () => ({ meta: { changes: 1 } }),
          }),
        }),
      },
      STAFF_JWT_SECRET: staffSecret,
    };

    const res = await app.fetch(
      new Request('http://localhost/api/staff/payments/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({
          paymentIds: [],
          status: 'Paid',
        }),
      }),
      mockEnv
    );

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.message, /At least one order or payment ID is required/i);
  });
});

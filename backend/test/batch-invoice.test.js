import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import app from '../src/index.js';

describe('Batch Payments Invoicing API', () => {
  it('POST /api/admin/payments/batch assigns and persists batchId on payments', async () => {
    const adminSecret = 'test-admin-secret';
    const secretKey = new TextEncoder().encode(adminSecret);
    const adminToken = await new SignJWT({ role: 'admin', username: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secretKey);

    let updatedBinds = [];
    const mockPayments = [
      { id: 'p1', caseId: 'DZ-101', ownerId: 'd1', amount: 1200, status: 'Pending' },
      { id: 'p2', caseId: 'DZ-102', ownerId: 'd1', amount: 1800, status: 'Pending' },
    ];

    const mockEnv = {
      DB: {
        prepare: (query) => ({
          bind: (...args) => {
            if (query.includes('SELECT * FROM payments WHERE id = ?')) {
              const target = mockPayments.find(p => p.id === args[0]);
              return {
                first: async () => target || null,
                all: async () => ({ results: target ? [target] : [] }),
                run: async () => ({ meta: { changes: 1 } }),
              };
            }
            if (query.includes('UPDATE payments SET') && query.includes('batchId = ?')) {
              updatedBinds.push(args);
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
        }),
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
          referenceNumber: 'UPI987654321',
          notes: 'Settled October dues',
        }),
      }),
      mockEnv
    );

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.batchId);
    assert.equal(body.updatedCount, 2);
    // Verify batchId was passed to SQL UPDATE
    assert.equal(updatedBinds.length, 2, 'Expected 2 UPDATE queries containing batchId = ?');
  });

  it('GET /api/payments/batch/:batchId returns consolidated statement for admin', async () => {
    const adminSecret = 'test-admin-secret';
    const secretKey = new TextEncoder().encode(adminSecret);
    const adminToken = await new SignJWT({ role: 'admin', username: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secretKey);

    const batchId = 'BATCH-OCT-2026-01';
    const mockBatchPayments = [
      {
        id: 'p1',
        caseId: 'DZ-101',
        ownerId: 'dentist-1',
        patientName: 'John Doe',
        amount: 1500,
        status: 'Paid',
        paymentMode: 'NEFT',
        referenceNumber: 'NEFT9988',
        paidAt: '2026-10-12T10:00:00.000Z',
        description: 'Batch settlement',
        batchId,
        serviceType: 'Zirconia Crown',
        teeth: '14, 15',
        dueDate: '2026-10-20',
        dentistName: 'Dr. Jane Dentist',
        clinicName: 'Smile Dental Clinic',
        dentistPhone: '+919876543210',
        dentistAddress: 'Bandra West, Mumbai',
      },
      {
        id: 'p2',
        caseId: 'DZ-102',
        ownerId: 'dentist-1',
        patientName: 'Jane Smith',
        amount: 2500,
        status: 'Paid',
        paymentMode: 'NEFT',
        referenceNumber: 'NEFT9988',
        paidAt: '2026-10-12T10:00:00.000Z',
        description: 'Batch settlement',
        batchId,
        serviceType: 'Emax Inlay',
        teeth: '26',
        dueDate: '2026-10-22',
        dentistName: 'Dr. Jane Dentist',
        clinicName: 'Smile Dental Clinic',
        dentistPhone: '+919876543210',
        dentistAddress: 'Bandra West, Mumbai',
      },
    ];

    const mockEnv = {
      DB: {
        prepare: (query) => ({
          bind: (...args) => {
            if (query.includes('FROM payments p') && query.includes('p.batchId = ?')) {
              return {
                all: async () => ({ results: args[0] === batchId ? mockBatchPayments : [] }),
              };
            }
            return {
              all: async () => ({ results: [] }),
            };
          },
        }),
      },
      ADMIN_JWT_SECRET: adminSecret,
    };

    const res = await app.fetch(
      new Request(`http://localhost/api/payments/batch/${batchId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }),
      mockEnv
    );

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.batchId, batchId);
    assert.equal(body.items.length, 2);
    assert.equal(body.totalAmount, 4000);
    assert.equal(body.dentist.name, 'Dr. Jane Dentist');
    assert.equal(body.items[0].caseId, 'DZ-101');
    assert.equal(body.items[1].caseId, 'DZ-102');
  });

  it('GET /api/payments/batch/:batchId allows owning dentist and forbids other dentists', async () => {
    const userSecret = 'test-user-secret';
    const secretKey = new TextEncoder().encode(userSecret);
    const ownerToken = await new SignJWT({ id: 'dentist-1', role: 'user' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secretKey);

    const otherToken = await new SignJWT({ id: 'dentist-2', role: 'user' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secretKey);

    const batchId = 'BATCH-OCT-2026-02';
    const mockBatchPayments = [
      {
        id: 'p1',
        caseId: 'DZ-201',
        ownerId: 'dentist-1',
        patientName: 'Alex Mercer',
        amount: 2200,
        status: 'Paid',
        paymentMode: 'Cash',
        referenceNumber: 'REC-01',
        paidAt: '2026-10-12T10:00:00.000Z',
        description: '',
        batchId,
        serviceType: 'Crown',
        teeth: '11',
        dueDate: '2026-10-15',
        dentistName: 'Dr. Jane Dentist',
      },
    ];

    const mockEnv = {
      DB: {
        prepare: () => ({
          bind: () => ({
            all: async () => ({ results: mockBatchPayments }),
          }),
        }),
      },
      JWT_SECRET: userSecret,
    };

    // 1. Owning dentist should get 200 OK
    const ownerRes = await app.fetch(
      new Request(`http://localhost/api/payments/batch/${batchId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${ownerToken}` },
      }),
      mockEnv
    );
    assert.equal(ownerRes.status, 200);
    const ownerBody = await ownerRes.json();
    assert.equal(ownerBody.items.length, 1);
    assert.equal(ownerBody.items[0].caseId, 'DZ-201');

    // 2. Different dentist should get 403 Forbidden
    const otherRes = await app.fetch(
      new Request(`http://localhost/api/payments/batch/${batchId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${otherToken}` },
      }),
      mockEnv
    );
    assert.equal(otherRes.status, 403);
  });

  it('GET /api/payments/batch/:batchId allows staff members', async () => {
    const staffSecret = 'test-staff-secret';
    const secretKey = new TextEncoder().encode(staffSecret);
    const staffToken = await new SignJWT({ id: 'staff-1', role: 'staff', username: 'reception1' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secretKey);

    const batchId = 'BATCH-OCT-2026-03';
    const mockBatchPayments = [
      {
        id: 'p3',
        caseId: 'DZ-301',
        ownerId: 'dentist-5',
        patientName: 'Sarah Connor',
        amount: 5000,
        status: 'Paid',
        paymentMode: 'Card',
        referenceNumber: 'TXN-999',
        paidAt: '2026-10-12T10:00:00.000Z',
        batchId,
      },
    ];

    const mockEnv = {
      DB: {
        prepare: () => ({
          bind: () => ({
            all: async () => ({ results: mockBatchPayments }),
          }),
        }),
      },
      STAFF_JWT_SECRET: staffSecret,
    };

    const res = await app.fetch(
      new Request(`http://localhost/api/payments/batch/${batchId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${staffToken}` },
      }),
      mockEnv
    );
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.totalAmount, 5000);
  });
});

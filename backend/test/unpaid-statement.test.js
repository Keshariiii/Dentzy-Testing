import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import app from '../src/index.js';

describe('Unpaid Statement / Outstanding Bill API', () => {
  it('allows authenticated dentist to fetch their own unpaid statement', async () => {
    const userSecret = 'test-jwt-secret';
    const secretKey = new TextEncoder().encode(userSecret);
    const token = await new SignJWT({ id: 'dentist-1', role: 'user', name: 'Dr. Dentist' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secretKey);

    const mockResults = [
      {
        orderId: 'ord-1',
        caseId: 'DZ-202610-01',
        patientName: 'Alice',
        serviceType: 'Zirconia Crown',
        teethData: '["14", "15"]',
        dueDate: '2026-10-30',
        createdAt: '2026-10-05T10:00:00Z',
        paymentId: 'pay-1',
        amount: 5000,
        status: 'Pending',
        dentistName: 'Dr. Dentist',
        clinicName: 'Dentist Clinic',
        dentistPhone: '9876543210',
        dentistAddress: 'Vasai',
      },
      {
        orderId: 'ord-2',
        caseId: 'DZ-202610-02',
        patientName: 'Bob',
        serviceType: 'Bridge',
        teethData: '["21"]',
        dueDate: '2026-10-31',
        createdAt: '2026-10-15T10:00:00Z',
        paymentId: 'pay-2',
        amount: 3000,
        status: 'Pending',
        dentistName: 'Dr. Dentist',
        clinicName: 'Dentist Clinic',
        dentistPhone: '9876543210',
        dentistAddress: 'Vasai',
      },
    ];

    const mockEnv = {
      DB: {
        prepare: () => ({
          bind: () => ({
            all: async () => ({ results: mockResults }),
            first: async () => mockResults[0],
          }),
        }),
      },
      JWT_SECRET: userSecret,
    };

    const res = await app.fetch(
      new Request('http://localhost/api/payments/unpaid-statement', {
        headers: {
          Cookie: `dentzy_jwt=${token}`,
        },
      }),
      mockEnv
    );

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.statementType, 'UNPAID_BILL');
    assert.equal(body.status, 'Pending');
    assert.equal(body.items.length, 2);
    assert.equal(body.totalAmount, 8000);
    assert.equal(body.items[0].teeth, '14, 15 (2 units)');
    assert.equal(body.dentist.name, 'Dr. Dentist');
  });

  it('blocks dentist from viewing another dentist statement (403)', async () => {
    const userSecret = 'test-jwt-secret';
    const secretKey = new TextEncoder().encode(userSecret);
    const token = await new SignJWT({ id: 'dentist-2', role: 'user', name: 'Dr. Other' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secretKey);

    const mockEnv = {
      DB: {
        prepare: () => ({
          bind: () => ({
            all: async () => ({ results: [] }),
            first: async () => null,
          }),
        }),
      },
      JWT_SECRET: userSecret,
    };

    const res = await app.fetch(
      new Request('http://localhost/api/payments/unpaid-statement?dentistId=dentist-1', {
        headers: {
          Cookie: `dentzy_jwt=${token}`,
        },
      }),
      mockEnv
    );

    assert.equal(res.status, 403);
  });

  it('admin requires dentistId and returns statement', async () => {
    const adminSecret = 'test-admin-secret';
    const secretKey = new TextEncoder().encode(adminSecret);
    const adminToken = await new SignJWT({ role: 'admin', username: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secretKey);

    const mockEnv = {
      DB: {
        prepare: () => ({
          bind: () => ({
            all: async () => ({ results: [] }),
            first: async () => ({ name: 'Dr. Target', clinicName: 'Target Clinic' }),
          }),
        }),
      },
      ADMIN_JWT_SECRET: adminSecret,
    };

    // Missing dentistId -> 400
    const badRes = await app.fetch(
      new Request('http://localhost/api/payments/unpaid-statement', {
        headers: { Cookie: `dentzy_admin_jwt=${adminToken}` },
      }),
      mockEnv
    );
    assert.equal(badRes.status, 400);

    // With dentistId -> 200
    const okRes = await app.fetch(
      new Request('http://localhost/api/payments/unpaid-statement?dentistId=dentist-1', {
        headers: { Cookie: `dentzy_admin_jwt=${adminToken}` },
      }),
      mockEnv
    );
    assert.equal(okRes.status, 200);
    const body = await okRes.json();
    assert.equal(body.statementType, 'UNPAID_BILL');
  });
});

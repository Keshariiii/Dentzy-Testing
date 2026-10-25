import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import app from '../src/index.js';

describe('Single Payment Invoicing API', () => {
  const jwtSecret = 'test-jwt-secret';
  const adminSecret = 'test-admin-secret';

  async function makeToken(payload, secret) {
    const key = new TextEncoder().encode(secret);
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(key);
  }

  it('GET /api/payments/single/:id returns 401 without token', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/payments/single/pay-1'),
      { JWT_SECRET: jwtSecret, ADMIN_JWT_SECRET: adminSecret }
    );
    assert.strictEqual(res.status, 401);
  });

  it('GET /api/payments/single/:id returns 404 when payment does not exist', async () => {
    const token = await makeToken({ role: 'admin', username: 'admin' }, adminSecret);
    const mockEnv = {
      DB: {
        prepare: () => ({
          bind: () => ({
            first: async () => null,
          }),
        }),
      },
      ADMIN_JWT_SECRET: adminSecret,
    };

    const res = await app.fetch(
      new Request('http://localhost/api/payments/single/nonexistent', {
        headers: { Authorization: `Bearer ${token}` },
      }),
      mockEnv
    );
    assert.strictEqual(res.status, 404);
  });

  it('GET /api/payments/single/:id blocks other dentists (403 IDOR guard)', async () => {
    const dentistToken = await makeToken({ id: 'dentist-2' }, jwtSecret);
    const mockRecord = {
      id: 'pay-1',
      caseId: 'DZ-20261025-ABCD',
      ownerId: 'dentist-1', // belongs to dentist-1!
      patientName: 'John Doe',
      amount: 1500,
      status: 'Paid',
    };

    const mockEnv = {
      DB: {
        prepare: () => ({
          bind: () => ({
            first: async () => mockRecord,
          }),
        }),
      },
      JWT_SECRET: jwtSecret,
    };

    const res = await app.fetch(
      new Request('http://localhost/api/payments/single/pay-1', {
        headers: { Authorization: `Bearer ${dentistToken}` },
      }),
      mockEnv
    );
    assert.strictEqual(res.status, 403);
  });

  it('GET /api/payments/single/:id allows owning dentist with normalized data', async () => {
    const dentistToken = await makeToken({ id: 'dentist-1' }, jwtSecret);
    const mockRecord = {
      id: 'pay-1',
      caseId: 'DZ-20261025-ABCD',
      ownerId: 'dentist-1',
      patientName: 'Jane Doe',
      serviceType: 'Crown',
      teethData: '["16", "17"]',
      amount: 3200,
      status: 'Paid',
      paymentMode: 'UPI',
      referenceNumber: 'UPI123456789',
      paidAt: '2026-10-25T08:00:00Z',
      dentistName: 'Dr. Jane Smith',
      clinicName: 'Smith Dental',
      dentistPhone: '+91 9503668112',
      dentistAddress: 'Vasai West',
    };

    const mockEnv = {
      DB: {
        prepare: () => ({
          bind: () => ({
            first: async () => mockRecord,
          }),
        }),
      },
      JWT_SECRET: jwtSecret,
    };

    const res = await app.fetch(
      new Request('http://localhost/api/payments/single/pay-1', {
        headers: { Authorization: `Bearer ${dentistToken}` },
      }),
      mockEnv
    );
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.caseId, 'DZ-20261025-ABCD');
    assert.strictEqual(data.teeth, '16, 17 (2 units)');
    assert.strictEqual(data.amount, 3200);
    assert.strictEqual(data.dentist.name, 'Dr. Jane Smith');
  });
});

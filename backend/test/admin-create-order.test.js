import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import app from '../src/index.js';

describe('Admin Create Order API', () => {
  const setup = async (debt = 0) => {
    const adminSecret = 'test-admin-secret';
    const secretKey = new TextEncoder().encode(adminSecret);
    const adminToken = await new SignJWT({ role: 'admin', username: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secretKey);

    const mockEnv = {
      DB: {
        prepare: (query) => {
          return {
            bind: (...args) => {
              return {
                first: async () => {
                  if (query.includes('SELECT id, name, email, status FROM users')) {
                    return { id: 'dentist-1', name: 'Dr. Test', email: 'doc@test.com', status: 'approved' };
                  }
                  if (query.includes('SELECT COALESCE(SUM(amount),0) as totalDebt')) {
                    return { totalDebt: debt };
                  }
                  if (query.includes('SELECT * FROM lab_orders WHERE id = ?')) {
                    return { id: args[0], patientName: 'John Doe', caseId: 'DZ-TEST' };
                  }
                  return null;
                },
                all: async () => ({ results: [] }),
                run: async () => ({ meta: { changes: 1 } }),
              };
            },
          };
        },
        batch: async () => [],
      },
      ADMIN_JWT_SECRET: adminSecret,
    };

    return { adminToken, mockEnv };
  };

  it('creates order successfully for dentist with no debt', async () => {
    const { adminToken, mockEnv } = await setup(0);
    const res = await app.request('/api/admin/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `dentzy_admin_jwt=${adminToken}`,
      },
      body: JSON.stringify({
        dentistId: 'dentist-1',
        patientName: 'Jane Doe',
        serviceType: 'Crown',
        priority: 'Normal',
        dueDate: '2026-10-30',
        amount: 2000,
        notes: 'Bridge prep',
      }),
    }, mockEnv);

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.message, 'Order created.');
    assert.equal(body.order.patientName, 'John Doe');
  });

  it('blocks order creation when debt exceeds limit and creditOverride is false', async () => {
    const { adminToken, mockEnv } = await setup(250000);
    const res = await app.request('/api/admin/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `dentzy_admin_jwt=${adminToken}`,
      },
      body: JSON.stringify({
        dentistId: 'dentist-1',
        patientName: 'Jane Doe',
        serviceType: 'Crown',
        priority: 'Normal',
        dueDate: '2026-10-30',
        amount: 2000,
      }),
    }, mockEnv);

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.code, 'CREDIT_LIMIT_EXCEEDED');
    assert.equal(body.totalUnpaid, 250000);
  });

  it('allows order creation when debt exceeds limit if creditOverride is true', async () => {
    const { adminToken, mockEnv } = await setup(250000);
    const res = await app.request('/api/admin/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `dentzy_admin_jwt=${adminToken}`,
      },
      body: JSON.stringify({
        dentistId: 'dentist-1',
        patientName: 'Jane Doe',
        serviceType: 'Crown',
        priority: 'Normal',
        dueDate: '2026-10-30',
        amount: 2000,
        creditOverride: true,
      }),
    }, mockEnv);

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.message, 'Order created.');
  });
});

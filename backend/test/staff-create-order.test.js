import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import app from '../src/index.js';

describe('Staff Create Order API', () => {
  const setup = async (debt = 0) => {
    const staffSecret = 'test-staff-secret';
    const secretKey = new TextEncoder().encode(staffSecret);
    const staffToken = await new SignJWT({ id: 'staff-1', role: 'staff', username: 'receptionist_1', designation: 'Receptionist' })
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
                  if (query.includes('FROM staff WHERE id = ?')) {
                    return { id: 'staff-1', username: 'receptionist_1', displayName: 'Test Staff', status: 'active' };
                  }
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
      STAFF_JWT_SECRET: staffSecret,
    };

    return { staffToken, mockEnv };
  };

  it('creates order successfully for staff', async () => {
    const { staffToken, mockEnv } = await setup(0);
    const res = await app.request('/api/staff/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `dentzy_staff_jwt=${staffToken}`,
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

    assert.ok(res.status === 200 || res.status === 201);
    const body = await res.json();
    assert.equal(body.message, 'Order created successfully.');
  });

  it('blocks order creation when debt exceeds limit', async () => {
    const { staffToken, mockEnv } = await setup(250000);
    const res = await app.request('/api/staff/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `dentzy_staff_jwt=${staffToken}`,
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
  });
});

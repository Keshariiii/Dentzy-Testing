import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import app from '../src/index.js';

describe('Staff Employee ID Generation', () => {
  it('formats employeeId as unpadded integer starting from 1 to positive infinity', () => {
    const calcEmployeeId = (maxId) => String(((maxId) || 0) + 1);

    // Initial employee
    assert.equal(calcEmployeeId(null), '1');
    assert.equal(calcEmployeeId(0), '1');

    // Sequential increments
    assert.equal(calcEmployeeId(1), '2');
    assert.equal(calcEmployeeId(2), '3');
    assert.equal(calcEmployeeId(9), '10');
    assert.equal(calcEmployeeId(99), '100');
    assert.equal(calcEmployeeId(1000), '1001');
  });

  it('POST /api/admin/staff generates unpadded employeeId "1" for first staff member', async () => {
    const adminSecret = 'test-admin-secret';
    const secretKey = new TextEncoder().encode(adminSecret);
    const adminToken = await new SignJWT({ role: 'admin', username: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secretKey);

    let insertedEmployeeId = null;

    const mockEnv = {
      DB: {
        prepare: (query) => {
          return {
            bind: (...args) => {
              if (query.includes('INSERT INTO staff')) {
                // In INSERT query: id, username, hashed, displayName, email, designation, employeeId...
                insertedEmployeeId = args[6];
              }
              return {
                first: async () => null,
                all: async () => ({ results: [] }),
                run: async () => ({ meta: { changes: 1 } }),
              };
            },
            first: async () => {
              if (query.includes('MAX(CAST(employeeId AS INTEGER))')) {
                // First staff: no existing employeeId
                return { maxId: null };
              }
              return null;
            },
            all: async () => ({ results: [] }),
            run: async () => ({ meta: { changes: 1 } }),
          };
        },
        batch: async (stmts) => stmts.map(() => ({ results: [{ cnt: 0 }], meta: { changes: 0 } })),
      },
      ADMIN_JWT_SECRET: adminSecret,
      ADMIN_USERNAME: 'admin',
      ADMIN_PASSWORD: 'admin123',
      JWT_SECRET: 'test-jwt',
      ALLOWED_ORIGINS: 'http://localhost:3000',
    };

    const res = await app.request('/api/admin/staff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `dentzy_admin_jwt=${adminToken}`,
      },
      body: JSON.stringify({
        username: 'staff_tester',
        password: 'Password@123',
        displayName: 'Test Staff',
        designation: 'Lab Assistant',
        email: 'tester@dentzy.com',
      }),
    }, mockEnv);

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.staff.employeeId, '1');
    assert.equal(insertedEmployeeId, '1');
  });

  it('POST /api/admin/staff generates sequential unpadded employeeId "3" when max existing is 2', async () => {
    const adminSecret = 'test-admin-secret';
    const secretKey = new TextEncoder().encode(adminSecret);
    const adminToken = await new SignJWT({ role: 'admin', username: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secretKey);

    let insertedEmployeeId = null;

    const mockEnv = {
      DB: {
        prepare: (query) => {
          return {
            bind: (...args) => {
              if (query.includes('INSERT INTO staff')) {
                insertedEmployeeId = args[6];
              }
              return {
                first: async () => null,
                all: async () => ({ results: [] }),
                run: async () => ({ meta: { changes: 1 } }),
              };
            },
            first: async () => {
              if (query.includes('MAX(CAST(employeeId AS INTEGER))')) {
                return { maxId: 2 };
              }
              return null;
            },
            all: async () => ({ results: [] }),
            run: async () => ({ meta: { changes: 1 } }),
          };
        },
        batch: async (stmts) => stmts.map(() => ({ results: [{ cnt: 0 }], meta: { changes: 0 } })),
      },
      ADMIN_JWT_SECRET: adminSecret,
      ADMIN_USERNAME: 'admin',
      ADMIN_PASSWORD: 'admin123',
      JWT_SECRET: 'test-jwt',
      ALLOWED_ORIGINS: 'http://localhost:3000',
    };

    const res = await app.request('/api/admin/staff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `dentzy_admin_jwt=${adminToken}`,
      },
      body: JSON.stringify({
        username: 'staff_tester_2',
        password: 'Password@123',
        displayName: 'Test Staff 2',
        designation: 'Dentist',
        email: 'tester2@dentzy.com',
      }),
    }, mockEnv);

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.staff.employeeId, '3');
    assert.equal(insertedEmployeeId, '3');
  });
});

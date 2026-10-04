import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import app from '../src/index.js';

describe('Dentist and Staff Deletion Endpoints', () => {
  const adminSecret = 'test-admin-secret';
  const userSecret = 'test-user-secret';

  async function getAdminToken() {
    return new SignJWT({ role: 'admin', username: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(adminSecret));
  }

  it('DELETE /api/admin/users/:id deletes user, orders, and payments', async () => {
    const adminToken = await getAdminToken();
    let batchQueries = [];

    const mockEnv = {
      DB: {
        prepare: (query) => {
          return {
            bind: (...args) => {
              return {
                first: async () => {
                  if (query.includes('FROM users WHERE id = ?')) {
                    return { id: args[0], name: 'Dr. Smith', email: 'smith@example.com' };
                  }
                  return null;
                },
                all: async () => ({ results: [] }),
                run: async () => ({ meta: { changes: 1 } }),
              };
            },
            first: async () => null,
            all: async () => ({ results: [] }),
            run: async () => ({ meta: { changes: 1 } }),
          };
        },
        batch: async (stmts) => {
          batchQueries = stmts;
          return [
            { meta: { changes: 2 } },
            { meta: { changes: 2 } },
            { meta: { changes: 1 } },
          ];
        },
      },
      ADMIN_JWT_SECRET: adminSecret,
      JWT_SECRET: userSecret,
    };

    const res = await app.request('/api/admin/users/user-123', {
      method: 'DELETE',
      headers: {
        'Cookie': `dentzy_admin_jwt=${adminToken}`,
      },
    }, mockEnv);

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.message, 'User deleted successfully.');
    assert.equal(batchQueries.length, 3);
  });

  it('DELETE /api/admin/users/:id returns 404 for non-existent user', async () => {
    const adminToken = await getAdminToken();

    const mockEnv = {
      DB: {
        prepare: () => ({
          bind: () => ({
            first: async () => null, // user not found
            all: async () => ({ results: [] }),
            run: async () => ({ meta: { changes: 0 } }),
          }),
        }),
        batch: async () => [],
      },
      ADMIN_JWT_SECRET: adminSecret,
      JWT_SECRET: userSecret,
    };

    const res = await app.request('/api/admin/users/non-existent-user', {
      method: 'DELETE',
      headers: {
        'Cookie': `dentzy_admin_jwt=${adminToken}`,
      },
    }, mockEnv);

    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.message, 'User not found.');
  });

  it('DELETE /api/admin/staff/:id deletes staff, unassigns orders, and cleans attendance', async () => {
    const adminToken = await getAdminToken();
    let batchQueries = [];

    const mockEnv = {
      DB: {
        prepare: (query) => {
          return {
            bind: (...args) => {
              return {
                first: async () => {
                  if (query.includes('FROM staff WHERE id = ?')) {
                    return { id: args[0], username: 'staff1' };
                  }
                  return null;
                },
                all: async () => ({ results: [] }),
                run: async () => ({ meta: { changes: 1 } }),
              };
            },
            first: async () => null,
            all: async () => ({ results: [] }),
            run: async () => ({ meta: { changes: 1 } }),
          };
        },
        batch: async (stmts) => {
          batchQueries = stmts;
          return [
            { meta: { changes: 1 } },
            { meta: { changes: 1 } },
            { meta: { changes: 1 } },
          ];
        },
      },
      ADMIN_JWT_SECRET: adminSecret,
      JWT_SECRET: userSecret,
    };

    const res = await app.request('/api/admin/staff/staff-123', {
      method: 'DELETE',
      headers: {
        'Cookie': `dentzy_admin_jwt=${adminToken}`,
      },
    }, mockEnv);

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.message, 'Staff account deleted.');
    assert.equal(batchQueries.length, 3);
  });

  it('DELETE /api/admin/staff/:id returns 404 for non-existent staff', async () => {
    const adminToken = await getAdminToken();

    const mockEnv = {
      DB: {
        prepare: () => ({
          bind: () => ({
            first: async () => null, // staff not found
            all: async () => ({ results: [] }),
            run: async () => ({ meta: { changes: 0 } }),
          }),
        }),
        batch: async () => [],
      },
      ADMIN_JWT_SECRET: adminSecret,
      JWT_SECRET: userSecret,
    };

    const res = await app.request('/api/admin/staff/non-existent-staff', {
      method: 'DELETE',
      headers: {
        'Cookie': `dentzy_admin_jwt=${adminToken}`,
      },
    }, mockEnv);

    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.message, 'Staff not found.');
  });
});

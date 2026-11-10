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

  it('DELETE /api/admin/users/:id soft-archives dentist account and preserves clinical data', async () => {
    const adminToken = await getAdminToken();
    let updatedUsers = false;
    let updateParams = [];
    let deletedUsers = false;

    const mockEnv = {
      DB: {
        prepare: (query) => {
          return {
            bind: (...args) => {
              return {
                first: async () => {
                  if (query.includes('FROM users WHERE id = ?')) {
                    return { id: args[0], name: 'Dr. Smith', email: 'smith@example.com', status: 'approved' };
                  }
                  if (query.includes('FROM payments WHERE ownerId = ?')) {
                    return { totalUnpaid: 0 };
                  }
                  if (query.includes('FROM lab_orders WHERE ownerId = ?')) {
                    return { cnt: 0 };
                  }
                  return null;
                },
                all: async () => ({ results: [] }),
                run: async () => {
                  if (query.includes("UPDATE users SET status = 'rejected'")) {
                    updatedUsers = true;
                    updateParams = args;
                  }
                  if (query.includes('DELETE FROM users')) {
                    deletedUsers = true;
                  }
                  return { meta: { changes: 1 } };
                },
              };
            },
            first: async () => null,
            all: async () => ({ results: [] }),
            run: async () => ({ meta: { changes: 1 } }),
          };
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
    assert.equal(updatedUsers, true);
    assert.equal(deletedUsers, false);
    assert.match(updateParams[0], /ACCOUNT_ARCHIVED_BY_ADMIN/);
    assert.match(updateParams[1], /^archived_user-123_\d+@dentzy\.invalid$/);
    assert.equal(updateParams[4], 'user-123');
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

  it('DELETE /api/admin/staff/:id deactivates staff, preserves completed cases, and retains attendance', async () => {
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
                    return { id: args[0], username: 'staff1', designation: 'Ceramist', employeeId: '10', status: 'active' };
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
          if (!batchQueries.length) batchQueries = stmts;
          return [
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
    assert.match(body.message, /Staff account deactivated and archived for 5-year compliance/i);
    assert.equal(body.status, 'inactive');
    assert.equal(batchQueries.length, 2);
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

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import app from '../src/index.js';

describe('Soft-Cancel & Soft-Archive Loopholes Verification', () => {
  const adminSecret = 'test-admin-secret';
  const staffSecret = 'test-staff-secret';
  const userSecret = 'test-user-secret';

  async function getAdminToken() {
    return new SignJWT({ role: 'admin', username: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(adminSecret));
  }

  async function getStaffToken(role = 'technician') {
    return new SignJWT({ id: 'staff-1', role: 'staff', username: 'tech1', designation: role })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(staffSecret));
  }

  async function getUserToken() {
    return new SignJWT({ id: 'dentist-1', role: 'user', email: 'doc@example.com' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(userSecret));
  }

  // Loophole 1: Block Cancelled Orders from Delivery Queue & Stage Updates
  describe('Loophole 1: Delivery Queue & Stage Updates', () => {
    it('GET /api/staff/deliveries excludes cancelled orders in SQL', async () => {
      let capturedSql = '';
      const mockEnv = {
        DB: {
          prepare: (q) => ({
            bind: (...args) => ({
              all: async () => {
                capturedSql = q;
                return { results: [] };
              },
              first: async () => {
                if (q.includes('FROM staff WHERE id = ?')) {
                  return { id: 'staff-1', status: 'active', designation: 'delivery_driver' };
                }
                return null;
              }
            }),
            all: async () => {
              capturedSql = q;
              return { results: [] };
            }
          })
        },
        STAFF_JWT_SECRET: staffSecret,
      };
      const token = await getStaffToken('delivery_driver');
      const res = await app.request('/api/staff/deliveries', {
        headers: { Authorization: `Bearer ${token}` }
      }, mockEnv);
      assert.equal(res.status, 200);
      assert.ok(capturedSql.includes("o.status != 'Cancelled'"));
    });

    it('PATCH /api/staff/deliveries/:orderId/status returns 400 for cancelled order', async () => {
      const mockEnv = {
        DB: {
          prepare: (q) => ({
            bind: () => ({
              first: async () => {
                if (q.includes('FROM staff WHERE id = ?')) {
                  return { id: 'staff-1', status: 'active', designation: 'delivery_driver' };
                }
                if (q.includes('FROM lab_orders o')) {
                  return { id: 'order-1', caseId: 'DZ-1', status: 'Cancelled' };
                }
                return null;
              }
            })
          })
        },
        STAFF_JWT_SECRET: staffSecret,
      };
      const token = await getStaffToken('delivery_driver');
      const res = await app.request('/api/staff/deliveries/order-1/status', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dispatched' })
      }, mockEnv);
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.message, 'Cannot update delivery status for a cancelled order.');
    });

    it('PATCH /api/staff/orders/:id/stage returns 400 for cancelled order', async () => {
      const mockEnv = {
        DB: {
          prepare: (q) => ({
            bind: () => ({
              first: async () => {
                if (q.includes('FROM staff WHERE id = ?')) {
                  return { id: 'staff-1', status: 'active', designation: 'technician' };
                }
                return { id: 'order-1', stage: 'received', status: 'Cancelled' };
              }
            })
          })
        },
        STAFF_JWT_SECRET: staffSecret,
      };
      const token = await getStaffToken('technician');
      const res = await app.request('/api/staff/orders/order-1/stage', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'production' })
      }, mockEnv);
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.message, 'Cannot update production stage of a cancelled order.');
    });

    it('PATCH /api/admin/orders/:id/stage returns 400 for cancelled order', async () => {
      const mockEnv = {
        DB: {
          prepare: (q) => ({
            bind: () => ({
              first: async () => ({ id: 'order-1', status: 'Cancelled' }),
              run: async () => ({ meta: { changes: 1 } })
            })
          })
        },
        ADMIN_JWT_SECRET: adminSecret,
      };
      const token = await getAdminToken();
      const res = await app.request('/api/admin/orders/order-1/stage', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'production' })
      }, mockEnv);
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.message, 'Cannot update production stage of a cancelled order.');
    });
  });

  // Loophole 2: Exclude Cancelled Orders from Staff Metrics & Unassign on Cancel
  describe('Loophole 2: Exclude Cancelled Orders from Staff Metrics & Unassign on Cancel', () => {
    it('DELETE /api/admin/orders/:id unassigns staff on early stages', async () => {
      let orderUpdateSql = '';
      const mockEnv = {
        ADMIN_JWT_SECRET: adminSecret,
        DB: {
          prepare: (q) => ({
            bind: (...args) => ({
              _sql: q,
              first: async () => {
                if (q.includes('FROM lab_orders WHERE id = ?')) {
                  return { caseId: 'DZ-1', ownerId: 'dentist-1', stage: 'production' };
                }
                return null;
              },
              run: async () => ({ meta: { changes: 1 } })
            })
          }),
          batch: async (statements) => {
            const labStmt = statements.find(s => s?._sql?.includes('lab_orders'));
            if (labStmt) orderUpdateSql = labStmt._sql;
            return [];
          }
        }
      };

      const token = await getAdminToken();
      const res = await app.request('/api/admin/orders/order-1', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }, mockEnv);
      assert.equal(res.status, 200);
      assert.ok(orderUpdateSql.includes('assigned_staff_id = NULL'));
    });

    it('DELETE /api/admin/orders/:id keeps assigned_staff_id on late stages', async () => {
      let orderUpdateSql = '';
      const mockEnv = {
        ADMIN_JWT_SECRET: adminSecret,
        DB: {
          prepare: (q) => ({
            bind: (...args) => ({
              _sql: q,
              first: async () => {
                if (q.includes('FROM lab_orders WHERE id = ?')) {
                  return { caseId: 'DZ-1', ownerId: 'dentist-1', stage: 'qc' };
                }
                return null;
              },
              run: async () => ({ meta: { changes: 1 } })
            })
          }),
          batch: async (statements) => {
            const labStmt = statements.find(s => s?._sql?.includes('lab_orders'));
            if (labStmt) orderUpdateSql = labStmt._sql;
            return [];
          }
        }
      };

      const token = await getAdminToken();
      const res = await app.request('/api/admin/orders/order-1', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }, mockEnv);
      assert.equal(res.status, 200);
      assert.ok(!orderUpdateSql.includes('assigned_staff_id = NULL'));
    });

    it('GET /api/admin/staff/metrics excludes cancelled orders', async () => {
      let capturedSql = '';
      const mockEnv = {
        ADMIN_JWT_SECRET: adminSecret,
        DB: {
          prepare: (q) => {
            if (q.includes('FROM lab_orders')) capturedSql = q;
            return {
              bind: () => ({ all: async () => ({ results: [] }) })
            };
          }
        }
      };
      const token = await getAdminToken();
      const res = await app.request('/api/admin/staff/metrics', {
        headers: { Authorization: `Bearer ${token}` }
      }, mockEnv);
      assert.equal(res.status, 200);
      assert.ok(capturedSql.includes("status != 'Cancelled'"));
    });

    it('GET /api/staff/metrics excludes cancelled orders', async () => {
      let capturedSql = '';
      const mockEnv = {
        STAFF_JWT_SECRET: staffSecret,
        DB: {
          prepare: (q) => ({
            bind: () => ({
              first: async () => {
                if (q.includes('FROM staff WHERE id = ?')) {
                  return { id: 'staff-1', status: 'active', designation: 'technician' };
                }
                return null;
              },
              _sql: q
            })
          }),
          batch: async (statements) => {
            capturedSql = statements[0]?._sql || '';
            return [{ results: [{ count: 0 }] }, { results: [] }];
          }
        }
      };
      const token = await getStaffToken('technician');
      const res = await app.request('/api/staff/metrics', {
        headers: { Authorization: `Bearer ${token}` }
      }, mockEnv);
      assert.equal(res.status, 200);
      assert.ok(capturedSql.includes("status != 'Cancelled'"));
    });
  });

  // Loophole 3: Exclude Cancelled Orders/Payments from Dashboard Counts & Unpaid Statements
  describe('Loophole 3: Dashboard Counts & Unpaid Statements', () => {
    it('GET /api/dashboard/stats filters cancelled payments from total count', async () => {
      let paymentSql = '';
      const mockEnv = {
        JWT_SECRET: userSecret,
        DB: {
          prepare: (q) => ({
            bind: () => ({
              first: async () => {
                if (q.includes('FROM users WHERE id = ?')) {
                  return { id: 'dentist-1', status: 'approved' };
                }
                return null;
              },
              _sql: q
            })
          }),
          batch: async (statements) => {
            paymentSql = statements[1]?._sql || '';
            return [
              { results: [{ total: 1, pending: 0, inProgress: 0, completed: 1 }] },
              { results: [{ total: 1, paid: 1, pending: 0, overdue: 0, totalUnpaid: 0 }] }
            ];
          }
        }
      };
      const token = await getUserToken();
      const res = await app.request('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      }, mockEnv);
      assert.equal(res.status, 200);
      assert.ok(paymentSql.includes("COUNT(CASE WHEN status != 'Cancelled' THEN 1 END)"));
    });

    it('GET /api/payments/unpaid-statement excludes cancelled orders', async () => {
      let statementSql = '';
      const mockEnv = {
        JWT_SECRET: userSecret,
        DB: {
          prepare: (q) => ({
            bind: () => ({
              all: async () => {
                statementSql = q;
                return { results: [] };
              },
              first: async () => null
            })
          })
        }
      };
      const token = await getUserToken();
      const res = await app.request('/api/payments/unpaid-statement', {
        headers: { Authorization: `Bearer ${token}` }
      }, mockEnv);
      assert.equal(res.status, 200);
      assert.ok(statementSql.includes("o.status != 'Cancelled'"));
    });
  });

  // Loophole 4: Protect Archived/Closed Dentist Accounts
  describe('Loophole 4: Protect Archived/Closed Dentist Accounts', () => {
    it('PATCH /api/admin/users/:id/approve rejects archived account', async () => {
      const mockEnv = {
        ADMIN_JWT_SECRET: adminSecret,
        DB: {
          prepare: (q) => ({
            bind: () => ({
              first: async () => ({
                id: 'user-1',
                email: 'archived_user-1_12345@dentzy.invalid',
                adminNote: 'ACCOUNT_ARCHIVED_BY_ADMIN | email:doc@test.com'
              }),
              run: async () => ({ meta: { changes: 1 } })
            })
          })
        }
      };
      const token = await getAdminToken();
      const res = await app.request('/api/admin/users/user-1/approve', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      }, mockEnv);
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.message, 'This account has been permanently archived/closed and cannot be modified.');
    });

    it('PATCH /api/admin/users/:id/reject rejects archived account', async () => {
      const mockEnv = {
        ADMIN_JWT_SECRET: adminSecret,
        DB: {
          prepare: (q) => ({
            bind: () => ({
              first: async () => ({
                id: 'user-1',
                email: 'closed_user-1_12345@dentzy.invalid',
                adminNote: 'ACCOUNT_CLOSED_BY_USER | email:doc@test.com'
              }),
              run: async () => ({ meta: { changes: 1 } })
            })
          })
        }
      };
      const token = await getAdminToken();
      const res = await app.request('/api/admin/users/user-1/reject', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: 'Rejection attempt' })
      }, mockEnv);
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.message, 'This account has been permanently archived/closed and cannot be modified.');
    });
  });

  // Loophole 5: Allow Admin to Reset Staff Password
  describe('Loophole 5: Allow Admin to Reset Staff Password', () => {
    it('PATCH /api/admin/staff/:id rejects password shorter than 8 characters', async () => {
      const mockEnv = {
        ADMIN_JWT_SECRET: adminSecret,
        DB: { prepare: () => ({ bind: () => ({ run: async () => ({ meta: { changes: 1 } }) }) }) }
      };
      const token = await getAdminToken();
      const res = await app.request('/api/admin/staff/staff-1', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'short' })
      }, mockEnv);
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.message, 'Password must be at least 8 characters long.');
    });

    it('PATCH /api/admin/staff/:id hashes password and updates staff record', async () => {
      let capturedUpdates = '';
      let capturedBinds = [];
      const mockEnv = {
        ADMIN_JWT_SECRET: adminSecret,
        DB: {
          prepare: (q) => ({
            bind: (...args) => {
              capturedUpdates = q;
              capturedBinds = args;
              return { run: async () => ({ meta: { changes: 1 } }) };
            }
          })
        }
      };
      const token = await getAdminToken();
      const res = await app.request('/api/admin/staff/staff-1', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'newSecurePassword123' })
      }, mockEnv);
      assert.equal(res.status, 200);
      assert.ok(capturedUpdates.includes('password = ?'));
      assert.ok(capturedBinds.some(b => typeof b === 'string' && b.length > 30));
    });
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import app from '../src/index.js';

describe('Micro-Guards: Cancelled Orders & Archived Accounts', () => {
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

  async function getStaffToken(role = 'Receptionist') {
    return new SignJWT({ id: 'staff-1', role: 'staff', username: 'reception1', designation: role })
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

  // Guard 1: Prevent double-archiving
  describe('Guard 1: Prevent double-archiving dentist', () => {
    it('DELETE /api/admin/users/:id returns 400 for already-archived account', async () => {
      const mockEnv = {
        ADMIN_JWT_SECRET: adminSecret,
        DB: {
          prepare: (q) => ({
            bind: () => ({
              first: async () => ({
                id: 'user-1', name: 'Dr. Test',
                email: 'archived_user-1_12345@dentzy.invalid',
                status: 'rejected',
                adminNote: 'ACCOUNT_ARCHIVED_BY_ADMIN | email:doc@test.com | archivedAt:2026-11-10'
              }),
              run: async () => ({ meta: { changes: 1 } })
            })
          })
        }
      };
      const token = await getAdminToken();
      const res = await app.request('/api/admin/users/user-1', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }, mockEnv);
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.message, 'This dentist account is already archived/closed.');
    });
  });

  // Guard 2: Block payment ops on cancelled orders
  describe('Guard 2: Block payment ops on cancelled orders', () => {
    it('PATCH /api/admin/orders/:id/payment returns 400 for cancelled order', async () => {
      const mockEnv = {
        ADMIN_JWT_SECRET: adminSecret,
        DB: {
          prepare: (q) => ({
            bind: () => ({
              first: async () => ({ id: 'order-1', caseId: 'DZ-1', ownerId: 'dentist-1', status: 'Cancelled' }),
              run: async () => ({ meta: { changes: 1 } })
            })
          })
        }
      };
      const token = await getAdminToken();
      const res = await app.request('/api/admin/orders/order-1/payment', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Paid', paymentMode: 'Cash' })
      }, mockEnv);
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.message, 'Cannot record or modify payment for a cancelled order.');
    });

    it('POST /api/admin/orders/:id/remind-payment returns 400 for cancelled order', async () => {
      const mockEnv = {
        ADMIN_JWT_SECRET: adminSecret,
        DB: {
          prepare: (q) => ({
            bind: () => ({
              first: async () => ({
                id: 'order-1', caseId: 'DZ-1', status: 'Cancelled',
                ownerName: 'Dr. Test', ownerEmail: 'doc@test.com'
              })
            })
          })
        }
      };
      const token = await getAdminToken();
      const res = await app.request('/api/admin/orders/order-1/remind-payment', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }, mockEnv);
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.message, 'Cannot send a payment reminder for a cancelled order.');
    });

    it('PATCH /api/admin/payments/:id/amount returns 400 for cancelled payment', async () => {
      const mockEnv = {
        ADMIN_JWT_SECRET: adminSecret,
        DB: {
          prepare: (q) => ({
            bind: () => ({
              first: async () => ({ id: 'pay-1', status: 'Cancelled' }),
              run: async () => ({ meta: { changes: 0 } })
            })
          })
        }
      };
      const token = await getAdminToken();
      const res = await app.request('/api/admin/payments/pay-1/amount', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 5000 })
      }, mockEnv);
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.message, 'Cannot update payment amount for a cancelled order.');
    });

    it('POST /api/admin/payments/batch returns 400 if any payment is cancelled', async () => {
      const mockEnv = {
        ADMIN_JWT_SECRET: adminSecret,
        DB: {
          prepare: (q) => ({
            bind: () => ({
              first: async () => ({ ownerId: 'dentist-1', status: 'Cancelled' })
            })
          })
        }
      };
      const token = await getAdminToken();
      const res = await app.request('/api/admin/payments/batch', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: ['order-1'], status: 'Paid', paymentMode: 'Cash' })
      }, mockEnv);
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.message, 'Batch payments cannot include cancelled orders or payments.');
    });

    it('PATCH /api/staff/payments/:id/amount returns 400 for cancelled payment', async () => {
      const mockEnv = {
        STAFF_JWT_SECRET: staffSecret,
        DB: {
          prepare: (q) => ({
            bind: () => ({
              first: async () => {
                if (q.includes('FROM staff WHERE id = ?')) {
                  return { id: 'staff-1', status: 'active', designation: 'Receptionist' };
                }
                return { id: 'pay-1', status: 'Cancelled' };
              },
              run: async () => ({ meta: { changes: 0 } })
            })
          })
        }
      };
      const token = await getStaffToken();
      const res = await app.request('/api/staff/payments/pay-1/amount', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 5000 })
      }, mockEnv);
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.message, 'Cannot update payment amount for a cancelled order.');
    });

    it('PATCH /api/staff/payments/:id returns 400 for cancelled payment', async () => {
      const mockEnv = {
        STAFF_JWT_SECRET: staffSecret,
        DB: {
          prepare: (q) => ({
            bind: () => ({
              first: async () => {
                if (q.includes('FROM staff WHERE id = ?')) {
                  return { id: 'staff-1', status: 'active', designation: 'Receptionist' };
                }
                return { id: 'pay-1', status: 'Cancelled' };
              },
              run: async () => ({ meta: { changes: 1 } })
            })
          })
        }
      };
      const token = await getStaffToken();
      const res = await app.request('/api/staff/payments/pay-1', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Paid' })
      }, mockEnv);
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.message, 'Cannot update payment status for a cancelled record.');
    });

    it('POST /api/staff/payments/batch returns 400 if any payment is cancelled', async () => {
      const mockEnv = {
        STAFF_JWT_SECRET: staffSecret,
        DB: {
          prepare: (q) => ({
            bind: () => ({
              first: async () => {
                if (q.includes('FROM staff WHERE id = ?')) {
                  return { id: 'staff-1', status: 'active', designation: 'Receptionist' };
                }
                return { ownerId: 'dentist-1', status: 'Cancelled' };
              }
            })
          })
        }
      };
      const token = await getStaffToken();
      const res = await app.request('/api/staff/payments/batch', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: ['order-1'], status: 'Paid', paymentMode: 'Cash' })
      }, mockEnv);
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.message, 'Batch payments cannot include cancelled orders or payments.');
    });
  });

  // Guard 3: Block general staff edits on cancelled orders
  describe('Guard 3: Block staff edits on cancelled orders', () => {
    it('PATCH /api/staff/orders/:id returns 400 for cancelled order', async () => {
      const mockEnv = {
        STAFF_JWT_SECRET: staffSecret,
        DB: {
          prepare: (q) => ({
            bind: () => ({
              first: async () => {
                if (q.includes('FROM staff WHERE id = ?')) {
                  return { id: 'staff-1', status: 'active', designation: 'Receptionist' };
                }
                return { id: 'order-1', status: 'Cancelled' };
              }
            })
          })
        }
      };
      const token = await getStaffToken();
      const res = await app.request('/api/staff/orders/order-1', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'test update' })
      }, mockEnv);
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.message, 'Cannot modify a cancelled order.');
    });
  });

  // Guard 4: Clear assigned_staff_id on dentist self-cancel
  describe('Guard 4: Clear assigned_staff_id on dentist self-cancel', () => {
    it('DELETE /api/dashboard/orders/:id includes assigned_staff_id = NULL in SQL', async () => {
      let capturedSql = '';
      const mockEnv = {
        JWT_SECRET: userSecret,
        DB: {
          prepare: (q) => ({
            bind: (...args) => ({
              _sql: q,
              first: async () => {
                if (q.includes('FROM users WHERE id = ?')) {
                  return { id: 'dentist-1', status: 'approved' };
                }
                if (q.includes('FROM lab_orders WHERE id = ? AND ownerId = ?')) {
                  return { id: 'order-1', caseId: 'DZ-1', stage: 'received', status: 'Pending' };
                }
                if (q.includes("FROM payments WHERE caseId = ? AND status = 'Paid'")) {
                  return null;
                }
                return null;
              },
              run: async () => ({ meta: { changes: 1 } })
            })
          }),
          batch: async (statements) => {
            const labStmt = statements.find(s => s?._sql?.includes('lab_orders'));
            if (labStmt) capturedSql = labStmt._sql;
            return [];
          }
        }
      };
      const token = await getUserToken();
      const res = await app.request('/api/dashboard/orders/order-1', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }, mockEnv);
      assert.equal(res.status, 200);
      assert.ok(capturedSql.includes('assigned_staff_id = NULL'));
    });
  });
});

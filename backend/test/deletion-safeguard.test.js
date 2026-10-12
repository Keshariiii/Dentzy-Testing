import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import app from '../src/index.js';

describe('Paid Order & Payment Deletion Safeguards', () => {
  const adminSecret = 'test-admin-secret';
  const userSecret = 'test-user-secret';

  async function getAdminToken() {
    return new SignJWT({ role: 'admin', username: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(adminSecret));
  }

  async function getUserToken(userId = 'user-123') {
    return new SignJWT({ id: userId, email: 'dentist@example.com', role: 'dentist' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(userSecret));
  }

  it('blocks admin from deleting an order whose payment is marked as Paid', async () => {
    const adminToken = await getAdminToken();

    const mockEnv = {
      DB: {
        prepare: (query) => {
          return {
            bind: (...args) => {
              return {
                first: async () => {
                  if (query.includes('FROM lab_orders WHERE id = ?')) {
                    return { caseId: 'DZ-202610-001', ownerId: 'user-123' };
                  }
                  if (query.includes("FROM payments WHERE caseId = ? AND status = 'Paid'")) {
                    return { id: 'pay-1', status: 'Paid', amount: 3500 };
                  }
                  return null;
                },
                run: async () => ({ meta: { changes: 1 } }),
              };
            },
          };
        },
      },
      ADMIN_JWT_SECRET: adminSecret,
      JWT_SECRET: userSecret,
    };

    const res = await app.request('/api/admin/orders/order-123', {
      method: 'DELETE',
      headers: {
        'Cookie': `dentzy_admin_jwt=${adminToken}`,
      },
    }, mockEnv);

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.code, 'PAID_ORDER_DELETION_BLOCKED');
    assert.match(body.message, /already been recorded as Paid/i);
  });

  it('allows admin to delete an order if payment is Pending or does not exist', async () => {
    const adminToken = await getAdminToken();
    let deletedOrder = false;
    let deletedPayment = false;

    const mockEnv = {
      DB: {
        prepare: (query) => {
          return {
            bind: (...args) => {
              return {
                first: async () => {
                  if (query.includes('FROM lab_orders WHERE id = ?')) {
                    return { caseId: 'DZ-202610-002', ownerId: 'user-123' };
                  }
                  if (query.includes("FROM payments WHERE caseId = ? AND status = 'Paid'")) {
                    return null; // Not paid
                  }
                  return null;
                },
                run: async () => {
                  if (query.includes('DELETE FROM lab_orders')) deletedOrder = true;
                  if (query.includes('DELETE FROM payments')) deletedPayment = true;
                  return { meta: { changes: 1 } };
                },
              };
            },
          };
        },
      },
      ADMIN_JWT_SECRET: adminSecret,
      JWT_SECRET: userSecret,
    };

    const res = await app.request('/api/admin/orders/order-456', {
      method: 'DELETE',
      headers: {
        'Cookie': `dentzy_admin_jwt=${adminToken}`,
      },
    }, mockEnv);

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.message, 'Order deleted successfully.');
    assert.equal(deletedOrder, true);
    assert.equal(deletedPayment, true);
  });

  it('blocks admin from deleting a payment record directly if status is Paid', async () => {
    const adminToken = await getAdminToken();

    const mockEnv = {
      DB: {
        prepare: (query) => {
          return {
            bind: (...args) => {
              return {
                first: async () => {
                  if (query.includes('SELECT id, caseId, status FROM payments')) {
                    return { id: 'pay-99', caseId: 'DZ-99', status: 'Paid' };
                  }
                  return null;
                },
                run: async () => ({ meta: { changes: 1 } }),
              };
            },
          };
        },
      },
      ADMIN_JWT_SECRET: adminSecret,
      JWT_SECRET: userSecret,
    };

    const res = await app.request('/api/admin/payments/pay-99', {
      method: 'DELETE',
      headers: {
        'Cookie': `dentzy_admin_jwt=${adminToken}`,
      },
    }, mockEnv);

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.code, 'PAID_PAYMENT_DELETION_BLOCKED');
    assert.match(body.message, /marked as Paid/i);
  });

  it('blocks dentist from deleting an order that is already Paid', async () => {
    const userToken = await getUserToken('user-123');

    const mockEnv = {
      DB: {
        prepare: (query) => {
          return {
            bind: (...args) => {
              return {
                first: async () => {
                  if (query.includes('FROM users WHERE id = ?')) {
                    return { id: 'user-123', name: 'Dr. Dentist', status: 'approved' };
                  }
                  if (query.includes('FROM lab_orders WHERE id = ? AND ownerId = ?')) {
                    return { caseId: 'DZ-202610-777' };
                  }
                  if (query.includes("FROM payments WHERE caseId = ? AND status = 'Paid'")) {
                    return { id: 'pay-777', status: 'Paid' };
                  }
                  return null;
                },
                run: async () => ({ meta: { changes: 1 } }),
              };
            },
          };
        },
      },
      ADMIN_JWT_SECRET: adminSecret,
      JWT_SECRET: userSecret,
    };

    const res = await app.request('/api/dashboard/orders/order-777', {
      method: 'DELETE',
      headers: {
        'Cookie': `dentzy_jwt=${userToken}`,
      },
    }, mockEnv);

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.code, 'PAID_ORDER_DELETION_BLOCKED');
    assert.match(body.message, /already been completed/i);
  });
});

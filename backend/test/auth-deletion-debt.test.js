import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import app from '../src/index.js';
import { hashPassword } from '../src/utils/crypto.js';

describe('Account Deletion & Debt Guard API (auth.js)', () => {
  const userSecret = 'test-jwt-secret';

  async function getUserToken(userId = 'dentist-100') {
    return new SignJWT({ id: userId, email: 'dentist@clinic.com', role: 'dentist' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(userSecret));
  }

  it('rejects deletion with 401 if password is incorrect', async () => {
    const userToken = await getUserToken('dentist-100');
    const storedHash = await hashPassword('CorrectPassword1!');

    const mockEnv = {
      DB: {
        prepare: (query) => ({
          bind: (...args) => ({
            first: async () => {
              if (query.includes('FROM users WHERE id = ?')) {
                return { id: 'dentist-100', name: 'Dr. Test', status: 'approved', password: storedHash };
              }
              return null;
            },
            run: async () => ({ meta: { changes: 1 } }),
          }),
        }),
      },
      JWT_SECRET: userSecret,
    };

    const res = await app.request('/api/auth/profile', {
      method: 'DELETE',
      headers: {
        'Cookie': `dentzy_jwt=${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: 'WrongPassword1!' }),
    }, mockEnv);

    assert.equal(res.status, 401);
    const body = await res.json();
    assert.match(body.message, /Incorrect password/i);
  });

  it('blocks deletion with 400 UNPAID_DUES_EXIST if dentist has outstanding balance', async () => {
    const userToken = await getUserToken('dentist-100');
    const storedHash = await hashPassword('CorrectPassword1!');

    const mockEnv = {
      DB: {
        prepare: (query) => ({
          bind: (...args) => ({
            first: async () => {
              if (query.includes('SELECT password FROM users WHERE id = ?')) {
                return { password: storedHash };
              }
              if (query.includes('FROM users WHERE id = ?')) {
                return { id: 'dentist-100', name: 'Dr. Test', status: 'approved' };
              }
              if (query.includes("SELECT COALESCE(SUM(amount), 0) AS totalUnpaid FROM payments")) {
                return { totalUnpaid: 4500 };
              }
              return null;
            },
            run: async () => ({ meta: { changes: 1 } }),
          }),
        }),
      },
      JWT_SECRET: userSecret,
    };

    const res = await app.request('/api/auth/profile', {
      method: 'DELETE',
      headers: {
        'Cookie': `dentzy_jwt=${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: 'CorrectPassword1!' }),
    }, mockEnv);

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.code, 'UNPAID_DUES_EXIST');
    assert.match(body.message, /4,500/);
    assert.match(body.message, /settle all pending dues/i);
  });

  it('blocks deletion with 400 ACTIVE_ORDERS_EXIST if dentist has active production orders', async () => {
    const userToken = await getUserToken('dentist-100');
    const storedHash = await hashPassword('CorrectPassword1!');

    const mockEnv = {
      DB: {
        prepare: (query) => ({
          bind: (...args) => ({
            first: async () => {
              if (query.includes('SELECT password FROM users WHERE id = ?')) {
                return { password: storedHash };
              }
              if (query.includes('FROM users WHERE id = ?')) {
                return { id: 'dentist-100', name: 'Dr. Test', status: 'approved' };
              }
              if (query.includes("SELECT COALESCE(SUM(amount), 0) AS totalUnpaid FROM payments")) {
                return { totalUnpaid: 0 };
              }
              if (query.includes("SELECT COUNT(*) AS cnt FROM lab_orders")) {
                return { cnt: 2 };
              }
              return null;
            },
            run: async () => ({ meta: { changes: 1 } }),
          }),
        }),
      },
      JWT_SECRET: userSecret,
    };

    const res = await app.request('/api/auth/profile', {
      method: 'DELETE',
      headers: {
        'Cookie': `dentzy_jwt=${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: 'CorrectPassword1!' }),
    }, mockEnv);

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.code, 'ACTIVE_ORDERS_EXIST');
    assert.match(body.message, /2 order\(s\) are still active/i);
  });

  it('soft-deletes login row to preserve 5-year GST records when dentist has history', async () => {
    const userToken = await getUserToken('dentist-100');
    const storedHash = await hashPassword('CorrectPassword1!');
    let updatedUsers = false;
    let updateParams = [];
    let deletedUsers = false;

    const mockEnv = {
      DB: {
        prepare: (query) => ({
          bind: (...args) => ({
            first: async () => {
              if (query.includes('SELECT password FROM users WHERE id = ?')) {
                return { password: storedHash };
              }
              if (query.includes('FROM users WHERE id = ?')) {
                return { id: 'dentist-100', email: 'dentist@clinic.com', name: 'Dr. Test', status: 'approved' };
              }
              if (query.includes("SELECT COALESCE(SUM(amount), 0) AS totalUnpaid FROM payments")) {
                return { totalUnpaid: 0 };
              }
              if (query.includes("SELECT COUNT(*) AS cnt FROM lab_orders")) {
                return { cnt: 0 };
              }
              return null;
            },
            run: async () => {
              if (query.includes("UPDATE users SET status = 'rejected'")) {
                updatedUsers = true;
                updateParams = args;
              }
              if (query.includes('DELETE FROM users WHERE id = ?')) {
                deletedUsers = true;
              }
              return { meta: { changes: 1 } };
            },
          }),
        }),
      },
      JWT_SECRET: userSecret,
    };

    const res = await app.request('/api/auth/profile', {
      method: 'DELETE',
      headers: {
        'Cookie': `dentzy_jwt=${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: 'CorrectPassword1!' }),
    }, mockEnv);

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.match(body.message, /permanently closed/i);
    assert.equal(updatedUsers, true, 'Should execute soft-close UPDATE on users');
    assert.equal(deletedUsers, false, 'Should NOT hard delete users with history');
    assert.match(updateParams[0], /ACCOUNT_CLOSED_BY_USER/);
    assert.match(updateParams[1], /^closed_dentist-100_\d+@dentzy\.invalid$/); // closedEmail
    assert.equal(updateParams[4], 'dentist-100'); // userId WHERE id = ?

    // Confirm Set-Cookie clears dentzy_jwt
    const setCookie = res.headers.get('set-cookie');
    assert.match(setCookie, /dentzy_jwt=;/);
    assert.match(setCookie, /Max-Age=0/);
  });

  it('soft-closes user row even when account has zero history (5-year retention)', async () => {
    const userToken = await getUserToken('dentist-fresh');
    const storedHash = await hashPassword('CorrectPassword1!');
    let deletedUsers = false;
    let updatedUsers = false;

    const mockEnv = {
      DB: {
        prepare: (query) => ({
          bind: (...args) => ({
            first: async () => {
              if (query.includes('SELECT password FROM users WHERE id = ?')) {
                return { password: storedHash };
              }
              if (query.includes('FROM users WHERE id = ?')) {
                return { id: 'dentist-fresh', email: 'fresh@clinic.com', name: 'Dr. Fresh', status: 'approved' };
              }
              if (query.includes("SELECT COALESCE(SUM(amount), 0) AS totalUnpaid FROM payments")) {
                return { totalUnpaid: 0 };
              }
              if (query.includes("SELECT COUNT(*) AS cnt FROM lab_orders")) {
                return { cnt: 0 };
              }
              return null;
            },
            run: async () => {
              if (query.includes("UPDATE users SET status = 'rejected'")) {
                updatedUsers = true;
              }
              if (query.includes('DELETE FROM users WHERE id = ?')) {
                deletedUsers = true;
              }
              return { meta: { changes: 1 } };
            },
          }),
        }),
      },
      JWT_SECRET: userSecret,
    };

    const res = await app.request('/api/auth/profile', {
      method: 'DELETE',
      headers: {
        'Cookie': `dentzy_jwt=${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: 'CorrectPassword1!' }),
    }, mockEnv);

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.match(body.message, /permanently closed/i);
    assert.equal(updatedUsers, true, 'Should soft-close users even with zero history');
    assert.equal(deletedUsers, false, 'Should NEVER hard delete users');

    const setCookie = res.headers.get('set-cookie');
    assert.match(setCookie, /dentzy_jwt=;/);
  });

  it('PUT /api/auth/profile updates dciNumber and returns it in profile', async () => {
    const userToken = await getUserToken('dentist-100');
    let capturedSets = '';
    let capturedVals = [];

    const mockEnv = {
      DB: {
        prepare: (query) => ({
          bind: (...args) => ({
            first: async () => {
              if (query.includes('FROM users WHERE id = ?')) {
                return {
                  id: 'dentist-100',
                  name: 'Dr. Test',
                  email: 'dentist@clinic.com',
                  dob: null,
                  phone: '9876543210',
                  clinicName: 'My Clinic',
                  address: '123 Health St',
                  dciNumber: 'DCI-TN-2024-9988',
                  createdAt: '2026-01-01T00:00:00.000Z',
                  status: 'approved',
                };
              }
              return null;
            },
            run: async () => {
              if (query.includes('UPDATE users SET')) {
                capturedSets = query;
                capturedVals = args;
              }
              return { meta: { changes: 1 } };
            },
          }),
        }),
      },
      JWT_SECRET: userSecret,
    };

    const res = await app.request('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Cookie': `dentzy_jwt=${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dciNumber: 'DCI-TN-2024-9988' }),
    }, mockEnv);

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.message, 'Profile updated successfully.');
    assert.equal(body.user.dciNumber, 'DCI-TN-2024-9988');
    assert.match(capturedSets, /dciNumber = \?/);
    assert.ok(capturedVals.includes('DCI-TN-2024-9988'));
  });
});

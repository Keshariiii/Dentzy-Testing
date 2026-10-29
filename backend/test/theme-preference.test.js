import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import app from '../src/index.js';

describe('Theme Preference Persistence & Restoration API', () => {
  const jwtSecret = 'test-jwt-secret';
  const adminSecret = 'test-admin-secret';
  const staffSecret = 'test-staff-secret';

  const makeToken = async (payload, secret) => {
    const key = new TextEncoder().encode(secret);
    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(key);
  };

  it('updates dentist theme preference via PUT /api/auth/profile', async () => {
    const token = await makeToken({ id: 'dentist-1', role: 'user' }, jwtSecret);
    let capturedUpdateSql = '';
    let capturedBinds = [];

    const mockUser = {
      id: 'dentist-1',
      name: 'Dr. Smile',
      email: 'smile@dentzy.in',
      status: 'approved',
      clinicName: 'Smile Dental',
      themePreference: 'dark',
      createdAt: '2026-01-01',
    };

    const mockEnv = {
      DB: {
        prepare: (sql) => ({
          bind: (...args) => ({
            run: async () => {
              capturedUpdateSql = sql;
              capturedBinds = args;
              return { success: true };
            },
            first: async () => mockUser,
          }),
          first: async () => mockUser,
        }),
      },
      JWT_SECRET: jwtSecret,
    };

    const res = await app.fetch(
      new Request('http://localhost/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `dentzy_jwt=${token}`,
        },
        body: JSON.stringify({ themePreference: 'dark' }),
      }),
      mockEnv
    );

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.user.themePreference, 'dark');
    assert.ok(capturedUpdateSql.includes('themePreference = ?'));
    assert.ok(capturedBinds.includes('dark'));
  });

  it('rejects invalid themePreference with 422', async () => {
    const token = await makeToken({ id: 'dentist-1', role: 'user' }, jwtSecret);
    const mockEnv = {
      DB: {
        prepare: () => ({
          bind: () => ({ first: async () => ({ id: 'dentist-1', status: 'approved' }) }),
          first: async () => ({ id: 'dentist-1', status: 'approved' }),
        }),
      },
      JWT_SECRET: jwtSecret,
    };

    const res = await app.fetch(
      new Request('http://localhost/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `dentzy_jwt=${token}`,
        },
        body: JSON.stringify({ themePreference: 'neon-purple' }),
      }),
      mockEnv
    );

    assert.equal(res.status, 422);
  });

  it('returns themePreference in GET /api/auth/me', async () => {
    const token = await makeToken({ id: 'dentist-1', role: 'user' }, jwtSecret);
    const mockEnv = {
      DB: {
        prepare: () => ({
          bind: () => ({
            first: async () => ({
              id: 'dentist-1',
              name: 'Dr. Smile',
              email: 'smile@dentzy.in',
              status: 'approved',
              themePreference: 'dark',
              createdAt: '2026-01-01',
            }),
          }),
          first: async () => ({
            id: 'dentist-1',
            name: 'Dr. Smile',
            email: 'smile@dentzy.in',
            status: 'approved',
            themePreference: 'dark',
            createdAt: '2026-01-01',
          }),
        }),
      },
      JWT_SECRET: jwtSecret,
    };

    const res = await app.fetch(
      new Request('http://localhost/api/auth/me', {
        headers: { Cookie: `dentzy_jwt=${token}` },
      }),
      mockEnv
    );

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.user.themePreference, 'dark');
  });

  it('admin can get and update admin_theme via /api/admin/settings/theme', async () => {
    const adminToken = await makeToken({ role: 'admin', username: 'admin' }, adminSecret);
    let storedTheme = 'system';

    const mockEnv = {
      DB: {
        prepare: (sql) => ({
          bind: (...args) => ({
            run: async () => {
              if (sql.includes('admin_theme')) storedTheme = args[0];
              return { success: true };
            },
            first: async () => {
              if (sql.includes('admin_theme')) return { value: storedTheme };
              return null;
            },
          }),
          first: async () => {
            if (sql.includes('admin_theme')) return { value: storedTheme };
            return null;
          },
        }),
      },
      ADMIN_JWT_SECRET: adminSecret,
    };

    // 1. Update to dark
    const putRes = await app.fetch(
      new Request('http://localhost/api/admin/settings/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `dentzy_admin_jwt=${adminToken}`,
        },
        body: JSON.stringify({ theme: 'dark' }),
      }),
      mockEnv
    );
    assert.equal(putRes.status, 200);
    const putBody = await putRes.json();
    assert.equal(putBody.theme, 'dark');
    assert.equal(storedTheme, 'dark');

    // 2. Read back
    const getRes = await app.fetch(
      new Request('http://localhost/api/admin/settings/theme', {
        headers: { Cookie: `dentzy_admin_jwt=${adminToken}` },
      }),
      mockEnv
    );
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.equal(getBody.theme, 'dark');
  });

  it('staff can update themePreference via PUT /api/staff/profile', async () => {
    const staffToken = await makeToken({ id: 'staff-1', role: 'staff', username: 'receptionist' }, staffSecret);
    let capturedBinds = [];

    const mockEnv = {
      DB: {
        prepare: () => ({
          bind: (...args) => ({
            run: async () => {
              capturedBinds = args;
              return { meta: { changes: 1 } };
            },
            first: async () => ({
              id: 'staff-1',
              username: 'receptionist',
              status: 'active',
              themePreference: 'light',
            }),
          }),
          first: async () => ({
            id: 'staff-1',
            username: 'receptionist',
            status: 'active',
            themePreference: 'light',
          }),
        }),
      },
      STAFF_JWT_SECRET: staffSecret,
    };

    const res = await app.fetch(
      new Request('http://localhost/api/staff/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `dentzy_staff_jwt=${staffToken}`,
        },
        body: JSON.stringify({ themePreference: 'light' }),
      }),
      mockEnv
    );

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.staff.themePreference, 'light');
    assert.ok(capturedBinds.includes('light'));
  });
});

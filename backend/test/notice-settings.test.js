import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import app from '../src/index.js';

describe('Notice Settings API (Dentist & Staff)', () => {
  const setup = async () => {
    const adminSecret = 'test-admin-secret';
    const staffSecret = 'test-staff-secret';
    const adminToken = await new SignJWT({ role: 'admin', username: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(adminSecret));

    const staffToken = await new SignJWT({ id: 'staff-1', role: 'staff', username: 'staff1' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(staffSecret));

    const store = new Map();

    const mockEnv = {
      DB: {
        prepare: (query) => {
          return {
            bind: (...args) => {
              return {
                first: async () => {
                  if (query.includes('FROM staff WHERE id = ?')) {
                    return { id: args[0], username: 'staff1', displayName: 'Staff One', status: 'active' };
                  }
                  const key = args[0] || (query.includes('staff_notice_bar') ? 'staff_notice_bar' : (query.includes('dentist_notice_bar') ? 'dentist_notice_bar' : null));
                  if (key && store.has(key)) {
                    return { value: store.get(key), updated_at: '2026-10-21T12:00:00Z', updated_by: 'admin' };
                  }
                  return null;
                },
                all: async () => ({ results: [] }),
                run: async () => {
                  if (query.includes('staff_notice_bar')) {
                    store.set('staff_notice_bar', args[0]);
                  } else if (query.includes('dentist_notice_bar')) {
                    store.set('dentist_notice_bar', args[0]);
                  }
                  return { meta: { changes: 1 } };
                },
              };
            },
            first: async () => {
              const key = query.includes('staff_notice_bar') ? 'staff_notice_bar' : (query.includes('dentist_notice_bar') ? 'dentist_notice_bar' : null);
              if (key && store.has(key)) {
                return { value: store.get(key), updated_at: '2026-10-21T12:00:00Z', updated_by: 'admin' };
              }
              return null;
            },
          };
        },
      },
      ADMIN_JWT_SECRET: adminSecret,
      STAFF_JWT_SECRET: staffSecret,
    };

    return { adminToken, staffToken, mockEnv, store };
  };

  it('GET /api/admin/settings/staff-notice returns defaults initially', async () => {
    const { adminToken, mockEnv } = await setup();
    const res = await app.request('/api/admin/settings/staff-notice', {
      headers: { Cookie: `dentzy_admin_jwt=${adminToken}` },
    }, mockEnv);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.enabled, true);
    assert.ok(Array.isArray(body.messages) && body.messages.length > 0);
  });

  it('PUT /api/admin/settings/staff-notice updates staff notice and GET /api/staff/notice receives it', async () => {
    const { adminToken, staffToken, mockEnv } = await setup();
    const newMessages = ['Urgent: Lab closed tomorrow', 'Wear protective equipment at all times'];
    const res = await app.request('/api/admin/settings/staff-notice', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `dentzy_admin_jwt=${adminToken}`,
      },
      body: JSON.stringify({ enabled: true, messages: newMessages }),
    }, mockEnv);

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.enabled, true);
    assert.deepEqual(body.messages, newMessages);

    // Verify GET /api/staff/notice gets these messages
    const staffRes = await app.request('/api/staff/notice', {
      headers: { Cookie: `dentzy_staff_jwt=${staffToken}` },
    }, mockEnv);
    assert.equal(staffRes.status, 200);
    const staffBody = await staffRes.json();
    assert.equal(staffBody.enabled, true);
    assert.deepEqual(staffBody.messages, newMessages);
    assert.equal(staffBody.message, newMessages[0]);
  });
});

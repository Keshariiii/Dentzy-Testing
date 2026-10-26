import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import app from '../src/index.js';

describe('Admin Maintenance Settings API', () => {
  const setup = async () => {
    const adminSecret = 'test-admin-secret';
    const adminToken = await new SignJWT({ role: 'admin', username: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(adminSecret));

    const store = new Map();

    const mockEnv = {
      DB: {
        prepare: (query) => {
          return {
            bind: (...args) => {
              return {
                first: async () => {
                  if (query.includes('FROM app_settings WHERE key =')) {
                    const key = args[0] || (query.includes('maintenance_mode') ? 'maintenance_mode' : null);
                    if (key && store.has(key)) {
                      return { value: store.get(key), updated_at: '2026-10-26T12:00:00Z', updated_by: 'admin' };
                    }
                  }
                  return null;
                },
                all: async () => ({ results: [] }),
                run: async () => {
                  if (query.includes('maintenance_mode') || args.includes('maintenance_mode')) {
                    store.set('maintenance_mode', args[0]);
                  }
                  return { meta: { changes: 1 } };
                },
              };
            },
            first: async () => {
              if (query.includes('maintenance_mode')) {
                if (store.has('maintenance_mode')) {
                  return { value: store.get('maintenance_mode'), updated_at: '2026-10-26T12:00:00Z', updated_by: 'admin' };
                }
              }
              return null;
            },
          };
        },
      },
      ADMIN_JWT_SECRET: adminSecret,
    };

    return { adminToken, mockEnv, store };
  };

  it('GET /api/admin/settings/maintenance returns default configuration initially', async () => {
    const { adminToken, mockEnv } = await setup();
    const res = await app.request('/api/admin/settings/maintenance', {
      headers: { Cookie: `dentzy_admin_jwt=${adminToken}` },
    }, mockEnv);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.enabled, false);
    assert.equal(body.target, 'both');
    assert.equal(body.showEmergencyContact, true);
    assert.ok(typeof body.customMessage === 'string');
    assert.ok(typeof body.estimatedTime === 'string');
  });

  it('PUT /api/admin/settings/maintenance validates payload correctly', async () => {
    const { adminToken, mockEnv } = await setup();

    // Invalid target
    const resBadTarget = await app.request('/api/admin/settings/maintenance', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `dentzy_admin_jwt=${adminToken}`,
      },
      body: JSON.stringify({ enabled: true, target: 'invalid_role' }),
    }, mockEnv);
    assert.equal(resBadTarget.status, 400);

    // Missing enabled boolean
    const resBadEnabled = await app.request('/api/admin/settings/maintenance', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `dentzy_admin_jwt=${adminToken}`,
      },
      body: JSON.stringify({ target: 'dentists' }),
    }, mockEnv);
    assert.equal(resBadEnabled.status, 400);
  });

  it('PUT /api/admin/settings/maintenance updates config successfully and persists', async () => {
    const { adminToken, mockEnv } = await setup();
    const updatePayload = {
      enabled: true,
      target: 'dentists',
      customMessage: 'Ceramic CAD/CAM milling upgrade in progress.',
      estimatedTime: 'Expected back online: 7:00 PM IST',
      showEmergencyContact: true,
    };

    const res = await app.request('/api/admin/settings/maintenance', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `dentzy_admin_jwt=${adminToken}`,
      },
      body: JSON.stringify(updatePayload),
    }, mockEnv);

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.enabled, true);
    assert.equal(body.target, 'dentists');
    assert.equal(body.customMessage, updatePayload.customMessage);
    assert.equal(body.estimatedTime, updatePayload.estimatedTime);
    assert.equal(body.showEmergencyContact, true);
    assert.equal(body.updated_by, 'admin');

    // Verify GET returns the updated configuration
    const getRes = await app.request('/api/admin/settings/maintenance', {
      headers: { Cookie: `dentzy_admin_jwt=${adminToken}` },
    }, mockEnv);
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.equal(getBody.enabled, true);
    assert.equal(getBody.target, 'dentists');
    assert.equal(getBody.customMessage, updatePayload.customMessage);
  });
});

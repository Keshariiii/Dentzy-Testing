import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/index.js';

// ── Helper: make a request against the Hono app ─────────────────────────────

const req = (path, opts = {}) => app.request(path, {
  headers: { 'Content-Type': 'application/json', ...opts.headers },
  ...opts,
});

const json = async (path, opts) => {
  const res = await req(path, opts);
  return { res, body: await res.json() };
};

// Fake env bindings for Hono (app.request doesn't use wrangler)
// The app accesses c.env — Hono's app.request passes the 3rd arg as env
const env = {
  DB: {
    prepare: () => ({
      bind: () => ({
        first: async () => null,
        all: async () => ({ results: [] }),
        run: async () => ({ meta: { changes: 0 } }),
      }),
    }),
    batch: async () => [],
  },
  JWT_SECRET: 'test-jwt-secret',
  ADMIN_JWT_SECRET: 'test-admin-secret',
  ADMIN_USERNAME: 'admin',
  ADMIN_PASSWORD: 'admin123',
  ALLOWED_ORIGINS: 'https://dentzy-testing.pages.dev,https://*.pages.dev',
};

const envReq = (path, opts = {}) => app.request(path, {
  headers: { 'Content-Type': 'application/json', ...opts.headers },
  ...opts,
}, env);

const envJson = async (path, opts) => {
  const res = await envReq(path, opts);
  let body;
  try { body = await res.json(); } catch { body = null; }
  return { res, body };
};

// ── Basic Connectivity ──────────────────────────────────────────────────────

describe('API Connectivity', () => {
  it('GET / returns 200', async () => {
    const res = await envReq('/');
    assert.equal(res.status, 200);
  });

  it('GET /api/health returns status', async () => {
    const { res, body } = await envJson('/api/health');
    assert.equal(res.status, 200);
    assert.equal(body.status, 'ok');
  });
});

// ── Security Headers ────────────────────────────────────────────────────────

describe('Security Headers', () => {
  it('sets HSTS header', async () => {
    const res = await envReq('/api/health');
    assert.ok(res.headers.get('Strict-Transport-Security')?.includes('max-age'));
  });

  it('sets X-Content-Type-Options', async () => {
    const res = await envReq('/api/health');
    assert.equal(res.headers.get('X-Content-Type-Options'), 'nosniff');
  });

  it('sets X-Frame-Options', async () => {
    const res = await envReq('/api/health');
    assert.equal(res.headers.get('X-Frame-Options'), 'DENY');
  });

  it('sets Referrer-Policy', async () => {
    const res = await envReq('/api/health');
    assert.equal(res.headers.get('Referrer-Policy'), 'strict-origin-when-cross-origin');
  });
});

// ── Auth Route Validation ───────────────────────────────────────────────────

describe('Auth Routes', () => {
  it('POST /api/auth/login rejects empty body', async () => {
    const { res } = await envJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    assert.ok(res.status >= 400);
  });

  it('POST /api/auth/login returns 401 for non-existent user', async () => {
    const { res, body } = await envJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'nobody@test.com', password: 'Test1234!' }),
    });
    assert.equal(res.status, 401);
    assert.ok(body.message);
  });

  it('POST /api/auth/forgot-password/send-otp rejects empty email', async () => {
    const { res } = await envJson('/api/auth/forgot-password/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email: '' }),
    });
    assert.ok(res.status >= 400);
  });
});

// ── Protected Route Access ──────────────────────────────────────────────────

describe('Protected Routes', () => {
  it('GET /api/auth/me returns 401 without token', async () => {
    const { res } = await envJson('/api/auth/me');
    assert.equal(res.status, 401);
  });

  it('GET /api/dashboard/orders returns 401 without token', async () => {
    const { res } = await envJson('/api/dashboard/orders');
    assert.equal(res.status, 401);
  });

  it('GET /api/admin/users returns 401 without token', async () => {
    const { res } = await envJson('/api/admin/users');
    assert.equal(res.status, 401);
  });

  it('GET /api/admin/me returns 401 without token', async () => {
    const { res } = await envJson('/api/admin/me');
    assert.equal(res.status, 401);
  });
});

// ── Contact Route ───────────────────────────────────────────────────────────

describe('Contact Routes', () => {
  it('POST /api/contact rejects empty body', async () => {
    const { res } = await envJson('/api/contact', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    assert.ok(res.status >= 400);
  });

  it('POST /api/contact rejects missing message', async () => {
    const { res } = await envJson('/api/contact', {
      method: 'POST',
      body: JSON.stringify({ name: 'John', email: 'j@d.com' }),
    });
    assert.ok(res.status >= 400);
  });
});

// ── Admin Login ─────────────────────────────────────────────────────────────

describe('Admin Routes', () => {
  it('POST /api/admin/login rejects wrong credentials', async () => {
    const { res, body } = await envJson('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'wrong', password: 'wrong' }),
    });
    assert.equal(res.status, 401);
    assert.ok(body.message.includes('Invalid'));
  });

  it('POST /api/admin/login rejects empty body', async () => {
    const { res } = await envJson('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    assert.ok(res.status >= 400);
  });
});

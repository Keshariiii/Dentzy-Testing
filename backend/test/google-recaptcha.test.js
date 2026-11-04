import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/index.js';

describe('Google Auth and reCAPTCHA Verification (auth.js)', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('POST /api/auth/google', () => {
    it('returns 404 ACCOUNT_NOT_REGISTERED when user does not exist and mode is login (default)', async () => {
      globalThis.fetch = async (url) => {
        if (url.includes('googleapis.com/tokeninfo')) {
          return {
            ok: true,
            json: async () => ({
              email: 'newdoc@example.com',
              email_verified: true,
              name: 'Dr. New',
            }),
          };
        }
        return { ok: false };
      };

      let insertCalled = false;
      const mockEnv = {
        DB: {
          prepare: (query) => ({
            bind: (...args) => ({
              first: async () => {
                if (query.includes('FROM users WHERE email = ?')) {
                  return null;
                }
                return null;
              },
              run: async () => {
                if (query.includes('INSERT INTO users')) {
                  insertCalled = true;
                }
                return { meta: { changes: 1 } };
              },
            }),
          }),
        },
        JWT_SECRET: 'test-secret',
      };

      const res = await app.request('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: 'valid-google-token' }),
      }, mockEnv);

      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.error, 'ACCOUNT_NOT_REGISTERED');
      assert.equal(data.action, 'REGISTER');
      assert.equal(insertCalled, false, 'Should not insert user into DB on login mode when unregsitered');
    });

    it('returns 409 ACCOUNT_ALREADY_EXISTS when user exists and mode is register', async () => {
      globalThis.fetch = async (url) => {
        if (url.includes('googleapis.com/tokeninfo')) {
          return {
            ok: true,
            json: async () => ({
              email: 'existingdoc@example.com',
              email_verified: true,
              name: 'Dr. Existing',
            }),
          };
        }
        return { ok: false };
      };

      const mockEnv = {
        DB: {
          prepare: (query) => ({
            bind: (...args) => ({
              first: async () => {
                if (query.includes('FROM users WHERE email = ?')) {
                  return { id: 'u-1', email: 'existingdoc@example.com', status: 'approved' };
                }
                return null;
              },
              run: async () => ({ meta: { changes: 1 } }),
            }),
          }),
        },
        JWT_SECRET: 'test-secret',
      };

      const executionCtx = { waitUntil: (p) => Promise.resolve(p) };
      const res = await app.request('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: 'valid-google-token', mode: 'register' }),
      }, mockEnv, executionCtx);

      assert.equal(res.status, 409);
      const data = await res.json();
      assert.equal(data.error, 'ACCOUNT_ALREADY_EXISTS');
      assert.equal(data.action, 'LOGIN');
    });

    it('registers a new user with pending status when user does not exist and mode is register', async () => {
      globalThis.fetch = async (url) => {
        if (url.includes('googleapis.com/tokeninfo')) {
          return {
            ok: true,
            json: async () => ({
              email: 'registerdoc@example.com',
              email_verified: true,
              name: 'Dr. Register',
            }),
          };
        }
        return { ok: false };
      };

      let insertedStatus = null;
      const mockEnv = {
        DB: {
          prepare: (query) => ({
            bind: (...args) => ({
              first: async () => null,
              run: async () => {
                if (query.includes('INSERT INTO users')) {
                  // args[4] is status
                  insertedStatus = args[4];
                }
                return { meta: { changes: 1 } };
              },
            }),
          }),
        },
        JWT_SECRET: 'test-secret',
      };

      const executionCtx = { waitUntil: (p) => Promise.resolve(p) };
      const res = await app.request('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: 'valid-google-token', mode: 'register' }),
      }, mockEnv, executionCtx);

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.status, 'pending');
      assert.equal(insertedStatus, 'pending');
    });

    it('logs in existing approved user when mode is login', async () => {
      globalThis.fetch = async (url) => {
        if (url.includes('googleapis.com/tokeninfo')) {
          return {
            ok: true,
            json: async () => ({
              email: 'approveddoc@example.com',
              email_verified: true,
              name: 'Dr. Approved',
            }),
          };
        }
        return { ok: false };
      };

      const mockEnv = {
        DB: {
          prepare: (query) => ({
            bind: (...args) => ({
              first: async () => ({
                id: 'u-app',
                name: 'Dr. Approved',
                email: 'approveddoc@example.com',
                status: 'approved',
                createdAt: 1000,
              }),
              run: async () => ({ meta: { changes: 1 } }),
            }),
          }),
        },
        JWT_SECRET: 'test-secret',
      };

      const res = await app.request('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: 'valid-google-token', mode: 'login' }),
      }, mockEnv);

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.user.id, 'u-app');
      assert.ok(data.token);
    });
  });

  describe('POST /api/auth/forgot-password/send-otp', () => {
    it('returns 400 RECAPTCHA_REQUIRED when secret is configured but recaptchaToken is omitted', async () => {
      const mockEnv = {
        RECAPTCHA_SECRET_KEY: 'test-recaptcha-secret',
        DB: {
          prepare: () => ({
            bind: () => ({
              first: async () => null,
              run: async () => ({ meta: { changes: 1 } }),
            }),
          }),
        },
      };

      const res = await app.request('/api/auth/forgot-password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'dr@example.com' }),
      }, mockEnv);

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'RECAPTCHA_REQUIRED');
    });

    it('returns 403 RECAPTCHA_FAILED when recaptcha validation fails', async () => {
      globalThis.fetch = async (url) => {
        if (url.includes('recaptcha/api/siteverify')) {
          return {
            ok: true,
            json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }),
          };
        }
        return { ok: false };
      };

      const mockEnv = {
        RECAPTCHA_SECRET_KEY: 'test-recaptcha-secret',
        DB: {
          prepare: () => ({
            bind: () => ({
              first: async () => null,
              run: async () => ({ meta: { changes: 1 } }),
            }),
          }),
        },
      };

      const res = await app.request('/api/auth/forgot-password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'dr@example.com', recaptchaToken: 'bad-token' }),
      }, mockEnv);

      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.error, 'RECAPTCHA_FAILED');
    });
  });

  describe('POST /api/auth/register/send-otp', () => {
    it('returns 400 when recaptchaToken is missing and secret is configured', async () => {
      const mockEnv = {
        RECAPTCHA_SECRET_KEY: 'test-recaptcha-secret',
        DB: {
          prepare: () => ({
            bind: () => ({
              first: async () => null,
              run: async () => ({ meta: { changes: 1 } }),
            }),
          }),
        },
      };

      const res = await app.request('/api/auth/register/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Dr. Test',
          email: 'validemail@example.com',
          password: 'Password123!',
        }),
      }, mockEnv);

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.match(data.message, /Security check failed/i);
    });

    it('returns 403 when recaptcha fails and secret is configured', async () => {
      globalThis.fetch = async (url) => {
        if (url.includes('recaptcha/api/siteverify')) {
          return {
            ok: true,
            json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }),
          };
        }
        return { ok: false };
      };

      const mockEnv = {
        RECAPTCHA_SECRET_KEY: 'test-recaptcha-secret',
        DB: {
          prepare: () => ({
            bind: () => ({
              first: async () => null,
              run: async () => ({ meta: { changes: 1 } }),
            }),
          }),
        },
      };

      const res = await app.request('/api/auth/register/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Dr. Test',
          email: 'validemail@example.com',
          password: 'Password123!',
          recaptchaToken: 'failed-token',
        }),
      }, mockEnv);

      assert.equal(res.status, 403);
      const data = await res.json();
      assert.match(data.message, /Security verification failed/i);
    });
  });
});

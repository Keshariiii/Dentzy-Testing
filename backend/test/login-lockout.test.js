import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkRateLimit, recordRateLimitAttempt, clearRateLimit, getClientIP } from '../src/utils/rateLimit.js';

describe('Rate Limit Anti-Lockout Helpers', () => {
  it('checkRateLimit with recordOnCheck=false does not insert attempt', async () => {
    let inserted = false;
    const mockDb = {
      batch: async () => [null, { results: [{ cnt: 0 }] }],
      prepare: () => ({
        bind: () => ({
          run: async () => { inserted = true; },
        }),
      }),
    };

    const res = await checkRateLimit(mockDb, 'test-key', { windowMs: 60000, max: 5, recordOnCheck: false });
    assert.strictEqual(res.allowed, true);
    assert.strictEqual(inserted, false);
  });

  it('checkRateLimit with recordOnCheck=true inserts attempt', async () => {
    let inserted = false;
    const mockDb = {
      batch: async () => [null, { results: [{ cnt: 0 }] }],
      prepare: () => ({
        bind: () => ({
          run: async () => { inserted = true; },
        }),
      }),
    };

    const res = await checkRateLimit(mockDb, 'test-key', { windowMs: 60000, max: 5, recordOnCheck: true });
    assert.strictEqual(res.allowed, true);
    assert.strictEqual(inserted, true);
  });

  it('getClientIP prioritizes cf-connecting-ip and ignores x-forwarded-for in production', () => {
    const mockContext = {
      req: {
        header: (name) => {
          if (name === 'cf-connecting-ip') return '203.0.113.195';
          if (name === 'x-forwarded-for') return '1.2.3.4';
          return null;
        },
      },
      env: { NODE_ENV: 'production' },
    };

    const ip = getClientIP(mockContext);
    assert.strictEqual(ip, '203.0.113.195');
  });

  it('getClientIP rejects x-forwarded-for when cf-connecting-ip is missing in production', () => {
    const mockContext = {
      req: {
        header: (name) => {
          if (name === 'x-forwarded-for') return '198.51.100.99';
          return null;
        },
      },
      env: { NODE_ENV: 'production' },
    };

    const ip = getClientIP(mockContext);
    assert.strictEqual(ip, 'unknown-ip');
  });
});

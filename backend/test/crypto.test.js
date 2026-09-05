import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword, comparePassword,
  signJWT, verifyJWT,
  createCaptchaToken, verifyCaptchaToken,
  createOtpToken, verifyOtpToken,
  createResetToken, verifyResetToken,
  generateSecureOtp,
} from '../src/utils/crypto.js';

const SECRET = 'test-secret-key-for-dentzy-testing';

// ── Password Hashing ────────────────────────────────────────────────────────

describe('hashPassword / comparePassword', () => {
  it('hashes a password and verifies it correctly', async () => {
    const hash = await hashPassword('MyP@ss1234');
    assert.notEqual(hash, 'MyP@ss1234', 'hash should not equal plaintext');
    assert.ok(await comparePassword('MyP@ss1234', hash));
  });

  it('rejects wrong password', async () => {
    const hash = await hashPassword('Correct1!');
    assert.ok(!(await comparePassword('Wrong1!xx', hash)));
  });

  it('produces different hashes for same input (salt)', async () => {
    const h1 = await hashPassword('Same1!pass');
    const h2 = await hashPassword('Same1!pass');
    assert.notEqual(h1, h2);
  });
});

// ── JWT ─────────────────────────────────────────────────────────────────────

describe('signJWT / verifyJWT', () => {
  it('signs and verifies a token', async () => {
    const token = await signJWT({ id: 'user-1' }, SECRET, '1h');
    assert.ok(typeof token === 'string');
    const payload = await verifyJWT(token, SECRET);
    assert.equal(payload.id, 'user-1');
  });

  it('rejects token signed with a different secret', async () => {
    const token = await signJWT({ id: 'user-2' }, SECRET, '1h');
    await assert.rejects(() => verifyJWT(token, 'wrong-secret'));
  });

  it('rejects expired token', async () => {
    const token = await signJWT({ id: 'user-3' }, SECRET, '0s');
    // Wait a tick so the token expires
    await new Promise(r => setTimeout(r, 1100));
    await assert.rejects(() => verifyJWT(token, SECRET));
  });
});

// ── CAPTCHA HMAC Token ──────────────────────────────────────────────────────

describe('createCaptchaToken / verifyCaptchaToken', () => {
  it('creates and verifies a valid CAPTCHA', async () => {
    const token = await createCaptchaToken('ABC123', SECRET);
    const result = await verifyCaptchaToken(token, 'abc123', SECRET);
    assert.ok(result.valid);
  });

  it('rejects wrong CAPTCHA input', async () => {
    const token = await createCaptchaToken('XYZ789', SECRET);
    const result = await verifyCaptchaToken(token, 'WRONG1', SECRET);
    assert.ok(!result.valid);
    assert.ok(result.message.includes('Incorrect'));
  });

  it('rejects tampered token', async () => {
    const token = await createCaptchaToken('TEST99', SECRET);
    const tampered = token.slice(0, -4) + 'xxxx';
    const result = await verifyCaptchaToken(tampered, 'TEST99', SECRET);
    assert.ok(!result.valid);
  });

  it('rejects missing input', async () => {
    const token = await createCaptchaToken('CODE', SECRET);
    const result = await verifyCaptchaToken(token, '', SECRET);
    assert.ok(!result.valid);
  });
});

// ── OTP HMAC Token ──────────────────────────────────────────────────────────

describe('createOtpToken / verifyOtpToken', () => {
  it('creates and verifies a valid OTP', async () => {
    const token = await createOtpToken('test@example.com', '123456', SECRET);
    const result = await verifyOtpToken(token, 'test@example.com', '123456', SECRET);
    assert.ok(result.valid);
  });

  it('rejects wrong OTP code', async () => {
    const token = await createOtpToken('test@example.com', '123456', SECRET);
    const result = await verifyOtpToken(token, 'test@example.com', '999999', SECRET);
    assert.ok(!result.valid);
    assert.ok(result.message.includes('Invalid'));
  });

  it('rejects mismatched email', async () => {
    const token = await createOtpToken('a@b.com', '123456', SECRET);
    const result = await verifyOtpToken(token, 'other@b.com', '123456', SECRET);
    assert.ok(!result.valid);
    assert.ok(result.message.includes('does not match'));
  });

  it('rejects missing params', async () => {
    const result = await verifyOtpToken('', '', '', SECRET);
    assert.ok(!result.valid);
  });
});

// ── Password Reset Token ────────────────────────────────────────────────────

describe('createResetToken / verifyResetToken', () => {
  it('creates and verifies a reset token', async () => {
    const token = await createResetToken('user@dentzy.com', SECRET);
    const result = await verifyResetToken(token, SECRET);
    assert.ok(result.valid);
    assert.equal(result.email, 'user@dentzy.com');
  });

  it('rejects token with wrong secret', async () => {
    const token = await createResetToken('user@dentzy.com', SECRET);
    const result = await verifyResetToken(token, 'wrong-key');
    assert.ok(!result.valid);
  });
});

// ── Secure OTP Generator ────────────────────────────────────────────────────

describe('generateSecureOtp', () => {
  it('returns a 6-digit numeric string', () => {
    const otp = generateSecureOtp();
    assert.equal(otp.length, 6);
    assert.match(otp, /^\d{6}$/);
  });

  it('is within valid range', () => {
    for (let i = 0; i < 20; i++) {
      const n = parseInt(generateSecureOtp(), 10);
      assert.ok(n >= 100000 && n <= 999999, `OTP ${n} out of range`);
    }
  });

  it('produces diverse values', () => {
    const set = new Set(Array.from({ length: 10 }, () => generateSecureOtp()));
    assert.ok(set.size > 1, 'all OTPs identical');
  });
});

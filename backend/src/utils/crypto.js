// ponytail: bcryptjs works on Workers with nodejs_compat. No custom PBKDF2 needed.
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

// ── Secure random OTP ───────────────────────────────────────────────────────
// ponytail: rejection sampling, no modulo bias for 6-digit range
export function generateSecureOtp(length = 6) {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  const range = max - min + 1;
  const arr = new Uint32Array(1);
  let val;
  do {
    crypto.getRandomValues(arr);
    val = arr[0] >>> 0;
  } while (val >= Math.floor(0x100000000 / range) * range);
  return String(min + (val % range));
}

// ── Password hashing ────────────────────────────────────────────────────────
export const hashPassword = (plain) => bcrypt.hash(plain, 10);
export const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);
export const passwordVersion = (hash) => (typeof hash === 'string' && hash.length >= 10 ? hash.slice(-10) : '');

function timingSafeEqualStr(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ── JWT ──────────────────────────────────────────────────────────────────────
const enc = new TextEncoder();

export const signJWT = (payload, secret, expiresIn = '7d') =>
  new SignJWT({ jti: crypto.randomUUID(), ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(enc.encode(secret));

export const verifyJWT = async (token, secret) => {
  const { payload } = await jwtVerify(token, enc.encode(secret), { algorithms: ['HS256'] });
  return payload;
};

export const verifyJWTRaw = async (token, secret) => {
  const { payload } = await jwtVerify(token, enc.encode(secret), { algorithms: ['HS256'] });
  return payload;
};

// ── CAPTCHA HMAC (Web Crypto) ────────────────────────────────────────────────
async function hmacSHA256(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function consumeOneTimeToken(db, hmac, expiresAtMs, label) {
  if (!db) return { valid: true };
  const usedKey = `used_token:${hmac}`;
  const alreadyUsed = await db.prepare('SELECT key FROM rate_limits WHERE key = ? LIMIT 1')
    .bind(usedKey).first();
  if (alreadyUsed) {
    return { valid: false, message: `${label} already used. Please request a new one.` };
  }
  await db.prepare('INSERT INTO rate_limits (key, ts) VALUES (?, ?)').bind(usedKey, expiresAtMs).run();
  return { valid: true };
}

export const createCaptchaToken = async (text, secret) => {
  const expiresAt = Date.now() + 5 * 60 * 1000;
  const payload = `${text.toUpperCase()}:${expiresAt}`;
  const hmac = await hmacSHA256(secret, payload);
  return `${payload}:${hmac}`;
};

export const verifyCaptchaToken = async (token, userInput, secret, db = null) => {
  if (!token || !userInput)
    return { valid: false, message: 'CAPTCHA code is required.' };

  const parts = token.split(':');
  if (parts.length !== 3)
    return { valid: false, message: 'Invalid CAPTCHA. Please refresh and try again.' };

  const [expectedCode, expiresAtStr, hmac] = parts;
  const expiresAtMs = parseInt(expiresAtStr, 10);
  if (Date.now() > expiresAtMs)
    return { valid: false, message: 'CAPTCHA expired. Please refresh and try again.' };

  const expectedHmac = await hmacSHA256(secret, `${expectedCode}:${expiresAtStr}`);
  if (!timingSafeEqualStr(hmac, expectedHmac))
    return { valid: false, message: 'CAPTCHA security check failed. Please refresh.' };

  if (userInput.trim().toUpperCase() !== expectedCode)
    return { valid: false, message: 'Incorrect CAPTCHA code. Please try again.' };

  return consumeOneTimeToken(db, hmac, expiresAtMs, 'CAPTCHA');
};

// ── Email OTP Token (HMAC-SHA256, 5 min expiry) ─────────────────────────────
export const createOtpToken = async (email, otp, secret) => {
  const expiresAt = Date.now() + 5 * 60 * 1000;
  const payload = `${email.toLowerCase().trim()}:${otp}:${expiresAt}`;
  const hmac = await hmacSHA256(secret, payload);
  return `${payload}:${hmac}`;
};

export const verifyOtpToken = async (token, userEmail, userOtp, secret, db = null) => {
  if (!token || !userEmail || !userOtp)
    return { valid: false, message: 'Email and 6-digit OTP code are required.' };

  const parts = token.split(':');
  if (parts.length !== 4)
    return { valid: false, message: 'Invalid or malformed OTP token. Please request a new code.' };

  const [storedEmail, expectedOtp, expiresAtStr, hmac] = parts;
  const expiresAtMs = parseInt(expiresAtStr, 10);

  if (storedEmail !== userEmail.toLowerCase().trim())
    return { valid: false, message: 'Email does not match OTP request. Please request a new code.' };

  if (Date.now() > expiresAtMs)
    return { valid: false, message: 'Verification code has expired. Please request a new one.' };

  const expectedHmac = await hmacSHA256(secret, `${storedEmail}:${expectedOtp}:${expiresAtStr}`);
  if (!timingSafeEqualStr(hmac, expectedHmac))
    return { valid: false, message: 'Security check failed. Please request a new code.' };

  if (userOtp.trim() !== expectedOtp)
    return { valid: false, message: 'Invalid verification code. Please check your email and try again.' };

  return consumeOneTimeToken(db, hmac, expiresAtMs, 'Verification code');
};

// ── Password Reset JWT Token (15 min expiry) ────────────────────────────────
export const createResetToken = (email, pwSuffix, secret) =>
  signJWT({ email: email.toLowerCase().trim(), purpose: 'password-reset', ps: pwSuffix }, secret, '15m');

export const verifyResetToken = async (token, secret) => {
  try {
    const payload = await verifyJWT(token, secret);
    if (payload.purpose !== 'password-reset' || !payload.email) {
      return { valid: false, message: 'Invalid reset session.' };
    }
    return { valid: true, email: payload.email };
  } catch {
    return { valid: false, message: 'Reset session expired. Please start over.' };
  }
};

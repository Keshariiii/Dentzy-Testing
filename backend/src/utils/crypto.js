// ponytail: bcryptjs works on Workers with nodejs_compat. No custom PBKDF2 needed.
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

// ── Password hashing ────────────────────────────────────────────────────────
export const hashPassword = (plain) => bcrypt.hash(plain, 10);
export const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);

// ── JWT ──────────────────────────────────────────────────────────────────────
const enc = new TextEncoder();

export const signJWT = (payload, secret, expiresIn = '7d') =>
  new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(enc.encode(secret));

export const verifyJWT = async (token, secret) => {
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

export const createCaptchaToken = async (text, secret) => {
  const expiresAt = Date.now() + 5 * 60 * 1000;
  const payload = `${text.toUpperCase()}:${expiresAt}`;
  const hmac = await hmacSHA256(secret, payload);
  return `${payload}:${hmac}`;
};

export const verifyCaptchaToken = async (token, userInput, secret) => {
  if (!token || !userInput)
    return { valid: false, message: 'CAPTCHA code is required.' };

  const parts = token.split(':');
  if (parts.length !== 3)
    return { valid: false, message: 'Invalid CAPTCHA. Please refresh and try again.' };

  const [expectedCode, expiresAtStr, hmac] = parts;
  if (Date.now() > parseInt(expiresAtStr, 10))
    return { valid: false, message: 'CAPTCHA expired. Please refresh and try again.' };

  const expectedHmac = await hmacSHA256(secret, `${expectedCode}:${expiresAtStr}`);
  if (hmac !== expectedHmac)
    return { valid: false, message: 'CAPTCHA security check failed. Please refresh.' };

  if (userInput.trim().toUpperCase() !== expectedCode)
    return { valid: false, message: 'Incorrect CAPTCHA code. Please try again.' };

  return { valid: true };
};

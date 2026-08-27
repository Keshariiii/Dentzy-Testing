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

// ── Email OTP Token (HMAC-SHA256, 5 min expiry) ─────────────────────────────
export const createOtpToken = async (email, otp, secret) => {
  const expiresAt = Date.now() + 5 * 60 * 1000;
  const payload = `${email.toLowerCase().trim()}:${otp}:${expiresAt}`;
  const hmac = await hmacSHA256(secret, payload);
  return `${payload}:${hmac}`;
};

export const verifyOtpToken = async (token, userEmail, userOtp, secret) => {
  if (!token || !userEmail || !userOtp)
    return { valid: false, message: 'Email and 6-digit OTP code are required.' };

  const parts = token.split(':');
  if (parts.length !== 4)
    return { valid: false, message: 'Invalid or malformed OTP token. Please request a new code.' };

  const [storedEmail, expectedOtp, expiresAtStr, hmac] = parts;

  if (storedEmail !== userEmail.toLowerCase().trim())
    return { valid: false, message: 'Email does not match OTP request. Please request a new code.' };

  if (Date.now() > parseInt(expiresAtStr, 10))
    return { valid: false, message: 'Verification code has expired. Please request a new one.' };

  const expectedHmac = await hmacSHA256(secret, `${storedEmail}:${expectedOtp}:${expiresAtStr}`);
  if (hmac !== expectedHmac)
    return { valid: false, message: 'Security check failed. Please request a new code.' };

  if (userOtp.trim() !== expectedOtp)
    return { valid: false, message: 'Invalid verification code. Please check your email and try again.' };

  return { valid: true };
};

// ── Password Reset JWT Token (15 min expiry) ────────────────────────────────
export const createResetToken = (email, secret) =>
  signJWT({ email: email.toLowerCase().trim(), purpose: 'password-reset' }, secret, '15m');

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


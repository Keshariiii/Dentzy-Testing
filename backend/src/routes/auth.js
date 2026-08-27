import { Hono } from 'hono';
import { validate } from '../middleware/validate.js';
import { verifyUser } from '../middleware/auth.js';
import { registerSchema, loginSchema, sendOtpSchema, verifyOtpSchema, resetPasswordWithOtpSchema, updateProfileSchema, changePasswordSchema, deleteAccountSchema } from '../validators/auth.js';
import { hashPassword, comparePassword, signJWT, createCaptchaToken, verifyCaptchaToken, createOtpToken, verifyOtpToken, createResetToken, verifyResetToken } from '../utils/crypto.js';
import { generateCode, generateCaptchaSVG } from '../utils/captcha.js';
import { sendOtpEmail } from '../utils/email.js';
import { newId, now } from '../utils/id.js';
import logger, { auditLog } from '../utils/logger.js';

const auth = new Hono();

// ── Cookie helpers ───────────────────────────────────────────────────────────
const isProd = () => true; // Workers are always "production" edge
const cookieHeader = (name, value, maxAge) => {
  const parts = [`${name}=${value}`, 'HttpOnly', 'Path=/', `Max-Age=${Math.floor(maxAge / 1000)}`, 'SameSite=None', 'Secure'];
  return parts.join('; ');
};
const clearCookieHeader = (name) => `${name}=; HttpOnly; Path=/; Max-Age=0; SameSite=None; Secure`;

const safeUserObj = (u) => ({
  id: u.id, name: u.name, email: u.email,
  dob: u.dob || null, phone: u.phone || '', clinicName: u.clinicName || '', address: u.address || '',
  createdAt: u.createdAt,
});

// GET /api/auth/captcha
auth.get('/captcha', async (c) => {
  try {
    const code = generateCode(6);
    const captchaSvg = generateCaptchaSVG(code);
    const captchaToken = await createCaptchaToken(code, c.env.JWT_SECRET);
    return c.json({ captchaToken, captchaSvg });
  } catch (err) {
    logger.error('CAPTCHA generation error', { error: err.message });
    return c.json({ message: 'Failed to generate CAPTCHA.' }, 500);
  }
});

// POST /api/auth/register
auth.post('/register', validate(registerSchema), async (c) => {
  const { name, email, password, captchaInput, captchaToken } = c.get('body');

  const captchaResult = await verifyCaptchaToken(captchaToken, captchaInput, c.env.JWT_SECRET);
  if (!captchaResult.valid)
    return c.json({ message: captchaResult.message, invalidCaptcha: true }, 400);

  try {
    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing)
      return c.json({ message: 'This email is already registered. Please log in instead.', action: 'LOGIN' }, 409);

    const id = newId();
    const ts = now();
    const hashed = await hashPassword(password);
    await c.env.DB.prepare(
      'INSERT INTO users (id, name, email, password, status, adminNote, dob, phone, clinicName, address, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, name, email, hashed, 'pending', '', null, '', '', '', ts, ts).run();

    auditLog('USER_REGISTERED', { userId: id, status: 'pending' });

    return c.json({
      pending: true,
      message: 'Your registration request has been submitted! Please wait for admin approval before logging in.',
      user: { id, name, email },
    }, 201);
  } catch (error) {
    logger.error('Register error', { error: error.message });
    return c.json({ message: 'Server error during registration. Please try again.' }, 500);
  }
});

// POST /api/auth/login
auth.post('/login', validate(loginSchema), async (c) => {
  const { email, password } = c.get('body');

  try {
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    if (!user)
      return c.json({ message: 'No account found with this email. Please register first.', action: 'REGISTER' }, 401);

    if (user.status === 'pending')
      return c.json({ message: 'Your account is awaiting admin approval.', status: 'pending' }, 403);
    if (user.status === 'rejected')
      return c.json({ message: 'Your registration request was not approved. Please contact support.', status: 'rejected' }, 403);

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch)
      return c.json({ message: 'Incorrect password. Please try again.' }, 401);

    const token = await signJWT({ id: user.id }, c.env.JWT_SECRET, '7d');

    auditLog('USER_LOGIN', { userId: user.id });

    c.header('Set-Cookie', cookieHeader('dentzy_jwt', token, 7 * 24 * 60 * 60 * 1000));
    return c.json({ user: safeUserObj(user), token });
  } catch (error) {
    logger.error('Login error', { error: error.message });
    return c.json({ message: 'Server error during login. Please try again.' }, 500);
  }
});

// GET /api/auth/me
auth.get('/me', verifyUser(), (c) => c.json({ user: c.get('user') }));

// POST /api/auth/logout
auth.post('/logout', (c) => {
  c.header('Set-Cookie', clearCookieHeader('dentzy_jwt'));
  return c.json({ message: 'Logged out successfully.' });
});

// POST /api/auth/forgot-password/send-otp
auth.post('/forgot-password/send-otp', validate(sendOtpSchema), async (c) => {
  const { email } = c.get('body');

  try {
    const user = await c.env.DB.prepare('SELECT id, name, email, status FROM users WHERE email = ?').bind(email).first();
    
    // If no user exists, return generic success to prevent email enumeration
    if (!user) {
      return c.json({
        success: true,
        message: 'If an account exists with this email, a 6-digit verification code has been sent.',
        expiresIn: 300,
      });
    }

    if (user.status === 'pending') {
      return c.json({ message: 'Your account is still awaiting admin approval.' }, 403);
    }
    if (user.status === 'rejected') {
      return c.json({ message: 'Your account was not approved. Please contact support.' }, 403);
    }

    // Generate random 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpToken = await createOtpToken(user.email, otp, c.env.JWT_SECRET);

    // Send email via Brevo
    const emailRes = await sendOtpEmail({
      apiKey: c.env.BREVO_API_KEY,
      senderEmail: c.env.BREVO_SENDER_EMAIL,
      to: user.email,
      name: user.name || 'Dentist',
      otp,
    });

    if (!emailRes.success) {
      logger.error('Failed to dispatch OTP email', { error: emailRes.error, status: emailRes.status, email: user.email });
      return c.json({ message: 'Failed to send verification code. Please try again later.' }, 500);
    }

    auditLog('OTP_SENT', { userId: user.id, email: user.email });

    return c.json({
      success: true,
      message: 'Verification code sent to your email.',
      otpToken,
      expiresIn: 300,
    });
  } catch (error) {
    logger.error('Send OTP error', { error: error.message });
    return c.json({ message: 'Failed to send verification code. Please try again.' }, 500);
  }
});

// POST /api/auth/forgot-password/verify-otp
auth.post('/forgot-password/verify-otp', validate(verifyOtpSchema), async (c) => {
  const { email, otp, otpToken } = c.get('body');

  try {
    const check = await verifyOtpToken(otpToken, email, otp, c.env.JWT_SECRET);
    if (!check.valid) {
      return c.json({ message: check.message }, 400);
    }

    const resetToken = await createResetToken(email, c.env.JWT_SECRET);
    auditLog('OTP_VERIFIED', { email });

    return c.json({
      success: true,
      resetToken,
      message: 'Verification code confirmed. You can now set a new password.',
    });
  } catch (error) {
    logger.error('Verify OTP error', { error: error.message });
    return c.json({ message: 'Verification failed. Please try again.' }, 500);
  }
});

// POST /api/auth/forgot-password/reset
auth.post('/forgot-password/reset', validate(resetPasswordWithOtpSchema), async (c) => {
  const { resetToken, password } = c.get('body');

  try {
    const check = await verifyResetToken(resetToken, c.env.JWT_SECRET);
    if (!check.valid) {
      return c.json({ message: check.message }, 400);
    }

    const user = await c.env.DB.prepare('SELECT id, status FROM users WHERE email = ?').bind(check.email).first();
    if (!user) return c.json({ message: 'User not found.' }, 404);

    const hashed = await hashPassword(password);
    await c.env.DB.prepare('UPDATE users SET password = ?, updatedAt = ? WHERE id = ?').bind(hashed, now(), user.id).run();

    auditLog('PASSWORD_RESET_VIA_OTP', { userId: user.id, email: check.email });

    return c.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    logger.error('Reset password error', { error: error.message });
    return c.json({ message: 'Failed to reset password. Please try again.' }, 500);
  }
});

// PUT /api/auth/profile
auth.put('/profile', verifyUser(), validate(updateProfileSchema), async (c) => {
  const body = c.get('body');
  const user = c.get('user');

  const sets = [];
  const vals = [];

  if (body.name !== undefined && body.name.trim().length >= 2) { sets.push('name = ?'); vals.push(body.name.trim()); }

  if (body.dob !== undefined && body.dob !== null && body.dob !== '') {
    const parsed = new Date(body.dob);
    if (isNaN(parsed.getTime())) return c.json({ message: 'Please enter a valid date of birth.' }, 400);
    if (parsed > new Date()) return c.json({ message: 'Date of birth cannot be in the future.' }, 400);
    sets.push('dob = ?'); vals.push(parsed.toISOString());
  } else if (body.dob === null || body.dob === '') {
    sets.push('dob = ?'); vals.push(null);
  }

  if (body.phone !== undefined) {
    const trimmed = body.phone.trim();
    if (trimmed.length > 0 && trimmed.length < 7) return c.json({ message: 'Phone number is too short.' }, 400);
    sets.push('phone = ?'); vals.push(trimmed);
  }
  if (body.clinicName !== undefined) { sets.push('clinicName = ?'); vals.push(body.clinicName.trim()); }
  if (body.address !== undefined) { sets.push('address = ?'); vals.push(body.address.trim()); }

  if (sets.length === 0) return c.json({ message: 'No changes provided.' }, 400);

  sets.push('updatedAt = ?'); vals.push(now());
  vals.push(user.id);

  try {
    await c.env.DB.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
    const updated = await c.env.DB.prepare(
      'SELECT id, name, email, dob, phone, clinicName, address, createdAt FROM users WHERE id = ?'
    ).bind(user.id).first();

    auditLog('PROFILE_UPDATED', { userId: user.id });
    return c.json({ message: 'Profile updated successfully.', user: safeUserObj(updated) });
  } catch (error) {
    logger.error('Profile update error', { error: error.message });
    return c.json({ message: 'Failed to update profile. Please try again.' }, 500);
  }
});

// PUT /api/auth/change-password
auth.put('/change-password', verifyUser(), validate(changePasswordSchema), async (c) => {
  const { currentPassword, newPassword } = c.get('body');
  const user = c.get('user');

  try {
    const full = await c.env.DB.prepare('SELECT password FROM users WHERE id = ?').bind(user.id).first();
    if (!full) return c.json({ message: 'User not found.' }, 404);

    const isMatch = await comparePassword(currentPassword, full.password);
    if (!isMatch) return c.json({ message: 'Current password is incorrect.' }, 401);
    if (currentPassword === newPassword) return c.json({ message: 'New password must be different from your current password.' }, 400);

    const hashed = await hashPassword(newPassword);
    await c.env.DB.prepare('UPDATE users SET password = ?, updatedAt = ? WHERE id = ?').bind(hashed, now(), user.id).run();

    auditLog('PASSWORD_CHANGED', { userId: user.id });
    return c.json({ message: 'Password changed successfully.' });
  } catch (error) {
    logger.error('Change-password error', { error: error.message });
    return c.json({ message: 'Failed to change password. Please try again.' }, 500);
  }
});

// DELETE /api/auth/profile
auth.delete('/profile', verifyUser(), validate(deleteAccountSchema), async (c) => {
  const { password } = c.get('body');
  const user = c.get('user');

  try {
    const full = await c.env.DB.prepare('SELECT password FROM users WHERE id = ?').bind(user.id).first();
    if (!full) return c.json({ message: 'User not found.' }, 404);

    const isMatch = await comparePassword(password, full.password);
    if (!isMatch) return c.json({ message: 'Incorrect password. Account deletion cancelled.' }, 401);

    // D1 FK CASCADE handles lab_orders and payments deletion automatically
    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id).run();

    auditLog('ACCOUNT_DELETED', { userId: user.id });
    return c.json({ message: 'Your account and all associated data have been permanently deleted.' });
  } catch (error) {
    logger.error('Delete-account error', { error: error.message });
    return c.json({ message: 'Failed to delete account. Please try again.' }, 500);
  }
});

export default auth;

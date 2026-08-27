import jwt from 'jsonwebtoken';
import User from '../models/Dentist.js';
import LabOrder from '../models/LabOrder.js';
import Payment from '../models/Payment.js';
import logger, { auditLog } from '../utils/logger.js';
import { broadcastToAdmin } from './adminController.js';
import { verifyCaptchaToken, generateCode, generateCaptchaSVG, createCaptchaToken } from '../utils/captcha.js';

// ─── Helper: cookie options ──────────────────────────────────────────────────
const isProd = process.env.NODE_ENV === 'production';
export const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure:   isProd,
  sameSite: isProd ? 'none' : 'lax',
  maxAge,
  path: '/',
});

// ─── Helper: build a safe user object for API responses ─────────────────────
// Every endpoint that returns user data MUST use this function
// to guarantee the frontend always receives the complete profile.
const safeUserObj = (user) => ({
  id:         user._id,
  name:       user.name,
  email:      user.email,
  dob:        user.dob        || null,
  phone:      user.phone      || '',
  clinicName: user.clinicName || '',
  address:    user.address    || '',
  createdAt:  user.createdAt,
});

// ─── GET /api/auth/captcha ────────────────────────────────────────────────────
export const getCaptcha = (req, res) => {
  try {
    const code         = generateCode(6);
    const captchaSvg   = generateCaptchaSVG(code);
    const captchaToken = createCaptchaToken(code);
    return res.json({ captchaToken, captchaSvg });
  } catch (err) {
    logger.error('CAPTCHA generation error', { error: err.message });
    return res.status(500).json({ message: 'Failed to generate CAPTCHA.' });
  }
};

// ─── POST /api/auth/register ─────────────────────────────────────────────────
// Body is pre-validated by Zod (registerSchema)
export const register = async (req, res) => {
  const { name, email, password, captchaInput, captchaToken } = req.body;

  // CAPTCHA verification (Zod ensures fields exist, we verify the token)
  const captchaResult = verifyCaptchaToken(captchaToken, captchaInput);
  if (!captchaResult.valid) {
    return res.status(400).json({ message: captchaResult.message, invalidCaptcha: true });
  }

  try {
    // Check if email already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: 'This email is already registered. Please log in instead.',
        action: 'LOGIN',
      });
    }

    // Create user with status = 'pending' (admin must approve)
    const user = await User.create({ name, email, password, status: 'pending' });

    auditLog('USER_REGISTERED', { userId: user._id, status: 'pending' });

    // 🔔 Notify all connected admin clients in real time
    broadcastToAdmin('new-registration', {
      id:        user._id,
      name:      user.name,
      email:     user.email,
      createdAt: user.createdAt,
    });

    // Do NOT return a token — user must wait for admin approval
    return res.status(201).json({
      pending: true,
      message: 'Your registration request has been submitted! Please wait for admin approval before logging in.',
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'This email is already registered. Please log in instead.',
        action: 'LOGIN',
      });
    }
    logger.error('Register error', { error: error.message });
    return res.status(500).json({ message: 'Server error during registration. Please try again.' });
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
// Body is pre-validated by Zod (loginSchema)
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        message: 'No account found with this email. Please register first.',
        action: 'REGISTER',
      });
    }

    // Check account approval status
    if (user.status === 'pending') {
      return res.status(403).json({
        message: 'Your account is awaiting admin approval. You will be able to log in once approved.',
        status: 'pending',
      });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({
        message: 'Your registration request was not approved. Please contact support.',
        status: 'rejected',
      });
    }

    // Compare password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    auditLog('USER_LOGIN', { userId: user._id });

    // Set JWT as HttpOnly cookie
    res.cookie('dentzy_jwt', token, cookieOptions(7 * 24 * 60 * 60 * 1000));

    return res.json({
      user: safeUserObj(user),
      token,
    });
  } catch (error) {
    logger.error('Login error', { error: error.message });
    return res.status(500).json({ message: 'Server error during login. Please try again.' });
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
// Protected by verifyUser middleware — req.user is already populated
export const getMe = (req, res) => {
  return res.json({ user: req.user });
};

// ─── POST /api/auth/logout ───────────────────────────────────────────────────
export const logout = (req, res) => {
  res.clearCookie('dentzy_jwt', cookieOptions(0));
  return res.json({ message: 'Logged out successfully.' });
};

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
// Body is pre-validated by Zod (forgotPasswordSchema)
export const forgotPassword = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: 'No account found with this email address.',
      });
    }

    // Only approved accounts can change password directly
    if (user.status === 'pending') {
      return res.status(403).json({
        message: 'Your account is still awaiting admin approval. Please contact support.',
      });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({
        message: 'Your account was not approved. Please contact support.',
      });
    }

    // Update password (bcrypt-hashed automatically via pre('save') in User.js)
    user.password = password;
    await user.save();

    auditLog('PASSWORD_RESET', { userId: user._id });

    return res.status(200).json({
      message: 'Password changed successfully. You can now log in with your new password.',
    });

  } catch (error) {
    logger.error('Forgot-password error', { error: error.message });
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

// ─── PUT /api/auth/profile ───────────────────────────────────────────────────
// Body is pre-validated by Zod (updateProfileSchema)
export const updateProfile = async (req, res) => {
  const { name, phone, clinicName, address, dob } = req.body;

  // Build atomic $set — only include fields that were actually sent
  const updates = {};

  if (name !== undefined && name.trim().length >= 2) updates.name = name.trim();

  // Date of birth: validate if provided, allow clearing with null/''
  if (dob !== undefined && dob !== null && dob !== '') {
    const parsed = new Date(dob);
    if (isNaN(parsed.getTime())) {
      return res.status(400).json({ message: 'Please enter a valid date of birth.' });
    }
    if (parsed > new Date()) {
      return res.status(400).json({ message: 'Date of birth cannot be in the future.' });
    }
    updates.dob = parsed;
  } else if (dob === null || dob === '') {
    updates.dob = null;
  }

  if (phone !== undefined) {
    const trimmed = phone.trim();
    if (trimmed.length > 0 && trimmed.length < 7) {
      return res.status(400).json({ message: 'Phone number is too short.' });
    }
    updates.phone = trimmed;
  }
  if (clinicName !== undefined) updates.clinicName = clinicName.trim();
  if (address !== undefined)    updates.address = address.trim();

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'No changes provided.' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true },
    );
    if (!user) return res.status(404).json({ message: 'User not found.' });

    auditLog('PROFILE_UPDATED', { userId: user._id });

    return res.json({
      message: 'Profile updated successfully.',
      user: safeUserObj(user),
    });
  } catch (error) {
    logger.error('Profile update error', { error: error.message });
    return res.status(500).json({ message: 'Failed to update profile. Please try again.' });
  }
};

// ─── PUT /api/auth/change-password ───────────────────────────────────────────
// Body is pre-validated by Zod (changePasswordSchema)
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    // Need password field to compare — fetch with password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password must be different from your current password.' });
    }

    user.password = newPassword;
    await user.save();

    auditLog('PASSWORD_CHANGED', { userId: user._id });

    return res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    logger.error('Change-password error', { error: error.message });
    return res.status(500).json({ message: 'Failed to change password. Please try again.' });
  }
};

// ─── DELETE /api/auth/profile ─────────────────────────────────────────────────
// Body is pre-validated by Zod (deleteAccountSchema)
export const deleteAccount = async (req, res) => {
  const { password } = req.body;

  try {
    // Fetch with password for comparison
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password. Account deletion cancelled.' });
    }

    const userId = user._id;

    // Cascade delete all associated data
    await Promise.all([
      LabOrder.deleteMany({ owner: userId }),
      Payment.deleteMany({ owner: userId }),
    ]);

    await User.findByIdAndDelete(userId);

    auditLog('ACCOUNT_DELETED', { userId });

    return res.json({ message: 'Your account and all associated data have been permanently deleted.' });
  } catch (error) {
    logger.error('Delete-account error', { error: error.message });
    return res.status(500).json({ message: 'Failed to delete account. Please try again.' });
  }
};

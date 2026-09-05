import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Auth validators
import {
  registerSchema, loginSchema, sendOtpSchema, verifyOtpSchema,
  resetPasswordWithOtpSchema, updateProfileSchema, changePasswordSchema,
  deleteAccountSchema, verifyRegisterOtpSchema, resendRegisterOtpSchema,
} from '../src/validators/auth.js';

// Contact validators
import { submitContactSchema } from '../src/validators/contact.js';

// Admin validators
import {
  adminLoginSchema, rejectUserSchema,
  createOrderSchema as adminCreateOrderSchema,
  updateOrderStageSchema,
} from '../src/validators/admin.js';

// Dashboard validators
import {
  createOrderSchema, updateOrderSchema,
} from '../src/validators/dashboard.js';

// ── Helper ──────────────────────────────────────────────────────────────────

const valid = (schema, data) => { schema.parse(data); };
const invalid = (schema, data) => { assert.throws(() => schema.parse(data)); };

// ── Auth Schemas ────────────────────────────────────────────────────────────

describe('Auth Validators', () => {
  const goodPassword = 'StrongP@ss1';

  describe('loginSchema', () => {
    it('accepts valid login', () => valid(loginSchema, { email: 'test@example.com', password: 'pass' }));
    it('rejects empty email', () => invalid(loginSchema, { email: '', password: 'pass' }));
    it('rejects empty password', () => invalid(loginSchema, { email: 'a@b.com', password: '' }));
    it('rejects email without @', () => invalid(loginSchema, { email: 'notanemail', password: 'pass' }));
  });

  describe('registerSchema', () => {
    const base = { name: 'Dr. Test', email: 'dr@clinic.com', password: goodPassword, captchaInput: 'ABC', captchaToken: 'tok' };

    it('accepts valid registration', () => valid(registerSchema, base));
    it('rejects short name', () => invalid(registerSchema, { ...base, name: 'A' }));
    it('rejects weak password (no uppercase)', () => invalid(registerSchema, { ...base, password: 'weakpass1!' }));
    it('rejects weak password (no number)', () => invalid(registerSchema, { ...base, password: 'NoNumber!' }));
    it('rejects weak password (no special char)', () => invalid(registerSchema, { ...base, password: 'NoSpecial1' }));
    it('rejects weak password (too short)', () => invalid(registerSchema, { ...base, password: 'Sh1!' }));
    it('rejects disposable email', () => invalid(registerSchema, { ...base, email: 'test@mailinator.com' }));
    it('rejects missing captcha', () => invalid(registerSchema, { ...base, captchaInput: '' }));
  });

  describe('sendOtpSchema', () => {
    it('accepts valid email', () => valid(sendOtpSchema, { email: 'a@b.com' }));
    it('rejects empty email', () => invalid(sendOtpSchema, { email: '' }));
  });

  describe('verifyOtpSchema', () => {
    it('accepts valid input', () => valid(verifyOtpSchema, { email: 'a@b.com', otp: '123456', otpToken: 'tok' }));
    it('rejects wrong length OTP', () => invalid(verifyOtpSchema, { email: 'a@b.com', otp: '123', otpToken: 'tok' }));
  });

  describe('resetPasswordWithOtpSchema', () => {
    it('accepts valid input', () => valid(resetPasswordWithOtpSchema, { resetToken: 'tok', password: goodPassword }));
    it('rejects weak password', () => invalid(resetPasswordWithOtpSchema, { resetToken: 'tok', password: 'weak' }));
  });

  describe('verifyRegisterOtpSchema', () => {
    it('accepts valid input', () => valid(verifyRegisterOtpSchema, {
      name: 'Dr. Test', email: 'dr@clinic.com', password: goodPassword, otp: '123456', otpToken: 'tok',
    }));
    it('rejects bad OTP length', () => invalid(verifyRegisterOtpSchema, {
      name: 'Dr. Test', email: 'dr@clinic.com', password: goodPassword, otp: '12', otpToken: 'tok',
    }));
  });

  describe('resendRegisterOtpSchema', () => {
    it('accepts valid input', () => valid(resendRegisterOtpSchema, { email: 'a@b.com', otpToken: 'tok' }));
    it('rejects missing otpToken', () => invalid(resendRegisterOtpSchema, { email: 'a@b.com', otpToken: '' }));
  });

  describe('updateProfileSchema', () => {
    it('accepts partial update', () => valid(updateProfileSchema, { name: 'New Name' }));
    it('accepts empty object', () => valid(updateProfileSchema, {}));
    it('rejects name too short', () => invalid(updateProfileSchema, { name: 'A' }));
    it('rejects long clinic name', () => invalid(updateProfileSchema, { clinicName: 'x'.repeat(101) }));
  });

  describe('changePasswordSchema', () => {
    it('accepts valid input', () => valid(changePasswordSchema, { currentPassword: 'old', newPassword: goodPassword }));
    it('rejects empty current', () => invalid(changePasswordSchema, { currentPassword: '', newPassword: goodPassword }));
  });

  describe('deleteAccountSchema', () => {
    it('accepts valid input', () => valid(deleteAccountSchema, { password: 'mypassword' }));
    it('rejects empty password', () => invalid(deleteAccountSchema, { password: '' }));
  });
});

// ── Contact Schema ──────────────────────────────────────────────────────────

describe('Contact Validators', () => {
  describe('submitContactSchema', () => {
    const base = { name: 'John', email: 'j@d.com', message: 'Hello', captchaInput: 'ABC123', captchaToken: 'tok' };

    it('accepts valid contact', () => valid(submitContactSchema, base));
    it('accepts with optional fields', () => valid(submitContactSchema, {
      ...base, phone: '1234567890', subject: 'Help',
    }));
    it('accepts with honeypot empty', () => valid(submitContactSchema, { ...base, hp_website: '' }));
    it('rejects missing name', () => invalid(submitContactSchema, { ...base, name: '' }));
    it('rejects missing message', () => invalid(submitContactSchema, { ...base, message: '' }));
    it('rejects invalid email', () => invalid(submitContactSchema, { ...base, email: 'not-email' }));
    it('rejects missing captchaInput', () => invalid(submitContactSchema, { ...base, captchaInput: '' }));
    it('rejects missing captchaToken', () => invalid(submitContactSchema, { ...base, captchaToken: '' }));
  });
});

// ── Admin Schemas ───────────────────────────────────────────────────────────

describe('Admin Validators', () => {
  describe('adminLoginSchema', () => {
    it('accepts valid login', () => valid(adminLoginSchema, { username: 'admin', password: 'pass' }));
    it('rejects empty username', () => invalid(adminLoginSchema, { username: '', password: 'pass' }));
    it('rejects empty password', () => invalid(adminLoginSchema, { username: 'admin', password: '' }));
  });

  describe('rejectUserSchema', () => {
    it('accepts empty note', () => valid(rejectUserSchema, {}));
    it('accepts note', () => valid(rejectUserSchema, { note: 'Not verified' }));
    it('rejects note over 500 chars', () => invalid(rejectUserSchema, { note: 'x'.repeat(501) }));
  });

  describe('adminCreateOrderSchema', () => {
    it('accepts valid order', () => valid(adminCreateOrderSchema, { dentistId: 'id-1', patientName: 'Patient' }));
    it('rejects missing dentistId', () => invalid(adminCreateOrderSchema, { dentistId: '', patientName: 'Patient' }));
    it('rejects invalid service type', () => invalid(adminCreateOrderSchema, { dentistId: 'id', patientName: 'P', serviceType: 'Invalid' }));
  });

  describe('updateOrderStageSchema', () => {
    it('accepts valid stages', () => {
      for (const stage of ['received', 'design', 'production', 'qc', 'dispatched', 'completed']) {
        valid(updateOrderStageSchema, { stage });
      }
    });
    it('rejects invalid stage', () => invalid(updateOrderStageSchema, { stage: 'unknown' }));
  });
});

// ── Dashboard Schemas ───────────────────────────────────────────────────────

describe('Dashboard Validators', () => {
  describe('createOrderSchema', () => {
    it('accepts valid order', () => valid(createOrderSchema, { patientName: 'Patient' }));
    it('rejects empty patient name', () => invalid(createOrderSchema, { patientName: '' }));
    it('rejects invalid priority', () => invalid(createOrderSchema, { patientName: 'P', priority: 'Super' }));
  });

  describe('updateOrderSchema', () => {
    it('accepts partial update', () => valid(updateOrderSchema, { patientName: 'New' }));
    it('rejects unknown fields (strict)', () => invalid(updateOrderSchema, { unknownField: 'value' }));
    it('rejects invalid service type', () => invalid(updateOrderSchema, { serviceType: 'Invalid' }));
    it('rejects status (admin-only)', () => invalid(updateOrderSchema, { status: 'Completed' }));
    it('rejects stage (admin-only)', () => invalid(updateOrderSchema, { stage: 'qc' }));
  });
});

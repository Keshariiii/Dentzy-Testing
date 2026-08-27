import { z } from 'zod';
import validator from 'validator';
import { createRequire } from 'module';

// Load disposable domain list for email validation
const require = createRequire(import.meta.url);
const disposableDomains = require('disposable-email-domains');
const disposableSet = new Set(disposableDomains);

// Fake local-part patterns — only block clearly non-human addresses
// ponytail: relaxed list; add back patterns only when spam is measurably spiking
const fakePatterns = [
  /^noreply/i, /^no-?reply/i, /^nobody\d*$/i,
];

// ─── Reusable field schemas ──────────────────────────────────────────────────

/** Strict email: RFC format + no disposable + no fake patterns */
const strictEmailSchema = z.string()
  .trim()
  .toLowerCase()
  .refine((val) => validator.isEmail(val, {
    allow_utf8_local_part: false, require_tld: true, allow_ip_domain: false,
  }), { message: 'Please enter a valid email address.' })
  .refine((val) => {
    const domain = val.split('@')[1];
    return !disposableSet.has(domain);
  }, { message: 'Temporary or disposable email addresses are not allowed. Please use your real email.' })
  .refine((val) => {
    const localPart = val.split('@')[0];
    return !fakePatterns.some((p) => p.test(localPart));
  }, { message: 'Please use your real email address to register.' });

/** Password with full strength rules */
const strongPasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters.')
  .max(128, 'Password is too long (max 128 characters).')
  .refine((p) => /[A-Z]/.test(p), { message: 'Password must contain at least one uppercase letter (A–Z).' })
  .refine((p) => /[a-z]/.test(p), { message: 'Password must contain at least one lowercase letter (a–z).' })
  .refine((p) => /[0-9]/.test(p), { message: 'Password must contain at least one number (0–9).' })
  .refine((p) => /[^A-Za-z0-9]/.test(p), { message: 'Password must contain at least one special character (e.g. !@#$%).' });

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(60, 'Name must be 60 characters or less.'),
  email: strictEmailSchema,
  password: strongPasswordSchema,
  captchaInput: z.string().trim().min(1, 'CAPTCHA code is required.'),
  captchaToken: z.string().trim().min(1, 'CAPTCHA token is required.'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase()
    .min(1, 'Please enter your email and password.')
    .refine((e) => e.includes('@') && e.includes('.'), {
      message: 'Please enter a valid email address.',
    }),
  password: z.string().min(1, 'Please enter your email and password.'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase()
    .min(1, 'Please provide a valid email address.')
    .refine((e) => e.includes('@'), { message: 'Please provide a valid email address.' }),
  password: strongPasswordSchema,
});

export const updateProfileSchema = z.object({
  name: z.string().trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(60, 'Name must be 60 characters or less.')
    .optional(),
  dob: z.union([z.string(), z.null()]).optional(),
  phone: z.string().trim().max(20, 'Phone number is too long.').optional().default(''),
  clinicName: z.string().trim().max(100, 'Clinic name must be 100 characters or less.').optional().default(''),
  address: z.string().trim().max(300, 'Address must be 300 characters or less.').optional().default(''),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Please provide your current and new password.'),
  newPassword: strongPasswordSchema,
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Please enter your password to confirm account deletion.'),
});

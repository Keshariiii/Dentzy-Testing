import { z } from 'zod';

// ponytail: dropped validator + disposable-email-domains deps.
// Basic email regex + disposable domain check inline. Add back the full list if spam spikes.

const strictEmailSchema = z.string()
  .trim()
  .toLowerCase()
  .refine(val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), { message: 'Please enter a valid email address.' })
  .refine(val => {
    const domain = val.split('@')[1];
    // ponytail: block a handful of known throwaway domains; add full list later if needed
    const blocked = new Set(['mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email', 'yopmail.com', 'trashmail.com']);
    return !blocked.has(domain);
  }, { message: 'Temporary or disposable email addresses are not allowed.' });

const strongPasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters.')
  .max(128, 'Password is too long (max 128 characters).')
  .refine(p => /[A-Z]/.test(p), { message: 'Password must contain at least one uppercase letter (A–Z).' })
  .refine(p => /[a-z]/.test(p), { message: 'Password must contain at least one lowercase letter (a–z).' })
  .refine(p => /[0-9]/.test(p), { message: 'Password must contain at least one number (0–9).' })
  .refine(p => /[^A-Za-z0-9]/.test(p), { message: 'Password must contain at least one special character (e.g. !@#$%).' });

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(60, 'Name must be 60 characters or less.'),
  email: strictEmailSchema,
  password: strongPasswordSchema,
  captchaInput: z.string().trim().min(1, 'CAPTCHA code is required.'),
  captchaToken: z.string().trim().min(1, 'CAPTCHA token is required.'),
});

// 2-step registration: Step 2 — verify OTP and create account
export const verifyRegisterOtpSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(60, 'Name must be 60 characters or less.'),
  email: strictEmailSchema,
  password: strongPasswordSchema,
  otp: z.string().trim().length(6, 'Verification code must be 6 digits.'),
  otpToken: z.string().min(1, 'OTP session token is required.'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase()
    .min(1, 'Please enter your email and password.')
    .refine(e => e.includes('@') && e.includes('.'), { message: 'Please enter a valid email address.' }),
  password: z.string().min(1, 'Please enter your email and password.'),
});

export const sendOtpSchema = z.object({
  email: z.string().trim().toLowerCase()
    .min(1, 'Please provide a valid email address.')
    .refine(e => e.includes('@') && e.includes('.'), { message: 'Please provide a valid email address.' }),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, 'Email is required.'),
  otp: z.string().trim().length(6, 'Verification code must be 6 digits.'),
  otpToken: z.string().min(1, 'OTP session token is required.'),
});

export const resetPasswordWithOtpSchema = z.object({
  resetToken: z.string().min(1, 'Reset session token is required.'),
  password: strongPasswordSchema,
});


export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(60, 'Name must be 60 characters or less.').optional(),
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

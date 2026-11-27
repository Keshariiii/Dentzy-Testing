import { z } from 'zod';

export const staffLoginSchema = z.object({
  username: z.string().min(1, 'Please enter username and password.').max(128, 'Username is too long (max 128 characters).'),
  password: z.string().min(1, 'Please enter username and password.').max(128, 'Password is too long (max 128 characters).'),
});

export const staffProfileSchema = z.object({
  displayName: z.string().trim().min(1, 'Display name is required.').max(100),
  email: z.string().trim().max(150).refine(
    v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    'Please enter a valid email address.'
  ).optional().default(''),
  phone: z.string().trim().max(25).optional().default(''),
  dob: z.string().trim().max(30).optional().default(''),
});

export const staffUpdateOrderSchema = z.object({
  status: z.enum(['Pending', 'In Progress', 'Completed', 'Cancelled']).optional(),
  stage: z.enum(['received', 'design', 'production', 'qc', 'dispatched', 'completed']).optional(),
  priority: z.enum(['Low', 'Normal', 'High', 'Urgent']).optional(),
  dueDate: z.union([z.string().max(40), z.null()]).optional(),
  notes: z.string().max(2000).optional(),
});

export const staffPaymentUpdateSchema = z.object({
  status: z.enum(['Pending', 'Paid', 'Overdue', 'Cancelled']),
  paymentMode: z.string().max(50).optional(),
  referenceNumber: z.string().max(100).optional(),
});

export const staffDeliveryStatusSchema = z.object({
  status: z.enum(['in_progress', 'dispatched', 'completed']),
  notes: z.string().max(1000).optional(),
});

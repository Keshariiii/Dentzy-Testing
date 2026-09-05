import { z } from 'zod';

export const adminLoginSchema = z.object({
  username: z.string().min(1, 'Please enter username and password.'),
  password: z.string().min(1, 'Please enter username and password.'),
});

export const rejectUserSchema = z.object({
  note: z.string().max(500, 'Note must be 500 characters or less.').optional().default(''),
});

export const createOrderSchema = z.object({
  dentistId: z.string().min(1, 'Dentist is required.'),
  patientName: z.string().trim().min(1, 'Patient name is required.'),
  serviceType: z.enum(['Crown', 'Bridge', 'Denture', 'Implant', 'Veneer', 'Retainer', 'Other']).optional().default('Other'),
  priority: z.enum(['Low', 'Normal', 'High', 'Urgent']).optional().default('Normal'),
  dueDate: z.union([z.string(), z.null()]).optional().default(null),
  amount: z.number().min(0, 'Amount cannot be negative.').optional().default(0),
  notes: z.string().max(2000, 'Notes must be 2000 characters or less.').optional().default(''),
});

export const updateOrderStageSchema = z.object({
  stage: z.enum(
    ['received', 'design', 'production', 'qc', 'dispatched', 'completed'],
    { errorMap: () => ({ message: 'Invalid stage.' }) }
  ),
});

export const updatePaymentStatusSchema = z.object({
  status: z.enum(['Paid', 'Pending'], { errorMap: () => ({ message: 'Status must be Paid or Pending.' }) }),
  paymentMode: z.enum(['Cash', 'Cheque', 'UPI', 'Other', '']).optional().default(''),
  referenceNumber: z.string().max(100).optional().default(''),
  amount: z.number().min(0, 'Amount cannot be negative.').optional(),
  notes: z.string().max(500).optional().default(''),
}).superRefine((data, ctx) => {
  if (data.status === 'Paid') {
    if (data.paymentMode === 'Cheque' && (!data.referenceNumber || data.referenceNumber.trim().length < 3)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Cheque number is required (min 3 characters).', path: ['referenceNumber'] });
    }
    if (data.paymentMode === 'UPI' && (!data.referenceNumber || data.referenceNumber.trim().length < 4)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'UPI transaction / UTR number is required (min 4 characters).', path: ['referenceNumber'] });
    }
  }
});

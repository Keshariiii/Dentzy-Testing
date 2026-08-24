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
  notes: z.string().max(2000, 'Notes must be 2000 characters or less.').optional().default(''),
});

export const updateOrderStageSchema = z.object({
  stage: z.enum(
    ['received', 'design', 'production', 'qc', 'dispatched', 'completed'],
    { errorMap: () => ({ message: 'Invalid stage. Must be one of: received, design, production, qc, dispatched, completed' }) }
  ),
});

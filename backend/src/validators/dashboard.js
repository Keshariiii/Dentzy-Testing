import { z } from 'zod';

export const createOrderSchema = z.object({
  patientName: z.string().trim().min(1, 'Patient name is required.').max(100),
  caseId: z.string().trim().max(50).optional(),
  serviceType: z.enum(['Crown', 'Bridge', 'Denture', 'Implant', 'Veneer', 'Retainer', 'Other']).optional().default('Other'),
  dueDate: z.union([z.string(), z.null()]).optional(),
  notes: z.string().max(2000).optional().default(''),
  priority: z.enum(['Low', 'Normal', 'High', 'Urgent']).optional().default('Normal'),
});

export const updateOrderSchema = z.object({
  patientName: z.string().trim().min(1).max(100).optional(),
  caseId: z.string().trim().min(1).max(50).optional(),
  serviceType: z.enum(['Crown', 'Bridge', 'Denture', 'Implant', 'Veneer', 'Retainer', 'Other']).optional(),
  dueDate: z.union([z.string(), z.null()]).optional(),
  notes: z.string().max(2000).optional(),
  priority: z.enum(['Low', 'Normal', 'High', 'Urgent']).optional(),
}).strict();

export const createPaymentSchema = z.object({
  patientName: z.string().trim().min(1, 'Patient name is required.').max(100),
  caseId: z.string().trim().min(1, 'Case ID is required.').max(50),
  invoiceNumber: z.string().trim().max(50).optional().default(''),
  amount: z.number({ invalid_type_error: 'Amount must be a number.' }).min(0, 'Amount must be 0 or greater.'),
  status: z.enum(['Paid', 'Pending', 'Overdue', 'Cancelled']).optional().default('Pending'),
  invoiceDate: z.union([z.string(), z.null()]).optional(),
  dueDate: z.union([z.string(), z.null()]).optional(),
  description: z.string().max(1000).optional().default(''),
});

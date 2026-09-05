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

import { z } from 'zod';

export const adminLoginSchema = z.object({
  username: z.string().min(1, 'Please enter username and password.').max(128, 'Username is too long (max 128 characters).'),
  password: z.string().min(1, 'Please enter username and password.').max(128, 'Password is too long (max 128 characters).'),
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
  creditOverride: z.boolean().optional().default(false),
  teeth_data: z.union([z.string(), z.array(z.any())]).optional(),
  teeth: z.array(z.any()).optional(),
  restoration_type: z.string().optional(),
  service_category: z.string().optional(),
  is_urgent: z.union([z.boolean(), z.number()]).optional(),
  productId: z.string().optional(),
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

const DESIGNATIONS = [
  'Lab Assistant', 'Lab Technician', 'Senior Technician', 'CAD/CAM Specialist',
  'Ceramist', 'Quality Control', 'Intern', 'IT Department', 'Receptionist',
  'Accountant', 'Manager', 'Operations Head', 'Director', 'CTO', 'CEO',
];

export const createStaffSchema = z.object({
  username: z.string().trim().min(3, 'Username must be at least 3 characters.').max(50),
  password: z.string().min(6, 'Password must be at least 6 characters.').max(100),
  displayName: z.string().trim().min(1, 'Display name is required.').max(100),
  email: z.string().email('Invalid email.').optional().or(z.literal('')).default(''),
  designation: z.string().min(1, 'Designation is required.').max(50).default('Lab Assistant'),
});

// ponytail: validate maintenance mode configuration at edge boundary with minimal overhead
export const updateMaintenanceSchema = z.object({
  enabled: z.boolean({ required_error: '"enabled" must be a boolean.' }),
  target: z.enum(['dentists', 'staff', 'both'], { errorMap: () => ({ message: 'Target must be "dentists", "staff", or "both".' }) }),
  customMessage: z.string().trim().max(500, 'Custom message must be 500 characters or less.').optional().default(''),
  estimatedTime: z.string().trim().max(150, 'Estimated time must be 150 characters or less.').optional().default(''),
  showEmergencyContact: z.boolean().optional().default(true),
});

export { DESIGNATIONS };

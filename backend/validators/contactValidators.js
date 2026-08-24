import { z } from 'zod';

export const submitContactSchema = z.object({
  name: z.string().trim().min(1, 'Please provide name, email, and message.').max(100, 'Name must be 100 characters or less.'),
  email: z.string().trim().email('Please provide a valid email address.'),
  phone: z.string().trim().max(20, 'Phone number is too long.').optional().default(''),
  subject: z.string().trim().max(200, 'Subject must be 200 characters or less.').optional().default(''),
  message: z.string().trim().min(1, 'Please provide name, email, and message.').max(5000, 'Message must be 5000 characters or less.'),
});

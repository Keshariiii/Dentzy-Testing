import { z } from 'zod';

export const submitContactSchema = z.object({
  name: z.string().trim().min(1, 'Please provide name, email, and message.').max(100),
  email: z.string().trim().email('Please provide a valid email address.'),
  phone: z.string().trim().max(20).optional().default(''),
  subject: z.string().trim().max(200).optional().default(''),
  message: z.string().trim().min(1, 'Please provide name, email, and message.').max(15000, 'Message is too long.').refine(val => val.split(/\\s+/).length <= 1500, 'Message cannot exceed 1500 words.'),
  hp_website: z.string().optional().default(''),
});

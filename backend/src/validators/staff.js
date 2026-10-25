import { z } from 'zod';

export const staffLoginSchema = z.object({
  username: z.string().min(1, 'Please enter username and password.').max(128, 'Username is too long (max 128 characters).'),
  password: z.string().min(1, 'Please enter username and password.').max(128, 'Password is too long (max 128 characters).'),
});

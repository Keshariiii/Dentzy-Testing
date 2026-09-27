import { z } from 'zod';

export const staffLoginSchema = z.object({
  username: z.string().min(1, 'Please enter username and password.'),
  password: z.string().min(1, 'Please enter username and password.'),
});

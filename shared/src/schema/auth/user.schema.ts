import { date } from '@template/schema/helper/date-type';
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  password: z.string(),
  role: z.enum(['user', 'admin']),
  is_active: z.boolean(),
  created_at: date(),
  updated_at: date(),
});

export type User = z.infer<typeof UserSchema>;

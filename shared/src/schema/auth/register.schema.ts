import { z } from 'zod';

export const RegisterSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  password: z
    .string()
    .min(6)
    .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/, {
      message: 'Password must contain at least one special character',
    })
    .regex(/[A-Z]/, { message: 'Must contain at least an uppercase character' }),
}).strict();

export type Register = z.infer<typeof RegisterSchema>;

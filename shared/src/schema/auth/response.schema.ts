import { z } from 'zod';
import { UserSchema } from './user.schema.ts';

export const AuthResponseSchema = UserSchema.omit({ password: true });

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

import { z } from 'zod';
import { UserSchema } from './user.schema';

export const AuthResponseSchema = UserSchema.omit({ password: true });

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

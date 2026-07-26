import z from 'zod';

export const UserSchema = z.object({
  name: z.string(),
  email: z.email(),
});

export type UserDto = z.infer<typeof UserSchema>;

import type { UserDto } from '../user.dto';
import { axiosInstance } from '@/lib/axios';
import { UserSchema } from '../user.dto';

export async function fetchUser(): Promise<UserDto> {
  const response = await axiosInstance.get('/user');

  const validatedUser = UserSchema.parse(response.data);

  return validatedUser;
}

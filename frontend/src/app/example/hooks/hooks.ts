import type { UserDto } from '../user.dto';
import { axiosInstance } from '@/lib/axios';
import { UserSchema } from '../user.dto';

export async function fetchUser(): Promise<UserDto> {
  try {
    const response = await axiosInstance.get('/user');

    const validatedUser = UserSchema.parse(response.data);

    return validatedUser;
  } catch (error: unknown) {
    console.error('Failed to fetch or validate user:', error);
    throw error;
  }
}

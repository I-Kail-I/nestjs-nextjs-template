import type { AuthResponse } from '@template/schema';
import { axiosInstance } from '@/lib/axios';
import { AuthResponseSchema } from '@template/schema';

export async function fetchUser(): Promise<AuthResponse> {
  try {
    const response = await axiosInstance.get('/user');

    const validatedUser = AuthResponseSchema.parse(response.data);

    return validatedUser;
  } catch (error: unknown) {
    console.error('Failed to fetch or validate user:', error);
    throw error;
  }
}

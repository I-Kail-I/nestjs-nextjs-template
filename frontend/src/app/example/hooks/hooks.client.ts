import { useQuery } from '@tanstack/react-query';
import { gettingUser } from './hooks';

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: gettingUser,
    staleTime: 1000 * 60 * 5,
  });
}

'use client';

import { UserContainer } from './_components/user-container';
import { useUser } from './_hooks/hooks.client';

export default function UserPage() {
  const { data: user, isLoading, isError } = useUser();

  if (isLoading) return <div>Loading user profile...</div>;
  if (isError || !user) return <div>Error loading user data.</div>;

  return <UserContainer userName={user.name} />;
}

'use client';

import React from 'react';
import { UserContainer } from './_components/user-container';
import { useUser } from './hooks/hooks.client';

export default function UserPage() {
  const { data: user, isLoading, isError } = useUser();

  if (isLoading) return <div>Loading user profile...</div>;
  if (isError || !user) return <div>Error loading user data.</div>;

  return <UserContainer userName={user.name} />;
}

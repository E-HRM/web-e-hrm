'use client';

import { useSession } from 'next-auth/react';

export const useAuth = () => {
  const { data } = useSession();

  return {
    isLoggedIn: !!session?.user,
    userId: session?.user?.id_user || null,
    email: session?.user?.email || null,
  };
};

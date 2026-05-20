'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/_stores/auth-store';
import { useRouter } from 'next/navigation';

export function useAuth(requireAuth = true) {
  const { user, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !user && requireAuth) {
      router.push('/auth/login');
    }
  }, [isLoading, user, requireAuth, router]);

  return { user, isLoading, isAuthenticated: !!user, isAdmin: user?.is_admin ?? false };
}

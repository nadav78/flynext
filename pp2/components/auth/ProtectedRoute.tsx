'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    if (!loading && !user) {
      // Store the full path they were trying to access (pathname + search params)
      const fullPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      sessionStorage.setItem('intendedPath', fullPath);
      router.push('/login');
    }
  }, [user, loading, router, pathname, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return user ? <>{children}</> : null;
}
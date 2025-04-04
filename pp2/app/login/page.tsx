/* created with assistance from Claude 3.7 Sonnet */ 
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Save the previous path when component mounts
  useEffect(() => {
    // First check if there's a redirect in the URL query params (highest priority)
    const redirectPath = searchParams.get('redirect');
    if (redirectPath) {
      sessionStorage.setItem('intendedPath', redirectPath);
      return;
    }
    
    // If no query param, try using document.referrer as fallback
    const referrer = document.referrer;
    if (referrer && referrer.includes(window.location.origin) && 
       !referrer.includes('/login') && !referrer.includes('/register')) {
      // Parse the full URL to get both pathname and search params
      const referrerUrl = new URL(referrer);
      const fullPath = referrerUrl.pathname + referrerUrl.search;
      
      // Don't override if there's already a path stored (from ProtectedRoute)
      if (!sessionStorage.getItem('intendedPath')) {
        sessionStorage.setItem('intendedPath', fullPath);
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
      // Retrieve intended path from sessionStorage
      const intendedPath = sessionStorage.getItem('intendedPath') || '/';
      sessionStorage.removeItem('intendedPath'); // Clear after use
      router.push(intendedPath);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md">
            {error}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full rounded-t-md border-0 p-2.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full rounded-b-md border-0 p-2.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Sign in
            </button>
          </div>
          
          <div className="flex items-center justify-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Create one
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
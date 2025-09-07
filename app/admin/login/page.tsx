'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LoginForm {
  email: string;
  password: string;
}

export default function AdminLogin() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to public login page
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to login page...</p>
      </div>
    </div>
  );
}
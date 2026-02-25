'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Demo Redirect Page
 * Client-only component to prevent SSR 'Internal Server Error' on redirection.
 */
export default function DemoRedirect() {
  const router = useRouter();
  useEffect(() => { 
    router.push('/global'); 
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

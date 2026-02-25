'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Demo Redirect Page
 * Added 'use client' to prevent Internal Server Error during SSR.
 */
export default function DemoRedirect() {
  const router = useRouter();
  useEffect(() => { 
    router.push('/global'); 
  }, [router]);
  return null;
}

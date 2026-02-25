'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Demo Redirect Page
 * Ensures redirection happens only on the client.
 */
export default function DemoRedirect() {
  const router = useRouter();
  useEffect(() => { 
    router.push('/global'); 
  }, [router]);
  return null;
}

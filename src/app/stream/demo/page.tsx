'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Stream Demo Redirect Page
 * Ensures redirection happens only on the client.
 */
export default function StreamDemoRedirect() {
  const router = useRouter();
  useEffect(() => { 
    router.push('/global'); 
  }, [router]);
  return null;
}

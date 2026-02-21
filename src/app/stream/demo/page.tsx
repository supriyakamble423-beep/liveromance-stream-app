
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StreamDemoRedirect() {
  const router = useRouter();
  useEffect(() => { router.push('/global'); }, [router]);
  return null;
}

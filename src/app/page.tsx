
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push('/global');
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <h1 className="text-xl font-bold tracking-widest text-primary uppercase animate-pulse">Stream-X Loading...</h1>
      </div>
    </div>
  );
}

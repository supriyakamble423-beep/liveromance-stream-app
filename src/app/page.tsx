
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function RootRedirect() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/global');
    }, 2500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#2D1B2D] flex flex-col items-center justify-center relative overflow-hidden mesh-gradient">
      <div className="relative flex flex-col items-center gap-8 z-10">
        <div className="relative size-48 animate-pulse drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">
          <Image 
            src="/logo.png" 
            alt="Global Love" 
            fill 
            className="object-contain"
            priority
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "https://placehold.co/400x400/E11D48/white?text=GL";
            }}
          />
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 border-4 border-[#E11D48] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(225,29,72,0.4)]" />
          <p className="text-[10px] font-black tracking-[0.4em] text-[#FDA4AF] uppercase animate-pulse">Initializing Romance...</p>
        </div>
      </div>
      
      {/* Decorative background hearts */}
      <div className="absolute top-1/4 -left-10 size-64 bg-[#E11D48]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-10 size-64 bg-[#F472B6]/5 rounded-full blur-3xl" />
    </div>
  );
}

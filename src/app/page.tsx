
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function RootRedirect() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/global');
    }, 1500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#2D1B2D] flex flex-col items-center justify-center relative overflow-hidden mesh-gradient">
      <div className="relative flex flex-col items-center gap-8 z-10">
        <div className="relative size-48 animate-pulse logo-glow flex items-center justify-center">
          <div className="absolute inset-0 bg-white/10 rounded-full blur-[40px] animate-pulse" />
          <Image 
            src="/logo.png?v=2" 
            alt="Global Love" 
            width={240}
            height={240}
            className="object-contain relative z-10 logo-glow"
            priority
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "https://placehold.co/400x400/E11D48/white?text=GL";
            }}
          />
        </div>
        
        <div className="flex flex-col items-center gap-4">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(225,29,72,0.5)]" />
          <div className="space-y-1 text-center">
            <p className="text-[10px] font-black tracking-[0.4em] text-white uppercase animate-pulse">Establishing Grid</p>
            <p className="text-[8px] font-bold tracking-[0.2em] text-primary/60 uppercase">Secure Romantic Signal Active</p>
          </div>
        </div>
      </div>
      
      <div className="absolute top-1/4 -left-20 size-96 bg-[#E11D48]/10 rounded-full blur-[120px] animate-bounce duration-\[5000ms\]" />
      <div className="absolute bottom-1/4 -right-20 size-96 bg-[#F472B6]/10 rounded-full blur-[120px] animate-bounce duration-\[7000ms\]" />
    </div>
  );
}

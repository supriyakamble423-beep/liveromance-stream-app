'use client';

import { useEffect } from 'react';
import { ShieldAlert, RefreshCcw, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Root Global Error Handler for Next.js
 * This catches errors that occur even outside the main layout.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Error caught:', error);
  }, [error]);

  return (
    <html>
      <body className="bg-[#0F0101] text-white">
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto bg-[#0F0101] border-x border-white/10">
          <div className="romantic-gradient p-5 rounded-[2.5rem] shadow-[0_0_50px_rgba(225,29,72,0.4)] mb-8 animate-pulse">
            <ShieldAlert className="size-16 text-white" />
          </div>
          <h1 className="text-3xl font-black uppercase italic mb-4 tracking-tighter">System Anomalies</h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-10 leading-relaxed px-10">
            Secure connection dropped. Re-establishing romantic grid...
          </p>
          <div className="w-full space-y-4">
            <Button 
              onClick={() => reset()}
              className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-lg shadow-2xl shadow-primary/40"
            >
              <RefreshCcw className="size-6 mr-2" /> Reboot Signal
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/global'}
              className="w-full h-14 rounded-2xl border-white/10 text-slate-400 font-black uppercase text-[10px] tracking-widest"
            >
              Emergency Return
            </Button>
          </div>
          <div className="mt-12 opacity-20 flex items-center gap-2">
            <Heart className="size-4 fill-current" />
            <span className="text-[8px] font-black uppercase tracking-widest text-white">Stream-X Overseer Active</span>
          </div>
        </div>
      </body>
    </html>
  );
}

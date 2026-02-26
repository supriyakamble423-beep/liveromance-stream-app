'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Loader2, Heart, Smartphone, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JoinClientProps {
  hostId: string;
}

export function JoinClient({ hostId }: JoinClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'detecting' | 'redirecting' | 'fallback'>('detecting');
  
  const apkUrl = "https://liveromance-stream-app.vercel.app/app-release.apk"; 
  const appScheme = `liveromance://profile/${hostId}`;

  useEffect(() => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (!isMobile) {
      // If desktop, just show a landing page or redirect to web global
      setStatus('fallback');
      return;
    }

    // Attempt to open the app
    setStatus('redirecting');
    window.location.href = appScheme;

    // Fallback logic: If app doesn't open within 2.5 seconds, redirect to APK download
    const timer = setTimeout(() => {
      if (!document.hidden) {
        setStatus('fallback');
        // Automatically start APK download if fallback triggered
        window.location.href = apkUrl;
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [hostId, appScheme, apkUrl]);

  return (
    <div className="min-h-screen bg-[#0F0101] text-white flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto border-x border-white/10">
      <div className="romantic-gradient p-4 rounded-[2.5rem] shadow-[0_0_50px_rgba(225,29,72,0.4)] mb-8 animate-pulse">
        <Heart className="size-16 text-white fill-current" />
      </div>

      {status === 'redirecting' || status === 'detecting' ? (
        <div className="space-y-6">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">Opening Signal...</h1>
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="size-10 text-primary animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Connecting to App Node</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="space-y-2">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">App Not <span className="text-primary">Detected</span></h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed px-8">
              Download the official Stream-X APK to access private rooms and 1% lifetime rewards.
            </p>
          </div>

          <div className="w-full space-y-4">
            <Button 
              onClick={() => window.location.href = apkUrl}
              className="w-full h-16 rounded-[1.5rem] bg-primary hover:bg-primary/90 text-lg font-black uppercase tracking-widest gap-3 shadow-2xl shadow-primary/40 text-white"
            >
              <Download className="size-6" /> Download APK Now
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/global')}
              className="w-full h-14 rounded-2xl border-white/10 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-white/5"
            >
              Continue on Web (Limited)
            </Button>
          </div>

          <div className="pt-8 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
              <Smartphone className="size-3" /> Android 10+ Supported
            </div>
            <div className="flex items-center gap-2 text-[10px] text-primary font-black uppercase tracking-widest">
              <Zap className="size-3 fill-current" /> Fast CDN Delivery
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useFirebase } from '@/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Zap, AlertCircle } from 'lucide-react';

function RedirectLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, firestore, isUserLoading, areServicesAvailable } = useFirebase();
  const refCode = searchParams.get('ref');
  const [showFallback, setShowFallback] = useState(false);

  // Safety Timeout: 5 seconds baad fallback button dikhao
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isUserLoading || !areServicesAvailable) {
        setShowFallback(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [isUserLoading, areServicesAvailable]);

  useEffect(() => {
    if (isUserLoading || !areServicesAvailable || !firestore) return;

    const handleLogic = async () => {
      // 1. Track Referral
      if (refCode && user) {
        try {
          const userRef = doc(firestore, 'users', user.uid);
          await updateDoc(userRef, {
            referredBy: refCode,
            referredAt: serverTimestamp()
          });
        } catch (e) { console.warn("Referral tracking deferred"); }
      }

      // 2. Redirection
      if (!user) {
        router.push('/global');
      } else {
        try {
          const hostSnap = await getDoc(doc(firestore, 'hosts', user.uid));
          if (hostSnap.exists()) {
            router.push('/host-p');
          } else {
            router.push('/global');
          }
        } catch (e) {
          router.push('/global');
        }
      }
    };

    handleLogic();
  }, [user, isUserLoading, areServicesAvailable, firestore, refCode, router]);

  return (
    <div className="relative flex flex-col items-center gap-8 z-10 px-6 text-center">
      <div className="relative size-48 animate-pulse logo-glow flex items-center justify-center">
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
      
      {!showFallback ? (
        <div className="space-y-4">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(225,29,72,0.5)] mx-auto" />
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">Establishing Secure Signal...</p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-3">
            <AlertCircle className="size-5 text-amber-500 shrink-0" />
            <p className="text-[10px] font-black uppercase text-amber-200 tracking-wider">Connection slow. Bypass active.</p>
          </div>
          <Button 
            onClick={() => router.push('/global')}
            className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-lg shadow-2xl shadow-primary/40 gap-3"
          >
            <Zap className="size-6 fill-current" /> Force Enter
          </Button>
        </div>
      )}
    </div>
  );
}

export default function RootRedirect() {
  return (
    <div className="min-h-screen bg-[#2D1B2D] flex flex-col items-center justify-center relative overflow-hidden mesh-gradient">
      <Suspense fallback={<div className="text-white opacity-20 font-black uppercase tracking-[0.2em] text-[10px]">Booting Grid...</div>}>
        <RedirectLogic />
      </Suspense>
    </div>
  );
}

'use client';

import { useEffect, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useFirebase } from '@/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Zap, AlertCircle, Loader2 } from 'lucide-react';

function RedirectLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, firestore, isUserLoading, areServicesAvailable } = useFirebase();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  // Safety Timeout: 6 seconds baad fallback button dikhao agar kuch load na ho
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isProcessing) {
        setShowFallback(true);
      }
    }, 6000);
    return () => clearTimeout(timer);
  }, [isProcessing]);

  useEffect(() => {
    // Wait for services to be ready
    if (isUserLoading || !areServicesAvailable || !firestore || isProcessing) return;

    const handleLogic = async () => {
      setIsProcessing(true);
      
      try {
        // 1. Track Referral if present
        const refCode = searchParams.get('ref');
        if (refCode && user) {
          const userRef = doc(firestore, 'users', user.uid);
          await updateDoc(userRef, {
            referredBy: refCode,
            referredAt: serverTimestamp()
          }).catch(() => {/* non-blocking fallback */});
        }

        // 2. Redirection based on Auth State
        if (!user) {
          router.push('/global');
        } else {
          // Check if user is a Host
          const hostSnap = await getDoc(doc(firestore, 'hosts', user.uid));
          if (hostSnap.exists()) {
            router.push('/host-p');
          } else {
            router.push('/global');
          }
        }
      } catch (e) {
        console.warn("Redirection logic encountered a delay, falling back to Marketplace");
        router.push('/global');
      } finally {
        // We don't set isProcessing(false) here because we're navigating away
      }
    };

    handleLogic();
  }, [user, isUserLoading, areServicesAvailable, firestore, searchParams, router, isProcessing]);

  return (
    <div className="relative flex flex-col items-center gap-8 z-10 px-6 text-center">
      <div className="relative size-48 logo-glow flex items-center justify-center">
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
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Establishing Secure Signal...</p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-3">
            <AlertCircle className="size-5 text-amber-500 shrink-0" />
            <p className="text-[10px] font-black uppercase text-amber-200 tracking-wider">Connection established. Signal syncing.</p>
          </div>
          <Button 
            onClick={() => router.push('/global')}
            className="w-full h-16 rounded-2xl romantic-gradient text-white font-black uppercase tracking-widest text-lg shadow-2xl shadow-primary/40 gap-3"
          >
            <Zap className="size-6 fill-current" /> Manual Entry
          </Button>
        </div>
      )}
    </div>
  );
}

export default function RootRedirect() {
  return (
    <div className="min-h-screen bg-[#2D1B2D] flex flex-col items-center justify-center relative overflow-hidden mesh-gradient">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary size-10" />
          <div className="text-white opacity-20 font-black uppercase tracking-[0.2em] text-[10px]">Booting Grid...</div>
        </div>
      }>
        <RedirectLogic />
      </Suspense>
    </div>
  );
}

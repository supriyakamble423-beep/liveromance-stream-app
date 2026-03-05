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

  // Safety Timeout: 4 seconds baad fallback dikhao ya auto-redirect karo
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isProcessing) {
        console.warn("Firebase taking too long or missing config. Redirecting to Global.");
        if (!isProcessing) {
          router.push('/global');
        }
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [isProcessing, router]);

  useEffect(() => {
    // Don't run if already processing or still initial auth loading
    if (isUserLoading || isProcessing) return;

    const handleLogic = async () => {
      setIsProcessing(true);
      
      try {
        // If services are not available (missing env vars), just go to global
        if (!areServicesAvailable || !firestore) {
          router.push('/global');
          return;
        }

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
      
      <div className="space-y-4">
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(225,29,72,0.5)] mx-auto" />
        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Establishing Secure Signal...</p>
      </div>
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

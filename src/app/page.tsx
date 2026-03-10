'use client';

import { useEffect, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

function RedirectLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, firestore, isUserLoading, areServicesAvailable } = useFirebase();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualBypass, setShowManualBypass] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isProcessing) {
        console.warn("Signal timeout. Showing manual bypass.");
        setShowManualBypass(true);
      }
    }, 3000);
    
    const autoTimer = setTimeout(() => {
      if (!isProcessing) {
        setIsProcessing(true);
        router.push('/global');
      }
    }, 6000);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoTimer);
    };
  }, [isProcessing, router]);

  useEffect(() => {
    if (!areServicesAvailable && !isUserLoading) {
      setIsProcessing(true);
      router.push('/global');
      return;
    }

    if (isUserLoading || isProcessing) return;

    const handleLogic = async () => {
      setIsProcessing(true);
      
      try {
        const refCode = searchParams.get('ref');
        if (refCode && user && firestore) {
          const userRef = doc(firestore, 'users', user.uid);
          await updateDoc(userRef, {
            referredBy: refCode,
            referredAt: serverTimestamp()
          }).catch(() => {});
        }

        if (!user) {
          router.push('/global');
        } else if (firestore) {
          const hostSnap = await getDoc(doc(firestore, 'hosts', user.uid));
          if (hostSnap.exists()) {
            router.push('/host-p');
          } else {
            router.push('/global');
          }
        } else {
          router.push('/global');
        }
      } catch (e) {
        router.push('/global');
      }
    };

    handleLogic();
  }, [user, isUserLoading, areServicesAvailable, firestore, searchParams, router, isProcessing]);

  return (
    <div className="relative flex flex-col items-center gap-8 z-10 px-6 text-center">
      <div className="relative size-48 logo-glow flex items-center justify-center">
        <div className="size-40 rounded-full bg-primary/10 border-8 border-primary flex items-center justify-center shadow-[0_0_50px_rgba(225,29,72,0.4)]">
          <span className="text-white font-black italic text-7xl select-none">GL</span>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 text-primary animate-spin" />
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Establishing Signal...</p>
        </div>

        {showManualBypass && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <p className="text-[10px] text-primary/60 font-black uppercase tracking-widest">Slow Connection Detected</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsProcessing(true);
                router.push('/global');
              }}
              className="rounded-2xl border-white/10 text-white font-black uppercase text-[10px] tracking-widest px-8 h-12 hover:bg-white/5"
            >
              <Zap className="size-3 mr-2 text-primary fill-current" /> Enter Marketplace
            </Button>
          </div>
        )}
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
          <div className="text-white opacity-20 font-black uppercase tracking-[0.2em] text-[10px]">Syncing Nodes...</div>
        </div>
      }>
        <RedirectLogic />
      </Suspense>
    </div>
  );
}
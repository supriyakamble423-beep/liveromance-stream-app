'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useFirebase } from '@/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';

function RedirectLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, firestore, isUserLoading, areServicesAvailable } = useFirebase();
  const refCode = searchParams.get('ref');

  useEffect(() => {
    if (isUserLoading || !areServicesAvailable || !firestore) return;

    const handleLogic = async () => {
      // 1. Track Referral if present
      if (refCode && user) {
        try {
          const userRef = doc(firestore, 'users', user.uid);
          await updateDoc(userRef, {
            referredBy: refCode,
            referredAt: serverTimestamp()
          });
        } catch (e) { console.warn("Referral tracking deferred"); }
      }

      // 2. Smart Redirection
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
    <div className="relative flex flex-col items-center gap-8 z-10">
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
      <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(225,29,72,0.5)]" />
      <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">Establishing Secure Signal...</p>
    </div>
  );
}

export default function RootRedirect() {
  return (
    <div className="min-h-screen bg-[#2D1B2D] flex flex-col items-center justify-center relative overflow-hidden mesh-gradient">
      <Suspense fallback={<div className="text-white opacity-20">Syncing...</div>}>
        <RedirectLogic />
      </Suspense>
    </div>
  );
}

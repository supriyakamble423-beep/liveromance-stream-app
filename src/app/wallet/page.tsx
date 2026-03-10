'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Zap, PlayCircle, Sparkles, ChevronLeft, Loader2, Wallet as WalletIcon, TrendingUp, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFirebase } from "@/firebase";
import { doc, onSnapshot, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";

export default function RewardWallet() {
  const { firestore, user, areServicesAvailable } = useFirebase();
  const { toast } = useToast();
  const [balance, setBalance] = useState<number>(0);
  const [isWatching, setIsWatching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adTimer, setAdTimer] = useState(0);
  const [showRewardSuccess, setShowRewardSuccess] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  
  const isClaimingRef = useRef(false);

  useEffect(() => {
    if (!firestore || !user?.uid) {
      if (!areServicesAvailable) {
        setBalance(150);
        setIsLoading(false);
      }
      return;
    }

    const userRef = doc(firestore, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setBalance(snap.data()?.diamonds || 0);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, user?.uid, areServicesAvailable]);

  useEffect(() => {
    const timer = setTimeout(() => setAdLoaded(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const processReward = useCallback(async () => {
    if (isClaimingRef.current) return;
    isClaimingRef.current = true;
    setIsWatching(false);
    
    if (areServicesAvailable && user && firestore) {
      try {
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, { 
          diamonds: increment(5), 
          lastAdWatched: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (e) { console.error(e); }
    } else {
      setBalance(prev => prev + 5);
    }

    setShowRewardSuccess(true);
    toast({ title: "🎉 +5 Diamonds!", description: "Ad bonus successfully added." });
    
    setTimeout(() => {
      setShowRewardSuccess(false);
      isClaimingRef.current = false;
    }, 3000);
  }, [areServicesAvailable, user, firestore, toast]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWatching && adTimer > 0) {
      interval = setInterval(() => setAdTimer(prev => prev - 1), 1000);
    } else if (isWatching && adTimer === 0) {
      processReward();
    }
    return () => clearInterval(interval);
  }, [isWatching, adTimer, processReward]);

  const handleWatchAd = () => {
    if (isWatching || !adLoaded) {
      toast({ variant: "destructive", title: "Ad Signal Weak", description: "Wait for ad buffer." });
      return;
    }
    setIsWatching(true);
    setAdTimer(10); 
    window.open("https://www.highrevenuegate.com/direct-link", '_blank');
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-lg mx-auto border-x border-white/5 mesh-gradient text-white pb-24">
      <header className="flex items-center justify-between px-8 pt-16 pb-6 bg-[#2D1B2D]/60 backdrop-blur-2xl">
        <Link href="/global">
          <Button variant="ghost" size="icon" className="rounded-full bg-white/5 border border-white/10 size-12">
            <ChevronLeft className="size-6" />
          </Button>
        </Link>
        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Vault</h1>
        <div className="size-12" />
      </header>

      <main className="flex-1 overflow-y-auto px-8 space-y-10 pt-8 no-scrollbar">
        <div className="bg-gradient-to-br from-[#E11D48] via-[#F472B6] to-[#E11D48] p-10 rounded-[4rem] shadow-2xl relative overflow-hidden">
          <WalletIcon className="absolute top-0 right-0 p-6 opacity-30 size-40 rotate-12 fill-white" />
          <div className="relative z-10">
            <p className="text-[11px] font-black uppercase tracking-[0.4em] mb-3 opacity-80">Diamond Balance</p>
            <span className="text-6xl font-black italic tracking-tighter">{isLoading ? "..." : `💎 ${balance}`}</span>
            <div className="mt-4 flex items-center gap-2 bg-white/20 w-fit px-4 py-1.5 rounded-full border border-white/10">
               <TrendingUp className="size-3" />
               <span className="text-[10px] font-black uppercase">Value: ₹{(balance * 0.02).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <section className="bg-[#3D263D]/60 border border-white/10 rounded-[3.5rem] p-8 text-center backdrop-blur-xl relative overflow-hidden">
          <div className="size-20 bg-gradient-to-tr from-[#F472B6] to-[#E11D48] rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <PlayCircle className="size-12" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight italic">Reward Hub</h3>
          <p className="text-[11px] text-[#FDA4AF] font-black uppercase tracking-widest mt-2 mb-8">+5 Diamonds Per Ad</p>
          
          <Button onClick={handleWatchAd} disabled={isWatching || isLoading} className={cn("w-full h-16 rounded-[2rem] font-black uppercase tracking-widest transition-all", isWatching ? "bg-slate-800" : "romantic-gradient")}>
            {isWatching ? `Watching... ${adTimer}s` : <><PlayCircle className="size-5 mr-2" /> Claim Reward</>}
          </Button>
        </section>
      </main>

      {isWatching && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-8">
           <div className="absolute top-10 right-10 px-4 py-2 bg-white/10 rounded-full text-xs font-black">{adTimer}s</div>
           <div className="relative size-48 mx-auto">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div className="relative size-full bg-slate-900 border-4 border-primary rounded-full flex items-center justify-center shadow-2xl">
                 <Zap className="size-20 text-primary animate-pulse" />
              </div>
           </div>
           <h2 className="text-2xl font-black uppercase italic tracking-widest mt-8">Sponsor Node</h2>
           <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2">Viewing Secure Romantic Ad...</p>
        </div>
      )}

      {showRewardSuccess && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center pointer-events-none">
           <div className="bg-green-500 text-white px-8 py-4 rounded-2xl flex items-center gap-3 animate-in zoom-in shadow-2xl">
              <CheckCircle2 className="size-6" />
              <span className="text-sm font-black uppercase tracking-widest">+5 DIAMONDS COLLECTED</span>
           </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
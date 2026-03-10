'use client';

import { useState, useEffect, useCallback } from 'react';
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

  // Load User Balance
  useEffect(() => {
    if (!firestore || !user?.uid) {
      // Simulation mode fallback balance
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
    }, (err) => {
      console.warn("Balance sync slow, using cached state.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, user?.uid, areServicesAvailable]);

  // Finish Ad Logic - Memoized to prevent re-renders
  const finishAd = useCallback(async () => {
    setIsWatching(false);
    
    // Credit logic
    if (areServicesAvailable && user && firestore) {
      try {
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, { 
          diamonds: increment(5), 
          lastAdWatched: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (e) {
        console.error("Reward sync failed", e);
      }
    } else {
      // Local simulation reward
      setBalance(prev => prev + 5);
    }

    setShowRewardSuccess(true);
    toast({ 
      title: "🎉 +5 Diamonds!", 
      description: "High-yield ad bonus added.", 
      className: "romantic-glow bg-primary text-white" 
    });
    
    setTimeout(() => setShowRewardSuccess(false), 3000);
  }, [areServicesAvailable, user, firestore, toast]);

  // Timer Effect: Safe way to handle countdown and completion
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isWatching && adTimer > 0) {
      interval = setInterval(() => {
        setAdTimer((prev) => prev - 1);
      }, 1000);
    } else if (isWatching && adTimer === 0) {
      finishAd();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWatching, adTimer, finishAd]);

  // Handle Ad Watching Start
  const handleWatchAd = () => {
    setIsWatching(true);
    setAdTimer(10); // 10 second watch time

    // Open actual Adsterra Direct Link in background
    const adUrl = "https://www.highrevenuegate.com/direct-link"; 
    window.open(adUrl, '_blank');
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-lg mx-auto border-x border-white/5 mesh-gradient text-white pb-24">
      <header className="flex items-center justify-between px-8 pt-16 pb-6 bg-[#2D1B2D]/60 backdrop-blur-2xl">
        <Link href="/global">
          <Button variant="ghost" size="icon" className="rounded-full bg-white/5 border border-white/10 size-12">
            <ChevronLeft className="size-6" />
          </Button>
        </Link>
        <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white">Vault</h1>
        <div className="size-12" />
      </header>

      <main className="flex-1 overflow-y-auto px-8 space-y-10 pt-8 no-scrollbar">
        {/* Diamond Card */}
        <div className="bg-gradient-to-br from-[#E11D48] via-[#F472B6] to-[#E11D48] p-10 rounded-[4rem] shadow-2xl relative overflow-hidden romantic-glow">
          <div className="absolute top-0 right-0 p-6 opacity-30">
            <WalletIcon className="size-40 rotate-12 fill-white" />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-black uppercase tracking-[0.4em] mb-3 opacity-80">Diamond Balance</p>
            <div className="flex items-center gap-4">
              <span className="text-6xl font-black italic tracking-tighter">
                {isLoading ? "..." : `💎 ${balance}`}
              </span>
              {showRewardSuccess && <Sparkles className="size-10 text-yellow-300 animate-bounce absolute -right-4 -top-4" />}
            </div>
            <div className="mt-4 flex items-center gap-2 bg-white/20 w-fit px-4 py-1.5 rounded-full border border-white/10">
               <TrendingUp className="size-3 text-white" />
               <span className="text-[10px] font-black uppercase tracking-widest">Value: ₹{(balance * 0.02).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Watch & Earn Section */}
        <section className="bg-[#3D263D]/60 border border-white/10 rounded-[3.5rem] p-8 text-center shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="size-20 bg-gradient-to-tr from-[#F472B6] to-[#E11D48] rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl">
            <PlayCircle className="size-12 text-white" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight italic">Reward Hub</h3>
          <p className="text-[11px] text-[#FDA4AF] font-black uppercase tracking-widest mt-2 mb-8">+5 Diamonds Per Ad</p>
          
          <Button 
            onClick={handleWatchAd} 
            disabled={isWatching} 
            className={cn(
              "w-full h-16 rounded-[2rem] font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95",
              isWatching ? "bg-slate-800" : "romantic-gradient"
            )}
          >
            {isWatching ? (
              <div className="flex items-center gap-3">
                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Watching... {adTimer}s
              </div>
            ) : (
              <><PlayCircle className="size-5 mr-2" /> Claim Reward</>
            )}
          </Button>

          <p className="text-[8px] text-white/30 mt-6 font-bold uppercase tracking-widest">Powered by Premium Ad Node #441</p>
        </section>

        {/* Profit Policy */}
        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex gap-4 items-start">
           <Zap className="size-5 text-amber-400 shrink-0 mt-1" />
           <p className="text-[9px] text-slate-400 font-bold leading-relaxed uppercase">
             Rewards are calculated after a 80% platform sustainability fee. Payout rate is fixed at 1000💎 = ₹20.
           </p>
        </div>
      </main>

      {/* Ad Overlay Modal */}
      {isWatching && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
           <div className="absolute top-10 right-10 flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
              <span className="text-xs font-black text-white">{adTimer}s</span>
              <X onClick={() => setIsWatching(false)} className="size-4 text-white/20 cursor-pointer" />
           </div>
           
           <div className="w-full max-w-xs space-y-8 text-center">
              <div className="relative size-48 mx-auto">
                 <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                 <div className="relative size-full bg-slate-900 border-4 border-primary rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(225,29,72,0.4)]">
                    <Zap className="size-20 text-primary animate-pulse" />
                 </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black uppercase italic tracking-widest">Sponsor Node</h2>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Viewing Secure Romantic Ad...</p>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-primary transition-all duration-1000 ease-linear" 
                   style={{ width: `${(10 - adTimer) * 10}%` }}
                 />
              </div>
           </div>
        </div>
      )}

      {/* Success Animation Overlay */}
      {showRewardSuccess && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center pointer-events-none">
           <div className="bg-green-500 text-white px-8 py-4 rounded-2xl flex items-center gap-3 animate-in zoom-in slide-in-from-bottom-10 shadow-2xl">
              <CheckCircle2 className="size-6" />
              <span className="text-sm font-black uppercase tracking-widest">+5 DIAMONDS COLLECTED</span>
           </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Zap, PlayCircle, ChevronLeft, Loader2, 
  Wallet as WalletIcon, TrendingUp, CheckCircle2, 
  Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFirebase } from "@/firebase";
import { doc, onSnapshot, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { validateAdReward } from "@/ai/flows/ad-reward-validation-flow";

export default function RewardWallet() {
  const { firestore, user, areServicesAvailable } = useFirebase();
  const { toast } = useToast();
  
  const [balance, setBalance] = useState<number>(0);
  const [isAiChecking, setIsAiChecking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showRewardSuccess, setShowRewardSuccess] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);

  // Load Balance
  useEffect(() => {
    if (!firestore || !user?.uid) {
      if (!areServicesAvailable) {
        setBalance(15); 
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

  // Simulate Ad Engine Load
  useEffect(() => {
    const timer = setTimeout(() => setAdLoaded(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleWatchAd = async () => {
    if (isAiChecking || !adLoaded) {
      toast({ variant: "destructive", title: "Ad Signal Weak", description: "Wait for ad engine to initialize." });
      return;
    }

    setIsAiChecking(true);
    
    // 1. Open Adsterra High-CPM Link
    window.open("https://www.highrevenuegate.com/direct-link-28788998", '_blank');

    // 2. Start AI Audit Process (Simulated delay)
    setTimeout(async () => {
      try {
        const res = await validateAdReward({
          userId: user?.uid || 'guest',
          adId: '28788998',
          timeSpent: 10
        });

        if (res.isValid) {
          if (areServicesAvailable && user && firestore) {
            const userRef = doc(firestore, 'users', user.uid);
            await updateDoc(userRef, { 
              diamonds: increment(2), 
              lastAdWatched: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          } else {
            setBalance(p => p + 2);
          }
          setShowRewardSuccess(true);
          toast({ title: "💎 +2 Diamonds!", description: res.message });
        } else {
          toast({ variant: "destructive", title: "AI Scan Failed", description: res.message });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsAiChecking(false);
        setTimeout(() => setShowRewardSuccess(false), 3000);
      }
    }, 5000); 
  };

  const isLowBalance = balance < 10;

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-lg mx-auto border-x border-white/5 mesh-gradient text-white pb-24">
      <header className="flex items-center justify-between px-8 pt-16 pb-6 bg-[#2D1B2D]/60 backdrop-blur-2xl border-b border-white/5">
        <Link href="/global">
          <Button variant="ghost" size="icon" className="rounded-full bg-white/5 border border-white/10 size-12">
            <ChevronLeft className="size-6" />
          </Button>
        </Link>
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Vault</h1>
          <div className="flex items-center gap-1">
            <div className={cn("size-1.5 rounded-full animate-pulse", areServicesAvailable ? "bg-green-500" : "bg-amber-500")} />
            <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{areServicesAvailable ? "Live Grid" : "Sim Mode"}</span>
          </div>
        </div>
        <div className="size-12" />
      </header>

      <main className="flex-1 overflow-y-auto px-8 space-y-8 pt-8 no-scrollbar">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-[#E11D48] via-[#F472B6] to-[#E11D48] p-10 rounded-[4rem] shadow-2xl relative overflow-hidden group">
          <WalletIcon className="absolute top-0 right-0 p-6 opacity-20 size-40 rotate-12 fill-white group-hover:scale-110 transition-transform duration-700" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-80">Diamond Balance</p>
              {isLowBalance && <Badge className="bg-white/20 text-white border-none text-[8px] animate-pulse">RECHARGE NEEDED</Badge>}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black italic tracking-tighter">{isLoading ? "..." : `💎 ${balance}`}</span>
            </div>
            <div className="mt-6 flex items-center gap-3 bg-black/20 w-fit px-5 py-2 rounded-2xl border border-white/10 backdrop-blur-md">
               <TrendingUp className="size-4 text-green-400" />
               <span className="text-[10px] font-black uppercase tracking-widest">Value: ₹{(balance * 0.02).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Reward Hub */}
        <section className="bg-[#3D263D]/60 border border-white/10 rounded-[3.5rem] p-8 text-center backdrop-blur-xl relative overflow-hidden shadow-2xl">
          <div className="size-20 bg-gradient-to-tr from-amber-400 to-orange-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl romantic-glow">
            <Gift className="size-12 text-black" />
          </div>
          
          <div className="space-y-2 mb-8">
            <h3 className="text-2xl font-black uppercase tracking-tight italic">Watch & Earn</h3>
            <p className="text-[11px] text-[#FDA4AF] font-black uppercase tracking-[0.2em]">+2 Diamonds per Ad</p>
          </div>
          
          <Button 
            onClick={handleWatchAd} 
            disabled={isAiChecking || isLoading} 
            className={cn(
              "w-full h-16 rounded-[2.2rem] font-black uppercase tracking-widest transition-all gap-3 shadow-xl active:scale-95", 
              isAiChecking ? "bg-slate-800" : "romantic-gradient hover:shadow-primary/40"
            )}
          >
            {isAiChecking ? (
              <><Loader2 className="size-5 animate-spin" /> AI AUDITING...</>
            ) : (
              <><PlayCircle className="size-5" /> WATCH AD FOR 💎</>
            )}
          </Button>

          <p className="text-[8px] text-white/20 font-black uppercase mt-6 tracking-[0.3em]">AI Agent: AdAudit-v1.0 Active</p>
        </section>

        {/* Transaction History Mock */}
        <section className="space-y-4 pb-10">
          <div className="flex items-center justify-between px-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Recent Activity</h4>
          </div>
          <div className="bg-white/5 rounded-[2.5rem] border border-white/5 divide-y divide-white/5">
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-green-500/10 flex items-center justify-center"><CheckCircle2 className="size-4 text-green-500" /></div>
                <div>
                  <p className="text-[10px] font-black uppercase">Ad Reward</p>
                  <p className="text-[8px] text-white/40 font-bold uppercase">Just Now</p>
                </div>
              </div>
              <span className="text-xs font-black text-green-400">+2 💎</span>
            </div>
          </div>
        </section>
      </main>

      {/* AI Success Overlay */}
      {showRewardSuccess && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center pointer-events-none p-6">
           <div className="bg-green-500 text-white px-10 py-6 rounded-[2.5rem] flex flex-col items-center gap-3 animate-in zoom-in shadow-[0_0_50px_rgba(34,197,94,0.4)] border-4 border-white/20">
              <CheckCircle2 className="size-12" />
              <div className="text-center">
                <span className="text-xl font-black uppercase tracking-widest block">AI VALIDATED</span>
                <span className="text-sm font-bold opacity-80">+2 DIAMONDS ADDED</span>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

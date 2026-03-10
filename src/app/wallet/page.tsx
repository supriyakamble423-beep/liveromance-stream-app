'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Zap, PlayCircle, Sparkles, ChevronLeft, Loader2, 
  Wallet as WalletIcon, TrendingUp, X, CheckCircle2, 
  AlertTriangle, ShieldCheck, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [isAiChecking, setIsAiChecking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adTimer, setAdTimer] = useState(0);
  const [showRewardSuccess, setShowRewardSuccess] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  
  const isClaimingRef = useRef(false);

  // Load Balance
  useEffect(() => {
    if (!firestore || !user?.uid) {
      if (!areServicesAvailable) {
        setBalance(15); // Mock balance for simulation
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

  // Reward Processing (Stable)
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
    toast({ title: "🎉 +5 Diamonds!", description: "Ad bonus successfully added to your vault." });
    
    setTimeout(() => {
      setShowRewardSuccess(false);
      isClaimingRef.current = false;
    }, 3000);
  }, [areServicesAvailable, user, firestore, toast]);

  // Timer Hook
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
    if (isWatching || isAiChecking || !adLoaded) {
      toast({ variant: "destructive", title: "Ad Signal Weak", description: "Wait for ad engine to initialize." });
      return;
    }

    // AI Check Simulation
    setIsAiChecking(true);
    
    setTimeout(() => {
      setIsAiChecking(false);
      setIsWatching(true);
      setAdTimer(10); 
      // Redirect to your Adsterra high-revenue direct link
      window.open("https://www.highrevenuegate.com/direct-link", '_blank');
    }, 2000); // 2-sec AI Scan
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

        {/* Low Balance Warning */}
        {isLowBalance && !isLoading && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-[2.5rem] flex items-start gap-4 animate-in slide-in-from-top-4">
            <div className="size-10 bg-amber-500/20 rounded-2xl flex items-center justify-center shrink-0">
              <AlertTriangle className="size-5 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-amber-200 tracking-widest mb-1">Low Balance Alert</p>
              <p className="text-[9px] text-amber-300/60 font-bold uppercase leading-relaxed">
                Your balance is below 10 💎. You might not be able to join Private Rooms. Watch an ad to recharge!
              </p>
            </div>
          </div>
        )}

        {/* Reward Hub */}
        <section className="bg-[#3D263D]/60 border border-white/10 rounded-[3.5rem] p-8 text-center backdrop-blur-xl relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          
          <div className="size-20 bg-gradient-to-tr from-[#F472B6] to-[#E11D48] rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl romantic-glow">
            <PlayCircle className="size-12 text-white" />
          </div>
          
          <div className="space-y-2 mb-8">
            <h3 className="text-2xl font-black uppercase tracking-tight italic">Reward Hub</h3>
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="size-3 text-amber-400 fill-current" />
              <p className="text-[11px] text-[#FDA4AF] font-black uppercase tracking-[0.2em]">+5 Diamonds Per Ad</p>
            </div>
          </div>
          
          <Button 
            onClick={handleWatchAd} 
            disabled={isWatching || isAiChecking || isLoading} 
            className={cn(
              "w-full h-16 rounded-[2.2rem] font-black uppercase tracking-widest transition-all gap-3 shadow-xl active:scale-95", 
              (isWatching || isAiChecking) ? "bg-slate-800" : "romantic-gradient hover:shadow-primary/40"
            )}
          >
            {isAiChecking ? (
              <><Loader2 className="size-5 animate-spin" /> AI SCANNING...</>
            ) : isWatching ? (
              <><Zap className="size-5 text-amber-400 animate-pulse" /> SYNCING {adTimer}s</>
            ) : (
              <><PlayCircle className="size-5" /> CLAIM REWARD</>
            )}
          </Button>

          <p className="text-[8px] text-white/20 font-black uppercase mt-6 tracking-[0.3em]">Ad Engine Status: {adLoaded ? "Online" : "Initializing..."}</p>
        </section>

        {/* Transaction History Mock */}
        <section className="space-y-4 pb-10">
          <div className="flex items-center justify-between px-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Recent Activity</h4>
            <Badge variant="outline" className="text-[8px] border-white/5 opacity-40">AUTO-LOG</Badge>
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
              <span className="text-xs font-black text-green-400">+5 💎</span>
            </div>
            <div className="p-5 flex items-center justify-between opacity-50">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center"><Zap className="size-4 text-primary" /></div>
                <div>
                  <p className="text-[10px] font-black uppercase">Welcome Bonus</p>
                  <p className="text-[8px] text-white/40 font-bold uppercase">Account Created</p>
                </div>
              </div>
              <span className="text-xs font-black text-primary">+20 💎</span>
            </div>
          </div>
        </section>
      </main>

      {/* AI Scanning / Watching Overlay */}
      {(isWatching || isAiChecking) && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
           <div className="absolute top-10 right-10 px-6 py-3 bg-white/5 border border-white/10 rounded-full text-xs font-black tracking-widest">
             {isAiChecking ? "SCANNING" : `${adTimer}s`}
           </div>
           
           <div className="relative size-56 mx-auto">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div className="relative size-full bg-[#1A0F1A] border-4 border-primary rounded-full flex flex-col items-center justify-center shadow-[0_0_60px_rgba(225,29,72,0.4)]">
                 {isAiChecking ? (
                   <>
                     <Search className="size-16 text-primary animate-pulse mb-4" />
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Checking Ad Source</p>
                   </>
                 ) : (
                   <>
                     <Zap className="size-20 text-primary animate-bounce mb-4" />
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Signal Sync Active</p>
                   </>
                 )}
              </div>
           </div>
           
           <h2 className="text-3xl font-black uppercase italic tracking-widest mt-12 text-center leading-none">
             {isAiChecking ? "AI Verification" : "Secure Node"}
           </h2>
           <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-4 text-center max-w-[200px] leading-relaxed">
             {isAiChecking 
               ? "Analyzing partner ad connection for safe reward delivery." 
               : "Watching secure romantic sponsor ad. Reward is processing."}
           </p>

           <div className="absolute bottom-20 flex items-center gap-2">
             <ShieldCheck className="size-4 text-green-500" />
             <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Stream-X Security Tunnel Active</span>
           </div>
        </div>
      )}

      {showRewardSuccess && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center pointer-events-none p-6">
           <div className="bg-green-500 text-white px-10 py-6 rounded-[2.5rem] flex flex-col items-center gap-3 animate-in zoom-in shadow-[0_0_50px_rgba(34,197,94,0.4)] border-4 border-white/20">
              <CheckCircle2 className="size-12" />
              <div className="text-center">
                <span className="text-xl font-black uppercase tracking-widest block">BOOST COLLECTED</span>
                <span className="text-sm font-bold opacity-80">+5 DIAMONDS ADDED</span>
              </div>
           </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}

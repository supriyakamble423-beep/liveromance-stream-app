'use client';

import { useState, useEffect } from 'react';
import { Zap, PlayCircle, Sparkles, ChevronLeft, Loader2, Heart, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFirebase } from "@/firebase";
import { doc, onSnapshot, updateDoc, increment, serverTimestamp, getDoc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";

/**
 * RewardWallet: Optimized for real-time Diamond sync and high-CTR Ad integration.
 */
export default function RewardWallet() {
  const { firestore, user, auth, areServicesAvailable } = useFirebase();
  const { toast } = useToast();
  const [balance, setBalance] = useState<number>(0);
  const [isWatching, setIsWatching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !user?.uid) {
      if (!user) setIsLoading(false);
      return;
    }

    const userRef = doc(firestore, 'users', user.uid);
    
    // Real-time listener for balance sync
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setBalance(snap.data()?.diamonds || 0);
      } else {
        // Fallback for new users if provider logic delay
        setBalance(50); 
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Wallet sync error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, user?.uid]);

  const handleWatchAd = async () => {
    if (!user && auth) {
      await initiateAnonymousSignIn(auth);
      toast({ title: "Connecting Node..." });
      return;
    }

    if (!areServicesAvailable || !user) return;

    setIsWatching(true);
    // Simulate high-revenue redirect
    window.open('https://www.highrevenuegate.com/direct-link', '_blank');
    
    // Reward logic after delay
    setTimeout(async () => {
      try {
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, { 
          diamonds: increment(5), 
          updatedAt: serverTimestamp() 
        });
        toast({ 
          title: "🎉 5 Diamonds Credited!", 
          description: "Your vault has been updated.",
          className: "romantic-glow bg-primary text-white border-none"
        });
      } catch (e) {
        console.error("Reward sync failed", e);
      } finally {
        setIsWatching(false);
      }
    }, 3000);
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-lg mx-auto border-x border-white/5 mesh-gradient text-white pb-24">
      <header className="flex items-center justify-between px-8 pt-16 pb-6 bg-[#2D1B2D]/60 backdrop-blur-2xl">
        <Link href="/global">
          <Button variant="ghost" size="icon" className="rounded-full bg-white/5 border border-white/10 size-12">
            <ChevronLeft className="size-6" />
          </Button>
        </Link>
        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Diamond Vault</h1>
        <div className="size-12" />
      </header>

      <main className="flex-1 overflow-y-auto px-8 space-y-10 pt-8 no-scrollbar">
        {/* Balance Card - Ultra Premium */}
        <div className="bg-gradient-to-br from-[#E11D48] via-[#F472B6] to-[#E11D48] p-10 rounded-[4rem] shadow-2xl relative overflow-hidden romantic-glow">
          <div className="absolute top-0 right-0 p-6 opacity-30">
            <Wallet className="size-40 rotate-12 fill-white" />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-black uppercase tracking-[0.4em] mb-3 opacity-80">Available Diamonds</p>
            <div className="flex items-center gap-4">
              <span className="text-6xl font-black italic tracking-tighter">
                {isLoading ? "..." : `💎 ${balance}`}
              </span>
              <Sparkles className="size-8 text-yellow-300 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Action Center */}
        <section className="bg-[#3D263D]/60 border border-white/10 rounded-[3.5rem] p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="size-20 bg-gradient-to-tr from-[#F472B6] to-[#E11D48] rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/30">
            <PlayCircle className="size-12 text-white" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight italic">Watch & Earn</h3>
          <p className="text-[11px] text-[#FDA4AF] font-black uppercase tracking-widest mt-2 mb-8">Instant Reward: +5 Diamonds</p>
          
          <Button 
            onClick={handleWatchAd} 
            disabled={isWatching} 
            className="w-full h-16 rounded-[2rem] romantic-gradient font-black uppercase tracking-widest text-white shadow-xl active:scale-95 transition-all"
          >
            {isWatching ? <Loader2 className="animate-spin mr-2" /> : <PlayCircle className="size-5 mr-2" />}
            {user ? "Claim Reward Now" : "Connect to Earn"}
          </Button>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-center">
            <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Conversion</p>
            <p className="text-sm font-black text-green-400">1k = ₹20</p>
          </div>
          <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-center">
            <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Status</p>
            <p className="text-sm font-black text-primary">Platinum</p>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
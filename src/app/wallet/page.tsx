'use client';

import { useState } from 'react';
import { Zap, PlayCircle, Sparkles, ChevronLeft, Loader2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";

export default function RewardWallet() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [isWatching, setIsWatching] = useState(false);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userData, isLoading } = useDoc(userRef);

  const handleWatchAd = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Sign in required" });
      return;
    }
    setIsWatching(true);
    window.open('https://www.highrevenuegate.com/example-link', '_blank');
    try {
      if (userRef) {
        await updateDoc(userRef, { coins: increment(5), updatedAt: serverTimestamp() });
        toast({ title: "🎉 Reward Received!", className: "romantic-glow bg-primary text-white border-none" });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Sync failed" });
    } finally {
      setIsWatching(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-lg mx-auto border-x border-white/5 mesh-gradient text-white pb-24">
      <header className="flex items-center justify-between px-8 pt-16 pb-6 bg-[#2D1B2D]/60 backdrop-blur-2xl">
        <Link href="/global">
          <Button variant="ghost" size="icon" className="rounded-full bg-white/5 border border-white/10 size-12">
            <ChevronLeft className="size-6" />
          </Button>
        </Link>
        <h1 className="text-2xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-white to-[#FDA4AF] bg-clip-text text-transparent">Diamond Hub</h1>
        <div className="size-12" />
      </header>

      <main className="flex-1 overflow-y-auto px-8 space-y-10 pt-8 no-scrollbar">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#E11D48] via-[#F472B6] to-[#E11D48] p-10 rounded-[4rem] shadow-[0_30px_60px_rgba(225,29,72,0.4)] romantic-card-glow border-none">
          <div className="absolute top-0 right-0 p-6 opacity-30">
            <Heart className="size-40 rotate-12 fill-white" />
          </div>
          
          <div className="relative z-10">
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/90 mb-3">Total Balance</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-6xl font-black italic tracking-tighter text-white">
                {isLoading ? <Loader2 className="animate-spin size-10" /> : (userData?.coins || 0)}
              </span>
              <Sparkles className="size-8 text-yellow-300 animate-pulse drop-shadow-[0_0_15px_rgba(253,224,71,0.8)]" />
            </div>
            <p className="text-[10px] font-black mt-8 bg-black/20 w-fit px-5 py-2 rounded-full backdrop-blur-xl border border-white/10 uppercase tracking-widest">
              Est. Value: ₹{((userData?.coins || 0) / 10).toFixed(2)}
            </p>
          </div>
        </div>

        <section className="bg-[#3D263D]/60 border border-white/10 rounded-[3.5rem] p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="size-20 bg-gradient-to-tr from-[#F472B6] to-[#E11D48] rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/30">
            <PlayCircle className="size-12 text-white" />
          </div>
          
          <h3 className="text-xl font-black uppercase tracking-tight italic text-white">Free Diamonds</h3>
          <p className="text-[11px] text-[#FDA4AF] font-black uppercase tracking-[0.2em] mt-2 mb-8">
            Instant Credit: <span className="text-white">+5 Coins</span>
          </p>

          <Button 
            onClick={handleWatchAd}
            disabled={isWatching}
            className="w-full h-16 rounded-[2rem] romantic-gradient font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:scale-105 transition-all border-none text-white"
          >
            {isWatching ? <Loader2 className="animate-spin mr-2" /> : <PlayCircle className="size-5 mr-2" />}
            Watch & Earn
          </Button>
        </section>

        <div className="space-y-5 pb-12">
          <p className="text-[11px] font-black text-[#FDA4AF]/60 uppercase tracking-[0.3em] pl-4">Premium Bundles</p>
          
          {[
            { coins: 500, price: "₹49", bonus: "10%" },
            { coins: 1200, price: "₹99", bonus: "25%", popular: true },
            { coins: 5000, price: "₹399", bonus: "50%" },
          ].map((pkg, i) => (
            <div key={i} className={cn(
              "p-6 rounded-[3rem] border flex justify-between items-center transition-all duration-500 backdrop-blur-md",
              pkg.popular ? "border-[#F472B6]/30 bg-[#F472B6]/10 shadow-2xl" : "border-white/5 bg-white/5"
            )}>
              <div className="flex items-center gap-5">
                <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                  <Zap className="size-6 text-yellow-400 fill-current" />
                </div>
                <div>
                  <p className="text-base font-black italic tracking-tighter text-white">{pkg.coins} Coins</p>
                  <p className="text-[10px] font-black text-[#F472B6] uppercase tracking-widest">+{pkg.bonus} Bonus</p>
                </div>
              </div>
              <Button size="sm" className="rounded-2xl h-12 px-8 font-black bg-white text-[#E11D48] hover:bg-slate-100 text-[11px] border-none shadow-xl">
                {pkg.price}
              </Button>
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

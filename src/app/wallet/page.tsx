'use client';

import { useState, useEffect } from 'react';
import { Zap, PlayCircle, Gift, Heart, Sparkles, ChevronLeft, Loader2 } from "lucide-react";
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
      toast({ variant: "destructive", title: "Sign in required", description: "Log in to earn rewards." });
      return;
    }

    setIsWatching(true);
    
    // Simulate Ad experience
    // Adsterra Direct Link logic
    const adUrl = "https://www.highrevenuegate.com/example-link"; // Replace with real Adsterra link
    window.open(adUrl, '_blank');

    try {
      if (userRef) {
        // Add 5 coins reward
        await updateDoc(userRef, {
          coins: increment(5),
          updatedAt: serverTimestamp()
        });
        
        toast({ 
          title: "🎉 Reward Received!", 
          description: "5 Coins added to your heart wallet! ❤️",
          className: "romantic-glow bg-primary text-white border-none"
        });
      }
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error", description: "Reward sync failed." });
    } finally {
      setIsWatching(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-lg mx-auto border-x border-white/10 bg-[#0F0101] text-white pb-20">
      <header className="flex items-center justify-between px-6 pt-10 pb-4 bg-black/40 backdrop-blur-md">
        <Link href="/global">
          <Button variant="ghost" size="icon" className="rounded-full bg-white/5">
            <ChevronLeft className="size-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-black italic uppercase tracking-tighter">Diamond Hub</h1>
        <div className="size-10" />
      </header>

      <main className="flex-1 overflow-y-auto px-6 space-y-6 pt-6 no-scrollbar">
        {/* --- Wallet Balance Card --- */}
        <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-pink-600 to-rose-700 p-8 rounded-[3rem] shadow-[0_20px_50px_rgba(225,29,72,0.3)] romantic-card-glow">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Heart className="size-32 rotate-12 fill-white" />
          </div>
          
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">My Heart Balance</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-5xl font-black italic tracking-tighter">
                {isLoading ? <Loader2 className="animate-spin size-8" /> : (userData?.coins || 0)}
              </span>
              <Sparkles className="size-6 text-yellow-300 animate-pulse" />
            </div>
            <p className="text-[10px] font-bold mt-4 bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-md">
              Estimated Value: ₹{((userData?.coins || 0) / 10).toFixed(2)}
            </p>
          </div>
        </div>

        {/* --- Watch Ad Section --- */}
        <section className="bg-white/5 border border-pink-500/20 rounded-[2.5rem] p-6 text-center romantic-card-glow">
          <div className="size-16 bg-gradient-to-tr from-pink-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/20">
            <PlayCircle className="size-10 text-white fill-pink-600/20" />
          </div>
          
          <h3 className="text-lg font-black uppercase tracking-tight italic">Free Diamonds</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 mb-6">
            Watch a quick video and get <span className="text-pink-500">+5 Coins</span>
          </p>

          <Button 
            onClick={handleWatchAd}
            disabled={isWatching}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-red-600 to-pink-500 hover:scale-[1.02] transition-transform font-black uppercase tracking-widest text-[11px] shadow-lg shadow-red-600/20 romantic-glow border-none"
          >
            {isWatching ? <Loader2 className="animate-spin mr-2" /> : <PlayCircle className="size-4 mr-2" />}
            Watch & Earn Now
          </Button>
        </section>

        {/* --- Quick Recharge Packs --- */}
        <div className="grid grid-cols-1 gap-4 pb-10">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-2">Top-up Packages</p>
          
          {[
            { coins: 500, price: "₹49", bonus: "10%" },
            { coins: 1200, price: "₹99", bonus: "25%", popular: true },
            { coins: 5000, price: "₹399", bonus: "50%" },
          ].map((pkg, i) => (
            <div key={i} className={cn(
              "p-5 rounded-[2rem] border flex justify-between items-center transition-all hover:bg-white/10",
              pkg.popular ? "border-pink-500 bg-pink-500/5 shadow-lg shadow-pink-500/10" : "border-white/5 bg-white/5"
            )}>
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <Zap className="size-5 text-yellow-400 fill-current" />
                </div>
                <div>
                  <p className="text-sm font-black italic tracking-tight">{pkg.coins} Coins</p>
                  <p className="text-[8px] font-black text-pink-500 uppercase">+{pkg.bonus} Extra Bonus</p>
                </div>
              </div>
              <Button size="sm" className="rounded-xl h-10 px-6 font-black bg-white text-black hover:bg-slate-100 text-[10px] border-none">
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

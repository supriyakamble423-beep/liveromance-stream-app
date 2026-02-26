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
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";

export default function RewardWallet() {
  const { firestore, user, auth, areServicesAvailable } = useFirebase();
  const { toast } = useToast();
  const [isWatching, setIsWatching] = useState(false);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userData, isLoading } = useDoc(userRef);

  const handleWatchAd = async () => {
    if (!user && auth) {
      initiateAnonymousSignIn(auth);
      toast({ title: "Connecting..." });
      return;
    }

    if (!areServicesAvailable) return;

    setIsWatching(true);
    // Logic: In a real app, integrate high-revenue ad network here
    window.open('https://www.highrevenuegate.com/example', '_blank');
    
    try {
      if (userRef) {
        // Increment diamonds balance
        await updateDoc(userRef, { diamonds: increment(5), updatedAt: serverTimestamp() });
        toast({ title: "🎉 Reward Received!", description: "5 Diamonds added to your vault.", className: "romantic-glow bg-primary text-white" });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Sync failed" });
    } finally {
      setIsWatching(false);
    }
  };

  const balance = userData?.diamonds || 0;

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-lg mx-auto border-x border-white/5 mesh-gradient text-white pb-24">
      <header className="flex items-center justify-between px-8 pt-16 pb-6 bg-[#2D1B2D]/60 backdrop-blur-2xl">
        <Link href="/global"><Button variant="ghost" size="icon" className="rounded-full bg-white/5 border border-white/10 size-12"><ChevronLeft className="size-6" /></Button></Link>
        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Diamond Hub</h1>
        <div className="size-12" />
      </header>

      <main className="flex-1 overflow-y-auto px-8 space-y-10 pt-8 no-scrollbar">
        {/* Diamond Balance Card */}
        <div className="bg-gradient-to-br from-[#E11D48] via-[#F472B6] to-[#E11D48] p-10 rounded-[4rem] shadow-2xl relative overflow-hidden romantic-glow">
          <div className="absolute top-0 right-0 p-6 opacity-30"><Heart className="size-40 rotate-12 fill-white" /></div>
          <div className="relative z-10">
            <p className="text-[11px] font-black uppercase tracking-[0.4em] mb-3">Net Balance</p>
            <div className="flex items-center gap-4">
              <span className="text-6xl font-black italic tracking-tighter">
                {isLoading ? <Loader2 className="animate-spin size-10" /> : `💎 ${balance}`}
              </span>
              <Sparkles className="size-8 text-yellow-300 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Watch & Earn Section */}
        <section className="bg-[#3D263D]/60 border border-white/10 rounded-[3.5rem] p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="size-20 bg-gradient-to-tr from-[#F472B6] to-[#E11D48] rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/30"><PlayCircle className="size-12 text-white" /></div>
          <h3 className="text-xl font-black uppercase tracking-tight italic">Free Diamonds</h3>
          <p className="text-[11px] text-[#FDA4AF] font-black uppercase tracking-widest mt-2 mb-8">Instant Credit: +5 Diamonds</p>
          <Button onClick={handleWatchAd} disabled={isWatching} className="w-full h-16 rounded-[2rem] romantic-gradient font-black uppercase tracking-widest text-white shadow-xl">
            {isWatching ? <Loader2 className="animate-spin" /> : <PlayCircle className="size-5 mr-2" />}
            {user ? "Watch & Earn" : "Connect & Earn"}
          </Button>
        </section>

        {/* Info Banner */}
        <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="size-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest">Premium Rewards</span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">
            Diamonds can be converted to cash or used to unlock private sessions with global hosts.
          </p>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

'use client';

import { useState, useEffect } from "react";
import { useFirebase } from "@/firebase";
import { doc, updateDoc, increment, serverTimestamp, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Trophy, PlayCircle, ShieldCheck, Wallet } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

export default function WalletPage() {
  const { user, firestore, areServicesAvailable } = useFirebase();
  const { toast } = useToast();
  const [balance, setBalance] = useState(0);
  const [adLoading, setAdLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Real-time balance listener
  useEffect(() => {
    if (!user || !firestore) {
      setIsLoading(false);
      return;
    }
    
    const userRef = doc(firestore, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setBalance(snap.data()?.diamonds || 0);
      }
      setIsLoading(false);
    }, (err) => {
      console.error("Balance fetch error:", err);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [user, firestore]);

  const isLowBalance = balance < 50;

  const handleWatchAd = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to earn diamonds.",
        variant: "destructive"
      });
      return;
    }

    setAdLoading(true);

    try {
      // Adsterra Direct Link Simulation / Placeholder
      const adsterraLink = "https://www.topcreativeformat.com/28788998/invoke.js"; 
      
      const adWindow = window.open(adsterraLink, '_blank', 'width=500,height=700');

      if (!adWindow) {
        toast({
          variant: "destructive",
          title: "Popup Blocked",
          description: "Please allow popups to watch ads and earn."
        });
        setAdLoading(false);
        return;
      }

      // Reward user after 8 seconds (Simulated engagement)
      setTimeout(async () => {
        try {
          if (firestore && user) {
            const userRef = doc(firestore, 'users', user.uid);
            
            await updateDoc(userRef, {
              diamonds: increment(2),
              lastAdWatched: serverTimestamp(),
              totalAdsWatched: increment(1),
              updatedAt: serverTimestamp()
            });

            toast({
              title: "🎉 +2 Diamonds!",
              description: "AI Agent verified your engagement."
            });
          }
        } catch (error) {
          console.error("Reward error:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to sync reward."
          });
        } finally {
          setAdLoading(false);
        }
      }, 8000);

    } catch (error) {
      console.error("Ad error:", error);
      toast({
        variant: "destructive",
        title: "Ad Error",
        description: "Ad could not be loaded."
      });
      setAdLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white pb-32 max-w-lg mx-auto border-x border-white/5 mesh-gradient">
      <header className="p-8 pt-16 bg-primary/10 rounded-b-[3.5rem] border-b border-white/5 mb-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="size-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 romantic-glow">
            <Wallet className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter">Diamond Vault</h1>
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">Secure Node Assets</p>
          </div>
        </div>

        <div className="bg-[#3D263D]/80 p-8 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden romantic-glow">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Trophy className="size-24" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-80">Diamond Balance</p>
              {isLowBalance && <Badge className="bg-white/20 text-white border-none text-[8px] animate-pulse">RECHARGE NEEDED</Badge>}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black italic tracking-tighter">
                {isLoading ? <Loader2 className="size-10 animate-spin inline-block" /> : `💎 ${balance}`}
              </span>
            </div>
            <div className="h-px bg-white/10 my-4" />
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Value: ₹{(balance * 0.02).toFixed(2)}</p>
              <ShieldCheck className="size-4 text-green-500" />
            </div>
          </div>
        </div>
      </header>

      <main className="px-8 space-y-8">
        <section className="bg-white/5 border border-primary/20 rounded-[2.5rem] p-8 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="size-20 bg-gradient-to-tr from-primary to-secondary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-3 group-hover:rotate-0 transition-transform">
            <PlayCircle size={40} className="text-white fill-current" />
          </div>
          <h3 className="text-xl font-black uppercase italic tracking-tight mb-2">Free Diamonds</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-8 leading-relaxed">
            Watch a high-CPM Social Bar ad <br/>and earn <span className="text-primary">+2 Diamonds</span> instantly.
          </p>

          <Button
            onClick={handleWatchAd}
            disabled={adLoading || !areServicesAvailable}
            className="w-full h-16 rounded-2xl romantic-gradient hover:scale-[1.02] transition-transform font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-primary/20"
          >
            {adLoading ? (
              <><Loader2 className="size-4 animate-spin mr-2" /> AI Verifying...</>
            ) : (
              <><Sparkles className="size-4 mr-2" /> Watch & Earn Now</>
            )}
          </Button>

          <p className="text-[9px] text-white/30 mt-6 uppercase font-black tracking-widest">
            AI Agent monitors engagement for reward release
          </p>
        </section>

        <section className="p-6 bg-slate-900/50 rounded-3xl border border-white/5 flex items-center gap-4">
          <div className="size-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-white mb-0.5">Secure Transfers</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase leading-tight">All earnings are encrypted and synced to the global grid.</p>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

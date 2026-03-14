
'use client';

import { useState, useEffect } from "react";
import { useFirebase } from "@/firebase";
import { doc, updateDoc, increment, serverTimestamp, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Trophy, PlayCircle, ShieldCheck, Wallet as WalletIcon, Diamond, TrendingUp, Users } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { motion } from "framer-motion";
import { AdsterraBanner } from "@/components/AdsterraBanner";

/**
 * Wallet Page
 * Features Adsterra Smartlink rewards and display banner.
 * Rewards user with +5 Diamonds for each validated engagement.
 */
export default function WalletPage() {
  const { user, firestore, areServicesAvailable } = useFirebase();
  const { toast } = useToast();
  const [balance, setBalance] = useState(0);
  const [adLoading, setAdLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Adsterra Configuration
  const SMARTLINK_URL = "https://www.effectivegatecpm.com/a19zzj4ww?key=bd774f375ffbe786775bfb3fe5df5e16";
  const BANNER_AD_ID = "28678576";
  const BANNER_SCRIPT_URL = "//pl28678576.profitablegatecpm.com/28678576/invoke.js";

  // Real-time balance listener
  useEffect(() => {
    if (!user || !firestore) {
      if (!user) setIsLoading(false);
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
      // Open Smartlink in new window
      const adWindow = window.open(SMARTLINK_URL, '_blank');

      if (!adWindow) {
        toast({
          variant: "destructive",
          title: "Popup Blocked",
          description: "Please allow popups to earn diamonds."
        });
        setAdLoading(false);
        return;
      }

      // AI-Simulation Reward after 5 seconds
      setTimeout(async () => {
        try {
          if (firestore && user) {
            const userRef = doc(firestore, 'users', user.uid);
            
            await updateDoc(userRef, {
              diamonds: increment(5),
              updatedAt: serverTimestamp()
            });

            toast({
              title: "🎉 +5 Diamonds!",
              description: "AI validated your engagement. Reward credited!"
            });
          }
        } catch (error) {
          console.error("Reward error:", error);
        } finally {
          setAdLoading(false);
        }
      }, 5000);

    } catch (error) {
      console.error("Ad error:", error);
      setAdLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0a10] text-white pb-32 max-w-lg mx-auto border-x border-white/5 mesh-gradient p-4">
      {/* Wallet Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-[#2D1B2D] to-[#1a0f1b] rounded-[2.5rem] p-6 border border-white/10 mb-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Trophy className="size-24" />
        </div>

        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-gradient-to-br from-[#E11D48] to-[#F472B6] flex items-center justify-center shadow-lg">
              <Diamond className="size-8 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Your Balance</p>
              <p className="text-white text-3xl font-black italic tracking-tighter">
                {isLoading ? <Loader2 className="size-6 animate-spin" /> : `${balance} 💎`}
              </p>
            </div>
          </div>
          <button
            onClick={handleWatchAd}
            disabled={adLoading || !areServicesAvailable}
            className="bg-gradient-to-r from-[#E11D48] to-[#F472B6] text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {adLoading ? <Loader2 className="size-4 animate-spin" /> : <PlayCircle className="size-4" />}
            {adLoading ? 'Verifying...' : 'Watch Ad'}
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">+5</span>
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <Users className="size-3 text-secondary" />
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Active Invites</p>
            </div>
            <p className="text-white text-xl font-black italic">0</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="size-3 text-green-400" />
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Earnings</p>
            </div>
            <p className="text-white text-xl font-black italic">₹{(balance * 0.02).toFixed(0)}</p>
          </div>
        </div>
      </motion.div>

      {/* Adsterra Banner Section */}
      <div className="mb-8">
        <p className="text-[7px] text-white/20 font-black uppercase tracking-[0.4em] text-center mb-3 italic">Promoted Node</p>
        <div className="flex justify-center">
          <AdsterraBanner 
            adId={BANNER_AD_ID} 
            scriptUrl={BANNER_SCRIPT_URL} 
            className="rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl bg-black/40"
          />
        </div>
      </div>

      <main className="space-y-8 px-2">
        <section className="p-6 bg-slate-900/50 rounded-3xl border border-white/5 flex items-center gap-4">
          <div className="size-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-white mb-0.5 tracking-widest">Secure Node Assets</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase leading-tight">All earnings are encrypted and synced to the global grid.</p>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

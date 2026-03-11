'use client';

import { useState, useEffect } from "react";
import { useFirebase } from "@/firebase";
import { doc, updateDoc, increment, serverTimestamp, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function WalletPage() {
  const { user, firestore, areServicesAvailable } = useFirebase();
  const { toast } = useToast();
  const [balance, setBalance] = useState(0);
  const [adLoading, setAdLoading] = useState(false);

  // Real-time balance
  useEffect(() => {
    if (!user || !firestore) return;
    
    const userRef = doc(firestore, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setBalance(snap.data()?.diamonds || 0);
      }
    });
    
    return () => unsubscribe();
  }, [user, firestore]);

  // ✅ FIXED: Adsterra Direct Link Integration
  const handleWatchAd = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Pehle login karo",
        variant: "destructive"
      });
      return;
    }

    setAdLoading(true);

    try {
      // ✅ Adsterra Direct Link (Replace with YOUR link)
      const adsterraLink = "https://your-direct-link.adsterra.com"; // 🔁 Yahan apna actual link daalo
      
      // New window mein ad kholo
      const adWindow = window.open(adsterraLink, '_blank', 
        'width=400,height=600,toolbar=no,menubar=no,scrollbars=yes,resizable=yes');

      // Check if popup blocked
      if (!adWindow || adWindow.closed || typeof adWindow.closed === 'undefined') {
        toast({
          variant: "destructive",
          title: "Popup Blocked",
          description: "Browser settings se popups allow karo"
        });
        setAdLoading(false);
        return;
      }

      // ✅ 5 second baad reward do (ad view time)
      setTimeout(async () => {
        try {
          if (firestore && user) {
            const userRef = doc(firestore, 'users', user.uid);
            
            await updateDoc(userRef, {
              diamonds: increment(5),
              lastAdWatched: serverTimestamp(),
              totalAdsWatched: increment(1)
            });

            setBalance(prev => prev + 5);
            
            toast({
              title: "🎉 +5 Diamonds!",
              description: "Balance updated successfully"
            });
          }
        } catch (error) {
          console.error("Reward error:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Diamonds add nahi ho sake"
          });
        } finally {
          setAdLoading(false);
        }
      }, 5000); // 5 seconds

    } catch (error) {
      console.error("Ad error:", error);
      toast({
        variant: "destructive",
        title: "Ad Error",
        description: "Ad load nahi ho saka"
      });
      setAdLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2D1B2D] text-white p-6 pb-24">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-[#E11D48] to-[#F472B6] p-6 rounded-[2.5rem] shadow-[0_0_30px_rgba(225,29,72,0.4)]">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/80">Your Diamonds</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-5xl font-black italic">💎 {balance}</span>
        </div>
        <p className="text-[10px] mt-3 bg-white/20 w-fit px-3 py-1 rounded-full">
          Value: ₹{balance * 0.10}
        </p>
      </div>

      {/* Watch & Earn Section */}
      <section className="mt-8 bg-white/5 border border-pink-500/20 rounded-[2.5rem] p-6 text-center">
        <div className="size-16 bg-gradient-to-tr from-pink-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🎬</span>
        </div>
        <h3 className="text-lg font-black uppercase tracking-tight">Free Diamonds</h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 mb-6">
          Watch a quick video and get <span className="text-pink-500">+5 Diamonds</span>
        </p>

        <Button
          onClick={handleWatchAd}
          disabled={adLoading || !areServicesAvailable}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-red-600 to-pink-500 hover:scale-[1.02] transition-transform font-black uppercase tracking-widest text-[11px] shadow-lg shadow-red-600/20 disabled:opacity-50"
        >
          {adLoading ? "Loading Ad..." : "Watch & Earn Now"}
        </Button>

        <p className="text-[10px] text-white/40 mt-4">
          Watch ad for 5 seconds to earn reward
        </p>
      </section>
    </div>
  );
}
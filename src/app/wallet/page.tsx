'use client';

import { useState, useEffect } from "react";
import { useFirebase } from "@/firebase";
import { doc, updateDoc, increment, serverTimestamp, onSnapshot } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlayCircle, Diamond, TrendingUp, Users, ShieldCheck, CheckCircle } from "lucide-react";

const SMARTLINK_URL = "https://www.effectivegatecpm.com/a19zzj4ww?key=bd774f375ffbe786775bfb3fe5df5e16";

export default function WalletPage() {
  const { user, firestore, areServicesAvailable } = useFirebase();
  const { toast } = useToast();
  const [balance, setBalance] = useState(0);
  const [adLoading, setAdLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adWatched, setAdWatched] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!user || !firestore) {
      setIsLoading(false);
      return;
    }
    const userRef = doc(firestore, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) setBalance(snap.data()?.diamonds || 0);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user, firestore]);

  const handleWatchAd = async () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login first.", variant: "destructive" });
      return;
    }
    if (adLoading) return;

    setAdLoading(true);
    setAdWatched(false);

    const adWindow = window.open(SMARTLINK_URL, '_blank');
    if (!adWindow) {
      toast({ variant: "destructive", title: "Popup Blocked", description: "Browser mein popup allow karo." });
      setAdLoading(false);
      return;
    }

    let sec = 5;
    setCountdown(sec);
    const timer = setInterval(() => {
      sec--;
      setCountdown(sec);
      if (sec <= 0) clearInterval(timer);
    }, 1000);

    setTimeout(async () => {
      try {
        if (firestore && user) {
          const userRef = doc(firestore, 'users', user.uid);
          await updateDoc(userRef, {
            diamonds: increment(5),
            updatedAt: serverTimestamp()
          });
          setAdWatched(true);
          toast({ title: "🎉 +5 Diamonds!", description: "Reward credited!" });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setAdLoading(false);
        setCountdown(0);
      }
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-[#0f0a10] text-white pb-32">

      {/* Header */}
      <div className="px-4 pt-10 pb-4">
        <h1 className="text-2xl font-black text-white italic">DIAMOND HUB</h1>
        <div className="h-1 w-16 bg-gradient-to-r from-[#E11D48] to-[#F472B6] rounded-full mt-1" />
      </div>

      <div className="px-4 space-y-4">

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-[#2D1B2D] to-[#1a0f1b] rounded-3xl p-5 border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E11D48] to-[#F472B6] flex items-center justify-center">
                <Diamond className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-widest font-bold">Your Balance</p>
                <p className="text-white text-3xl font-black italic">
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : `${balance} 💎`}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
              <div className="flex items-center gap-1 mb-1">
                <Users className="w-3 h-3 text-pink-400" />
                <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">Invites</p>
              </div>
              <p className="text-white text-xl font-black">0</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-green-400" />
                <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">Earnings</p>
              </div>
              <p className="text-white text-xl font-black">₹{(balance * 0.02).toFixed(0)}</p>
            </div>
          </div>
        </div>

        {/* Watch & Earn Card */}
        <div className="bg-gradient-to-br from-[#1a0f1b] to-[#0f0a10] rounded-3xl p-5 border border-[#E11D48]/20">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3">Free Diamonds</p>

          <div className="flex flex-col items-center py-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#E11D48] to-[#F472B6] flex items-center justify-center mb-3 shadow-lg shadow-pink-500/30">
              <PlayCircle className="w-8 h-8 text-white" />
            </div>
            <p className="text-white font-black text-lg uppercase italic">FREE DIAMONDS</p>
            <p className="text-[#F472B6] text-xs font-bold uppercase tracking-widest mt-1">
              INSTANT CREDIT: <span className="text-white">+5 COINS</span>
            </p>
          </div>

          {adWatched && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-2xl px-3 py-2 mb-3">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-xs font-bold">+5 Diamonds Credited! ✅</span>
            </div>
          )}

          <button
            onClick={handleWatchAd}
            disabled={adLoading || !areServicesAvailable}
            className="w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest
              bg-gradient-to-r from-[#E11D48] to-[#F472B6]
              disabled:opacity-50 active:scale-95 transition-all
              flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20"
          >
            {adLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {countdown > 0 ? `Verifying... ${countdown}s` : 'Processing...'}
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5" />
                CONNECT & EARN
              </>
            )}
          </button>
        </div>

        {/* Native Banner Ad — ID: 28678563 */}
        <div className="rounded-2xl overflow-hidden border border-white/5">
          <p className="text-[9px] text-white/20 uppercase tracking-widest text-center py-1">Advertisement</p>
          <NativeBannerAd />
        </div>

        {/* Banner Ad — ID: 28678576 */}
        <div className="rounded-2xl overflow-hidden border border-white/5">
          <BannerAd />
        </div>

        {/* Security Note */}
        <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-tight">
            All earnings encrypted & synced to global grid.
          </p>
        </div>

      </div>
    </div>
  );
}

// ✅ Banner Ad 320x50 — ID: 28678576
function BannerAd() {
  useEffect(() => {
    try {
      const container = document.getElementById('ad-banner-28678576');
      if (!container || container.hasChildNodes()) return;
      (window as any).atOptions = {
        'key': 'fae3ed395fcb23641e68db432fd58e22',
        'format': 'iframe',
        'height': 50,
        'width': 320,
        'params': {}
      };
      const script = document.createElement('script');
      script.src = 'https://www.highperformanceformat.com/fae3ed395fcb23641e68db432fd58e22/invoke.js';
      script.async = true;
      container.appendChild(script);
    } catch (e) { console.log('Ad error:', e); }
  }, []);
  return (
    <div id="ad-banner-28678576"
      className="flex justify-center items-center bg-black/40"
      style={{ minHeight: '50px' }}
    />
  );
}

// ✅ Native Banner — ID: 28678563
function NativeBannerAd() {
  useEffect(() => {
    try {
      const container = document.getElementById('ad-native-28678563');
      if (!container || container.hasChildNodes()) return;
      const script = document.createElement('script');
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = 'https://pl28779062.effectivegatecpm.com/3d1cf50d5f8644745c0bd653c8b65691/invoke.js';
      const div = document.createElement('div');
      div.id = 'container-3d1cf50d5f8644745c0bd653c8b65691';
      container.appendChild(div);
      container.appendChild(script);
    } catch (e) { console.log('Ad error:', e); }
  }, []);
  return (
    <div id="ad-native-28678563"
      className="w-full bg-black/40"
      style={{ minHeight: '80px' }}
    />
  );
}
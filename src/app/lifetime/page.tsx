
'use client';

import { BottomNav } from "@/components/BottomNav";
import { 
  ArrowLeft, Sparkles, TrendingUp, Users, Wallet, Trophy, 
  ChevronRight, Gift, ShieldCheck, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShareKit } from "@/components/ShareKit";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function LifetimeReferralHub() {
  const { user, firestore } = useFirebase();
  const userId = user?.uid;

  // Fetch referrals (hosts referred by this user)
  const referralsQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(
      collection(firestore, 'hosts'),
      where('referredBy', '==', userId),
      orderBy('updatedAt', 'desc'),
      limit(10)
    );
  }, [firestore, userId]);

  const { data: referrals, isLoading } = useCollection(referralsQuery);

  return (
    <div className="relative flex h-screen w-full max-w-lg flex-col bg-black overflow-x-hidden border-x border-white/10 mx-auto">
      <header className="flex items-center p-6 justify-between sticky top-0 bg-black/80 backdrop-blur-md z-30 border-b border-white/5">
        <Link href="/host-p">
          <Button variant="ghost" size="icon" className="rounded-full bg-white/5">
            <ArrowLeft className="size-5 text-white" />
          </Button>
        </Link>
        <h2 className="text-lg font-black italic uppercase tracking-tighter text-white">Viral Engine</h2>
        <div className="size-10" />
      </header>

      <div className="flex-1 overflow-y-auto pb-32 no-scrollbar px-6 pt-10 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <Badge variant="secondary" className="bg-primary/20 text-primary border-none text-[9px] font-black uppercase px-4 py-1 tracking-[0.2em] mb-2">
             1% Lifetime Residual
          </Badge>
          <h1 className="text-5xl font-black leading-none tracking-tighter uppercase italic">
            Viral <br/><span className="text-primary">Wealth</span>
          </h1>
          <p className="text-slate-400 text-xs font-medium max-w-[280px] mx-auto leading-relaxed uppercase">
            Onboard hosts & get 1% of their coin revenue for life. Organic growth starts here.
          </p>
        </div>

        {/* Share Kit Integration */}
        {userId && <ShareKit hostId={userId} username={user?.displayName || "HOST"} />}

        {/* Commission Tracker */}
        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-2 flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" /> Performance Index
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-1">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Network Earned</p>
              <div className="flex items-center gap-2">
                <Wallet className="text-amber-400 size-5" />
                <span className="text-3xl font-black italic tracking-tighter text-white">12k</span>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-1">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Nodes</p>
              <div className="flex items-center gap-2">
                <Users className="text-primary size-5" />
                <span className="text-3xl font-black italic tracking-tighter text-white">{referrals?.length || 0}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Referral List (A -> B) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
              <Zap className="size-4 text-secondary" /> My Network (A → B)
            </h3>
            <span className="text-[9px] font-black text-primary uppercase">Top Nodes</span>
          </div>
          
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-10 opacity-30"><TrendingUp className="animate-pulse" /></div>
            ) : referrals?.length === 0 ? (
              <div className="p-10 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                <p className="text-[10px] font-black text-slate-500 uppercase">No nodes connected yet.</p>
              </div>
            ) : referrals?.map((ref) => (
              <div key={ref.id} className="bg-white/5 rounded-[2rem] p-5 flex items-center justify-between border border-white/5 group hover:bg-white/10 transition-all">
                <div className="flex items-center gap-4">
                  <div className="relative size-12 rounded-2xl bg-slate-800 overflow-hidden">
                     <img src={ref.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ref.id}`} alt="Referral" className="object-cover w-full h-full" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-white tracking-tight">{ref.username || "Anonymous Host"}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Earned 50k Coins</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-green-400 tracking-tighter">+500</p>
                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Your 1%</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Program Goal Banner */}
        <section className="bg-gradient-to-br from-primary/20 to-secondary/20 p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy className="size-24 text-white" />
          </div>
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="size-5 text-white" />
            <h4 className="text-sm font-black uppercase tracking-widest text-white italic">Platinum Status</h4>
          </div>
          <p className="text-[11px] text-slate-300 font-bold uppercase leading-relaxed max-w-[240px]">
            Onboard <span className="text-white">10 active hosts</span> to unlock the 1.5% premium commission tier.
          </p>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}

'use client';

import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Globe, Zap, Users, Gift, TrendingUp, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BottomNav } from "@/components/BottomNav";

export default function InterestAndAnalytics() {
  const { firestore } = useFirebase();
  
  // 1. Fetching Live Hosts for Global Map logic
  const liveHostsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'hosts'), where('isLive', '==', true));
  }, [firestore]);
  
  const { data: liveHosts } = useCollection(liveHostsQuery);

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-28 max-w-lg mx-auto border-x border-white/10">
      {/* --- Global Live Traffic (World Map Logic) --- */}
      <header className="p-6 bg-gradient-to-b from-primary/20 to-transparent">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="size-5 text-primary animate-spin" />
          <h1 className="text-xl font-black uppercase tracking-tighter">Live World Traffic</h1>
        </div>
        <div className="relative h-48 w-full bg-slate-900/50 rounded-[2.5rem] border border-white/5 overflow-hidden flex items-center justify-center shadow-2xl">
          {/* Abstract Map Background */}
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/world-map.png')] bg-center bg-no-repeat" />
          
          {/* Pulsing Location Markers */}
          <div className="relative flex gap-8">
            <div className="flex flex-col items-center">
              <div className="size-3 bg-primary rounded-full animate-ping" />
              <span className="text-[10px] font-bold mt-1 uppercase text-slate-400">Asia</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="size-3 bg-secondary rounded-full animate-ping delay-75" />
              <span className="text-[10px] font-bold mt-1 uppercase text-slate-400">Americas</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="size-3 bg-green-500 rounded-full animate-ping delay-150" />
              <span className="text-[10px] font-bold mt-1 uppercase text-slate-400">Europe</span>
            </div>
          </div>

          <div className="absolute bottom-6 right-6 text-right">
            <p className="text-3xl font-black text-primary">{liveHosts?.length || 0}</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Active Hosts</p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* --- AI Optimizer Section --- */}
        <section className="bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-inner">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/10">
                <Zap className="size-6 fill-current" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-tight">AI Optimizer</h2>
                <p className="text-[9px] text-slate-400 font-bold uppercase">Smart Traffic Analysis</p>
              </div>
            </div>
            <Button size="sm" className="h-8 rounded-full text-[9px] font-black bg-primary px-4 shadow-lg shadow-primary/20">SCAN</Button>
          </div>
          
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-[10px] font-black mb-2 uppercase tracking-widest">
                <span>Peak Traffic Probability</span>
                <span className="text-primary">88%</span>
              </div>
              <Progress value={88} className="h-2.5 bg-white/5" />
            </div>
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <p className="text-[11px] text-slate-300 italic leading-relaxed">
                "AI Suggestion: Go live at <span className="text-primary font-black">9:00 PM IST</span> to reach maximum Indian and Middle-East audiences for better engagement."
              </p>
            </div>
          </div>
        </section>

        {/* --- Lifetime Referral & Earnings --- */}
        <section className="grid grid-cols-1 gap-4">
          <div className="bg-gradient-to-br from-secondary/20 to-transparent border border-white/5 rounded-[2.5rem] p-7 relative overflow-hidden group">
            <Gift className="absolute -bottom-6 -right-6 size-28 text-white/5 rotate-12 transition-transform group-hover:scale-110" />
            
            <div className="flex items-center gap-2 mb-8 text-secondary">
              <TrendingUp className="size-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Lifetime Referral</span>
            </div>

            <div className="flex justify-between items-end relative z-10">
              <div>
                <p className="text-4xl font-black tracking-tighter">142</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Total Invites</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-green-400">+$1,240</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Lifetime Commission</p>
              </div>
            </div>

            <Button variant="secondary" className="w-full mt-8 rounded-2xl font-black uppercase text-[10px] tracking-widest h-14 bg-secondary shadow-lg shadow-secondary/20 active:scale-95 transition-all">
              Share Referral Link
            </Button>
          </div>
        </section>

        {/* --- Quick Analytics Grid --- */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 shadow-xl">
            <Users className="size-6 text-blue-400 mb-3" />
            <p className="text-2xl font-black tracking-tighter">2.4k</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Social Reach</p>
          </div>
          <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 shadow-xl">
            <ShieldCheck className="size-6 text-green-400 mb-3" />
            <p className="text-2xl font-black tracking-tighter">100%</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Trust Score</p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
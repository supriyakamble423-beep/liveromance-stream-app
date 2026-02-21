'use client';

import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Globe, Zap, Users, Gift, TrendingUp, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";

export default function InterestAndAnalytics() {
  const { firestore } = useFirebase();
  
  // Fetching Live Hosts for Global Map logic
  const liveHostsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'hosts'), where('isLive', '==', true));
  }, [firestore]);
  
  const { data: liveHosts } = useCollection(liveHostsQuery);

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-28 max-w-lg mx-auto border-x border-white/10">
      {/* --- Global Live Traffic (Live Map Visualization) --- */}
      <header className="p-6 bg-gradient-to-b from-primary/20 to-transparent">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Globe className="size-5 text-primary animate-pulse" />
            <h1 className="text-xl font-black uppercase tracking-tighter italic">Live World Traffic</h1>
          </div>
          <Badge className="bg-primary/20 text-primary border-primary/30 text-[8px] font-black uppercase tracking-widest">
            Satellite Active
          </Badge>
        </div>

        <div className="relative h-64 w-full bg-slate-950 rounded-[3rem] border border-white/10 overflow-hidden flex items-center justify-center shadow-[0_0_50px_rgba(137,90,246,0.15)] group">
          {/* Real Map Layer */}
          <div className="absolute inset-0 opacity-40 bg-[url('https://picsum.photos/seed/globalmap/1200/800')] bg-cover bg-center mix-blend-luminosity grayscale group-hover:scale-105 transition-transform duration-1000" />
          
          {/* Scanline Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent h-1 w-full top-0 animate-scan opacity-30" />

          {/* Dynamic Pulsing Host Markers (Distributed) */}
          <div className="absolute top-[30%] left-[25%]">
            <div className="size-3 bg-primary rounded-full animate-ping" />
            <div className="size-1.5 bg-primary rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_#895af6]" />
          </div>
          <div className="absolute top-[50%] left-[60%]">
            <div className="size-3 bg-secondary rounded-full animate-ping delay-300" />
            <div className="size-1.5 bg-secondary rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_#0EA5E9]" />
          </div>
          <div className="absolute top-[20%] left-[80%]">
            <div className="size-3 bg-green-500 rounded-full animate-ping delay-700" />
            <div className="size-1.5 bg-green-500 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_#22c55e]" />
          </div>
          <div className="absolute top-[70%] left-[40%]">
            <div className="size-3 bg-accent rounded-full animate-ping delay-500" />
            <div className="size-1.5 bg-accent rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_#FF7043]" />
          </div>

          <div className="absolute bottom-8 right-8 text-right bg-black/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl">
            <p className="text-4xl font-black text-primary tracking-tighter leading-none">{liveHosts?.length || 0}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Global Hosts</p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* --- AI Optimizer Section --- */}
        <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-7 shadow-inner relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Zap className="size-20" />
          </div>
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/10">
                <Zap className="size-6 fill-current" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-tight">AI Optimizer</h2>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Traffic Analysis v4.2</p>
              </div>
            </div>
            <Button size="sm" className="h-10 rounded-2xl text-[10px] font-black bg-primary px-6 shadow-lg shadow-primary/20 active:scale-95 transition-all">RE-SCAN</Button>
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-[10px] font-black mb-2.5 uppercase tracking-widest">
                <span>Reach Probability</span>
                <span className="text-primary">88% (Peak)</span>
              </div>
              <Progress value={88} className="h-2.5 bg-white/5" />
            </div>
            <div className="p-5 rounded-3xl bg-primary/5 border border-primary/10">
              <p className="text-[12px] text-slate-200 italic leading-relaxed font-medium">
                "System Intelligence: Indian & SEA markets are peaking. Recommend going live at <span className="text-primary font-black">9:00 PM IST</span> for +24% viewer boost."
              </p>
            </div>
          </div>
        </section>

        {/* --- Lifetime Referral & Earnings --- */}
        <section className="bg-gradient-to-br from-secondary/20 to-transparent border border-white/5 rounded-[3rem] p-8 relative overflow-hidden group">
          <Gift className="absolute -bottom-10 -right-10 size-40 text-white/5 rotate-12 transition-transform group-hover:scale-110 duration-1000" />
          
          <div className="flex items-center gap-2 mb-10 text-secondary">
            <TrendingUp className="size-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Lifetime Growth Dashboard</span>
          </div>

          <div className="flex justify-between items-end relative z-10">
            <div>
              <p className="text-5xl font-black tracking-tighter">142</p>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">Active Invites</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black text-green-400">+$1,240</p>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">Total Commission</p>
            </div>
          </div>

          <Button variant="secondary" className="w-full mt-10 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest h-16 bg-secondary shadow-xl shadow-secondary/20 active:scale-95 transition-all">
            Share Referral Link
          </Button>
        </section>

        {/* --- Quick Analytics Grid --- */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-7 rounded-[2.5rem] border border-white/5 shadow-2xl">
            <Users className="size-6 text-blue-400 mb-4" />
            <p className="text-3xl font-black tracking-tighter">2.4k</p>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Network Reach</p>
          </div>
          <div className="bg-white/5 p-7 rounded-[2.5rem] border border-white/5 shadow-2xl">
            <ShieldCheck className="size-6 text-green-400 mb-4" />
            <p className="text-3xl font-black tracking-tighter">100%</p>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Safety Index</p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("px-2.5 py-1 rounded-full border text-[10px] font-bold", className)}>
      {children}
    </div>
  );
}

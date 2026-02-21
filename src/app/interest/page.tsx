'use client';

import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
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
    return query(
      collection(firestore, 'hosts'), 
      where('isLive', '==', true),
      limit(50)
    );
  }, [firestore]);
  
  const { data: liveHosts } = useCollection(liveHostsQuery);

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-28 max-w-lg mx-auto border-x border-white/10 overflow-x-hidden">
      {/* --- 3D Global Command Center --- */}
      <header className="p-6 bg-gradient-to-b from-primary/30 to-transparent relative">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(137,90,246,0.3)]">
              <Globe className="size-6 text-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter italic">Global Live-Feed</h1>
              <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest">3D Real-time Visualization</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
             <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/30">
               <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest">Network Live</span>
             </div>
          </div>
        </div>

        {/* 3D Tilted Map Container */}
        <div className="relative h-80 w-full perspective-[1000px] flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-950 rounded-[3rem] border border-white/10 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] transform rotateX-[25deg] rotateZ-[-5deg] scale-105">
            {/* Real Map Layer with Countries/Cities */}
            <div 
              className="absolute inset-0 opacity-40 bg-[url('https://picsum.photos/seed/worldmap3d/1600/1000')] bg-cover bg-center grayscale mix-blend-screen"
            />
            
            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent h-2 w-full top-0 animate-scan opacity-40" />

            {/* Pulsing Markers for major cities */}
            <div className="absolute top-[40%] left-[25%] group cursor-help">
              <div className="size-4 bg-primary rounded-full animate-ping opacity-75" />
              <div className="size-2 bg-primary rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_15px_#895af6]" />
              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-2 py-1 rounded border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[8px] font-black uppercase tracking-widest">New York, USA</span>
              </div>
            </div>

            <div className="absolute top-[55%] left-[68%] group cursor-help">
              <div className="size-4 bg-secondary rounded-full animate-ping opacity-75 delay-300" />
              <div className="size-2 bg-secondary rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_15px_#0EA5E9]" />
              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-2 py-1 rounded border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[8px] font-black uppercase tracking-widest text-secondary">New Delhi, IN</span>
              </div>
            </div>

            <div className="absolute top-[32%] left-[48%] group cursor-help">
              <div className="size-4 bg-green-500 rounded-full animate-ping opacity-75 delay-700" />
              <div className="size-2 bg-green-500 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_15px_#22c55e]" />
              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-2 py-1 rounded border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[8px] font-black uppercase tracking-widest text-green-500">London, UK</span>
              </div>
            </div>

            <div className="absolute top-[45%] left-[82%] group cursor-help">
              <div className="size-4 bg-accent rounded-full animate-ping opacity-75 delay-500" />
              <div className="size-2 bg-accent rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_15px_#FF7043]" />
              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-2 py-1 rounded border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[8px] font-black uppercase tracking-widest text-accent">Tokyo, JP</span>
              </div>
            </div>
          </div>

          {/* Floating Data Panel */}
          <div className="absolute bottom-4 right-10 z-20 bg-black/60 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform translate-y-4">
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-4xl font-black text-primary tracking-tighter leading-none">{liveHosts?.length || 0}</p>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">Active Nodes</p>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="flex flex-col gap-1">
                <div className="size-2 rounded-full bg-primary" />
                <div className="size-2 rounded-full bg-secondary" />
                <div className="size-2 rounded-full bg-green-500" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* --- AI Optimizer Section --- */}
        <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-7 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/10">
                <Zap className="size-6 fill-current" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-tight">AI Optimizer</h2>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Global Trends v4.2</p>
              </div>
            </div>
            <Button size="sm" className="h-10 rounded-2xl text-[10px] font-black bg-primary px-6 shadow-lg shadow-primary/20 active:scale-95 transition-all">ANALYZING...</Button>
          </div>
          
          <div className="space-y-6 relative z-10">
            <div>
              <div className="flex justify-between text-[10px] font-black mb-2.5 uppercase tracking-widest">
                <span>Success Probability</span>
                <span className="text-primary">92% (High)</span>
              </div>
              <Progress value={92} className="h-2.5 bg-white/5" />
            </div>
            <div className="p-5 rounded-3xl bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <p className="text-[12px] text-slate-200 leading-relaxed font-medium">
                "Indian region shows <span className="text-primary font-black">+45% demand</span> in Social-Talk category. Best window starts in <span className="text-secondary font-black">24 mins</span>."
              </p>
            </div>
          </div>
        </section>

        {/* --- Lifetime Referral & Earnings --- */}
        <section className="bg-gradient-to-br from-secondary/20 to-transparent border border-white/10 rounded-[3rem] p-8 relative overflow-hidden group shadow-2xl">
          <Gift className="absolute -bottom-10 -right-10 size-40 text-white/5 rotate-12 transition-transform group-hover:scale-110 duration-1000" />
          
          <div className="flex items-center gap-2 mb-10 text-secondary relative z-10">
            <TrendingUp className="size-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Network Commission Hub</span>
          </div>

          <div className="flex justify-between items-end relative z-10">
            <div>
              <p className="text-5xl font-black tracking-tighter">284</p>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">Invited Partners</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black text-green-400">+$2,410</p>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">Total Earnings</p>
            </div>
          </div>

          <Button variant="secondary" className="w-full mt-10 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest h-16 bg-secondary shadow-xl shadow-secondary/20 active:scale-95 transition-all relative z-10">
            Copy My Invite Link
          </Button>
        </section>

        {/* --- Quick Analytics Grid --- */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-7 rounded-[2.5rem] border border-white/10 shadow-xl group hover:bg-white/10 transition-colors">
            <Users className="size-6 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
            <p className="text-3xl font-black tracking-tighter">8.2k</p>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Global Reach</p>
          </div>
          <div className="bg-white/5 p-7 rounded-[2.5rem] border border-white/10 shadow-xl group hover:bg-white/10 transition-colors">
            <ShieldCheck className="size-6 text-green-400 mb-4 group-hover:scale-110 transition-transform" />
            <p className="text-3xl font-black tracking-tighter">99.9%</p>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Safety Index</p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function Gift(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect width="20" height="5" x="2" y="7" />
      <line x1="12" x2="12" y1="22" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}
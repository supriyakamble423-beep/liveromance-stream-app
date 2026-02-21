'use client';

import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { Globe, Zap, Users, Gift as GiftIcon, MapPin, TrendingUp, ShieldCheck, Loader2, Star, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export default function InterestAndAnalytics() {
  const { firestore, isUserLoading } = useFirebase();
  
  // 1. Live Hosts Query for Map Visualization and List
  const liveHostsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'hosts'), 
      where('isLive', '==', true),
      limit(20)
    );
  }, [firestore]);
  
  const { data: liveHosts, isLoading: isMapLoading } = useCollection(liveHostsQuery);

  if (isUserLoading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="animate-spin text-primary size-10" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020202] text-white pb-28 font-sans selection:bg-primary/30 max-w-lg mx-auto border-x border-white/10">
      
      {/* --- 3D COMMAND CENTER MAP --- */}
      <header className="p-6 pt-10 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="size-2 bg-red-500 rounded-full animate-pulse" />
            <h1 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Global Command Center</h1>
          </div>
          <Badge text="Live Satellite" color="bg-primary/20 text-primary" />
        </div>

        {/* 3D Tilted Map Container */}
        <div className="relative h-64 w-full bg-slate-900/20 rounded-[3rem] border border-white/5 overflow-hidden [perspective:1000px]">
          <div className="absolute inset-0 opacity-30 bg-[url('https://picsum.photos/seed/worldmap3d/1600/1000')] bg-center bg-cover transform [rotateX(25deg)] scale-110 grayscale" />
          
          {/* Real-time 3D City Markers */}
          <div className="absolute inset-0 flex items-center justify-center">
             {/* New York Marker */}
             <div className="absolute top-1/4 left-1/4 group cursor-help">
                <div className="size-2 bg-blue-500 rounded-full animate-ping" />
                <span className="absolute -top-6 -left-4 text-[8px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">New York</span>
             </div>
             {/* New Delhi Marker */}
             <div className="absolute top-[45%] left-[65%] group cursor-help">
                <div className="size-2 bg-orange-500 rounded-full animate-ping delay-75" />
                <span className="absolute -top-6 -left-4 text-[8px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity text-orange-400 whitespace-nowrap">New Delhi</span>
             </div>
             {/* Tokyo Marker */}
             <div className="absolute top-[40%] right-1/4 group cursor-help">
                <div className="size-2 bg-red-500 rounded-full animate-ping delay-150" />
                <span className="absolute -top-6 -left-4 text-[8px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Tokyo</span>
             </div>
          </div>

          {/* Floating Stats Card */}
          <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl">
            <p className="text-3xl font-black italic tracking-tighter">{liveHosts?.length || 0}</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Active World Nodes</p>
          </div>
        </div>
      </header>

      <main className="px-4 space-y-6">
        
        {/* --- GLOBAL NODES EXPLORER (LIST BY COUNTRY) --- */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <MapPin className="size-4 text-primary" /> Global Nodes Explorer
            </h2>
            <Badge text="By Location" color="bg-white/5 border border-white/10" />
          </div>

          <div className="grid grid-cols-1 gap-3">
            {isMapLoading ? (
              <div className="flex flex-col items-center py-10 opacity-30 animate-pulse">
                <Zap className="size-8 text-primary" />
                <p className="text-[10px] font-black uppercase mt-2">Syncing Nodes...</p>
              </div>
            ) : liveHosts?.length === 0 ? (
              <div className="bg-white/5 border border-white/5 rounded-[2rem] p-10 text-center">
                <p className="text-[10px] font-black uppercase text-slate-500">No active nodes detected</p>
              </div>
            ) : (
              liveHosts?.map((host) => (
                <Link key={host.id} href={`/stream/${host.id}`}>
                  <div className="p-4 rounded-[2rem] bg-white/5 border border-white/5 flex items-center gap-4 group active:scale-[0.98] transition-all hover:bg-white/10">
                    <div className="relative size-14 rounded-2xl overflow-hidden border border-primary/20 bg-slate-900">
                      <Image 
                        src={host.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${host.id}`} 
                        alt="Host" 
                        fill 
                        className="object-cover" 
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-black uppercase tracking-tight">Host_{host.id.slice(0, 4)}</h3>
                        <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
                        <Globe className="size-3 text-secondary" /> {host.country || 'Global Hub'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="size-3 fill-current" />
                        <span className="text-xs font-black tracking-tight">{host.rating || '4.9'}</span>
                      </div>
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-tighter mt-1 flex items-center gap-1">
                        <Eye className="size-2" /> {host.viewers || 0}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* --- AI OPTIMIZER SECTION --- */}
        <section className="bg-gradient-to-r from-primary/5 to-transparent border border-white/5 rounded-[2.5rem] p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap className="size-20" />
          </div>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(139,92,246,0.3)]">
              <Zap className="size-7 fill-current" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest">AI Traffic Optimizer</h2>
              <p className="text-[9px] text-primary font-black animate-pulse uppercase">System Online</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1 text-slate-400">
              <span>Streaming Efficiency</span>
              <span className="text-primary">94.2%</span>
            </div>
            <Progress value={94} className="h-1.5 bg-white/5" />
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              <span className="text-primary">💡 AI INSIGHT:</span> Current traffic is high in <span className="text-white underline">Southeast Asia</span>. Launching a stream now will increase global reach by <span className="text-green-400">40%</span>.
            </p>
          </div>
        </section>

        {/* --- GLOBAL RANKING TEASER --- */}
        <div className="grid grid-cols-2 gap-4 pb-10">
          <div className="bg-white/5 p-5 rounded-[2.2rem] border border-white/5">
            <TrendingUp className="size-5 text-blue-400 mb-2" />
            <p className="text-2xl font-black italic">#14</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Global Rank</p>
          </div>
          <div className="bg-white/5 p-5 rounded-[2.2rem] border border-white/5 text-right">
            <ShieldCheck className="size-5 text-green-400 mb-2 ml-auto" />
            <p className="text-2xl font-black italic">100%</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Safety Score</p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

// --- REUSABLE COMPONENTS ---

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest", color)}>
      {text}
    </span>
  );
}

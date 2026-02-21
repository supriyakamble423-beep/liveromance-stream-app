'use client';

import { BottomNav } from "@/components/BottomNav";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { Flame, Star, TrendingUp, Search, Zap, Clock, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function TrendsPage() {
  const { firestore } = useFirebase();

  // 1. Top Rated Live Hosts
  const topRatedQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'hosts'),
      where('isLive', '==', true),
      orderBy('rating', 'desc'),
      limit(5)
    );
  }, [firestore]);

  // 2. Newest Live Hosts
  const newestLiveQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'hosts'),
      where('isLive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
  }, [firestore]);

  const { data: topHosts, isLoading: loadingTop } = useCollection(topRatedQuery);
  const { data: newHosts, isLoading: loadingNew } = useCollection(newestLiveQuery);

  return (
    <div className="min-h-screen bg-background pb-32 max-w-lg mx-auto border-x border-border">
      <header className="p-6 space-y-4 pt-12 sticky top-0 bg-background/80 backdrop-blur-md z-20 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black font-headline tracking-tight uppercase italic">Trends</h1>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Global Performance Index</p>
          </div>
          <div className="bg-primary/10 p-2 rounded-2xl">
            <TrendingUp className="text-primary size-6" />
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            className="rounded-2xl pl-12 h-12 bg-muted/50 border-none focus-visible:ring-primary/30 font-medium" 
            placeholder="Search global tags..." 
          />
        </div>
      </header>

      <main className="px-6 pt-6 space-y-10">
        {/* TOP RATED SECTION */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
              <Flame className="size-4 text-accent fill-current" /> Top Global Nodes
            </h2>
            <Badge variant="outline" className="text-[8px] font-black uppercase border-white/10">By Rating</Badge>
          </div>
          
          <div className="space-y-3">
            {loadingTop ? (
              [1, 2, 3].map(i => <div key={i} className="h-24 bg-muted/30 animate-pulse rounded-[2rem]" />)
            ) : topHosts?.map((host) => (
              <Link key={host.id} href={`/stream/${host.id}`}>
                <div className="flex items-center gap-4 bg-card p-4 rounded-[2rem] border border-border group transition-all hover:shadow-xl active:scale-95 mb-3">
                  <div className="relative size-20 rounded-[1.5rem] overflow-hidden flex-shrink-0 border-2 border-primary/20">
                    <Image 
                      src={host.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${host.id}`} 
                      alt={host.id} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                    <div className="absolute top-1.5 left-1.5 bg-destructive px-1.5 rounded-full">
                      <p className="text-[7px] font-black uppercase text-white">Live</p>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-black text-sm uppercase tracking-tight truncate">
                        {host.username || `Host_${host.id.slice(0, 4)}`}
                      </h3>
                      <ShieldCheck className="size-3 text-secondary" />
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary text-[8px] uppercase font-black px-2 h-5">Verified</Badge>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <Zap className="size-3 text-amber-400 fill-current" /> {host.viewers || 0}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-accent font-black">
                      <Star className="size-4 fill-current" />
                      <span className="text-lg">{host.rating || '4.9'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* NEWLY REGISTERED SECTION */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
              <Clock className="size-4 text-secondary" /> New Live Nodes
            </h2>
            <Badge variant="outline" className="text-[8px] font-black uppercase border-white/10">Fresh Signal</Badge>
          </div>

          <div className="space-y-3">
            {loadingNew ? (
              [1, 2].map(i => <div key={i} className="h-24 bg-muted/30 animate-pulse rounded-[2rem]" />)
            ) : newHosts?.map((host) => (
              <Link key={host.id} href={`/stream/${host.id}`}>
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-[2rem] border border-white/5 group transition-all hover:bg-white/10 active:scale-95 mb-3">
                  <div className="relative size-16 rounded-[1.2rem] overflow-hidden flex-shrink-0 border border-white/10">
                    <Image 
                      src={host.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${host.id}`} 
                      alt={host.id} 
                      fill 
                      className="object-cover" 
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-xs uppercase tracking-tight mb-1">
                      {host.username || `NewHost_${host.id.slice(0, 4)}`}
                    </h3>
                    <div className="flex items-center gap-3">
                       <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                        Joined Just Now
                      </span>
                    </div>
                  </div>
                  <div className="bg-secondary/20 p-2.5 rounded-2xl">
                    <Zap className="size-5 text-secondary animate-pulse" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* PROMO CARD */}
        <section className="bg-gradient-to-br from-primary/20 to-secondary/20 p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="size-24" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight mb-2 italic">Rising Market</h3>
          <p className="text-xs text-slate-400 font-medium mb-5 uppercase leading-relaxed tracking-tight">
            Our AI detected a 40% surge in global traffic. <br/>Launch your signal now to catch the wave.
          </p>
          <Link href="/host-p">
            <Button className="bg-white text-black font-black uppercase tracking-widest text-[10px] px-8 h-12 rounded-xl shadow-xl hover:scale-105 transition-transform">
              Boost My Rank
            </Button>
          </Link>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

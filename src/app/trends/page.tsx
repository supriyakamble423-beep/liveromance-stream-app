
'use client';

import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { Flame, Star, TrendingUp, Search } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function TrendsPage() {
  const { firestore } = useFirebase();

  const trendingQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'hosts'),
      where('rating', '>=', 4.5),
      orderBy('rating', 'desc'),
      limit(10)
    );
  }, [firestore]);

  const { data: trendingHosts, isLoading } = useCollection(trendingQuery);

  return (
    <div className="min-h-screen bg-background pb-24 max-w-lg mx-auto border-x border-border">
      <header className="p-4 space-y-4 pt-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold font-headline">Trends</h1>
          <TrendingUp className="text-primary size-6" />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            className="rounded-full pl-10 h-12 bg-muted/50 border-none" 
            placeholder="Search trends..." 
          />
        </div>
      </header>

      <main className="px-4 space-y-8">
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Flame className="size-4 text-accent fill-current" /> Trending Now
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {isLoading ? (
              [1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-3xl" />)
            ) : (
              trendingHosts?.map((host) => (
                <div 
                  key={host.id} 
                  className="flex items-center gap-4 bg-card p-4 rounded-3xl border border-border group transition-all hover:bg-muted/30"
                >
                  <div className="relative size-20 rounded-2xl overflow-hidden flex-shrink-0">
                    <Image src={host.previewImageUrl || "https://picsum.photos/seed/trend/200/200"} alt={host.id} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">Host_{host.id.slice(0, 4)}</h3>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px] font-bold">Trending</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-accent font-bold">
                      <Star className="size-3 fill-current" />
                      <span>{host.rating}</span>
                    </div>
                    {host.isLive && (
                      <Badge className="mt-1 bg-destructive/10 text-destructive border-none text-[8px] h-4">Live</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

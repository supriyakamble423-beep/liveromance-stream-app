"use client"

import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MOCK_HOSTS } from "@/lib/mock-data";
import { Flame, Star, TrendingUp, Search } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function ExplorePage() {
  const trending = MOCK_HOSTS.filter(h => h.rating > 4.6).slice(0, 4);

  return (
    <div className="min-h-screen bg-background pb-24 max-w-lg mx-auto border-x border-border">
      <header className="p-4 space-y-4 pt-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold font-headline">Explore</h1>
          <TrendingUp className="text-primary size-6" />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            className="rounded-full pl-10 h-12 bg-muted/50 border-none" 
            placeholder="Search interests, topics..." 
          />
        </div>
      </header>

      <main className="px-4 space-y-8">
        {/* Trending Categories */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Flame className="size-4 text-accent fill-current" /> Hot Categories
          </h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {["Music", "Gaming", "Talk Shows", "Fitness", "Dance", "ASMR"].map((cat) => (
              <Badge 
                key={cat} 
                variant="secondary" 
                className="px-6 py-2.5 rounded-2xl bg-muted/50 hover:bg-primary hover:text-white transition-colors cursor-pointer text-sm"
              >
                {cat}
              </Badge>
            ))}
          </div>
        </section>

        {/* Featured Trends */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Star className="size-4 text-primary fill-current" /> Rising Stars
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {trending.map((host) => (
              <div 
                key={host.id} 
                className="flex items-center gap-4 bg-card p-4 rounded-3xl border border-border group transition-all hover:bg-muted/30"
              >
                <div className="relative size-20 rounded-2xl overflow-hidden flex-shrink-0">
                  <Image src={host.imageUrl} alt={host.name} fill className="object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{host.name}</h3>
                    <span className="text-xs opacity-60">{host.flag}</span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    {host.categories.slice(0, 2).map(c => (
                      <span key={c} className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-bold text-muted-foreground">{c}</span>
                    ))}
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
            ))}
          </div>
        </section>

        {/* Banner Section */}
        <section className="bg-gradient-to-br from-secondary/20 to-primary/20 p-6 rounded-[2rem] border border-white/10">
          <h3 className="text-xl font-bold mb-2">Grow your Global Network</h3>
          <p className="text-sm text-muted-foreground mb-4">Onboard your friends and start earning lifetime coins today!</p>
          <button className="bg-white text-black font-bold px-6 py-2.5 rounded-xl text-sm shadow-xl hover:scale-105 transition-transform">
            Learn More
          </button>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

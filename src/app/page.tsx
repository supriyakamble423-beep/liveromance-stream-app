"use client"

import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MOCK_HOSTS } from "@/lib/mock-data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { MessageCircle, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Home() {
  const featuredImage = PlaceHolderImages.find(img => img.id === "hero-stream")?.imageUrl;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      
      <main className="px-4 pt-4 space-y-6 max-w-lg mx-auto">
        {/* Featured Section */}
        <section className="relative group overflow-hidden rounded-2xl shadow-2xl bg-muted">
          <div className="relative aspect-[16/9] w-full">
            {featuredImage && (
              <Image 
                src={featuredImage} 
                alt="Featured Music Stream" 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                data-ai-hint="streaming music"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          </div>
          
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className="bg-destructive hover:bg-destructive border-none text-white gap-1 uppercase tracking-wider text-[10px]">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Live
            </Badge>
            <Badge variant="secondary" className="bg-black/40 backdrop-blur-md text-white border-none gap-1 uppercase tracking-wider text-[10px]">
              <Users className="size-3" /> 2.4k
            </Badge>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">🇺🇸</span>
                <h3 className="text-white text-lg font-bold leading-tight font-headline">Global Music Fest</h3>
              </div>
              <p className="text-slate-300 text-sm">Join the worldwide party now!</p>
            </div>
            <Link href="/stream/fest">
              <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 font-bold">
                Join Room
              </Button>
            </Link>
          </div>
        </section>

        {/* Host Grid */}
        <section className="grid grid-cols-2 gap-4">
          {MOCK_HOSTS.map((host) => (
            <div 
              key={host.id} 
              className="flex flex-col bg-card rounded-2xl overflow-hidden shadow-sm border border-border group transition-all hover:shadow-md"
            >
              <Link href={`/stream/${host.id}`} className="relative aspect-[3/4] overflow-hidden bg-muted">
                {host.imageUrl && (
                  <Image 
                    src={host.imageUrl} 
                    alt={host.name} 
                    fill 
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                )}
                <div className="absolute top-2 left-2 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs text-white">
                  {host.flag}
                </div>
                {host.isLive && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-destructive text-[9px] text-white font-black px-1.5 py-0.5 rounded uppercase">
                    Live
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white font-bold text-sm">{host.name}, {host.age}</p>
                </div>
              </Link>
              <div className="p-2 pt-1">
                <Button 
                  variant={host.isLive ? "secondary" : "default"} 
                  className={cn(
                    "w-full rounded-xl text-xs font-bold gap-1 h-9",
                    host.isLive ? "bg-primary/10 text-primary hover:bg-primary/20" : "bg-primary shadow-sm"
                  )}
                >
                  {host.isLive ? (
                    <><MessageCircle className="size-3" /> Chat Now</>
                  ) : (
                    <><UserPlus className="size-3" /> Request</>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

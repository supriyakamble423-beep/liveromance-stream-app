
"use client"

import { BottomNav } from "@/components/BottomNav";
import { Search, Bell, Map as MapIcon, Layers, Target, Eye } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MapHotspot = ({ top, left, avatar }: { top: string, left: string, avatar: string }) => (
  <div className="absolute animate-pulse" style={{ top, left }}>
    <div className="relative group">
      <div className="size-4 bg-primary rounded-full shadow-[0_0_15px_rgba(137,90,246,0.6)]" />
      <div className="absolute -top-14 -left-6 bg-background/80 border border-primary/30 rounded-xl p-1.5 backdrop-blur-md transition-transform group-hover:scale-110">
        <div className="relative size-10 rounded-full border-2 border-primary overflow-hidden">
          <Image src={avatar} alt="Host" fill className="object-cover" />
        </div>
        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-destructive rounded-full border-2 border-background" />
      </div>
    </div>
  </div>
);

export default function MapPage() {
  const mapImg = PlaceHolderImages.find(img => img.id === "map-bg")?.imageUrl || "";
  const hosts = [
    { top: "35%", left: "25%", avatar: PlaceHolderImages.find(img => img.id === "host-1")?.imageUrl || "" },
    { top: "55%", left: "65%", avatar: PlaceHolderImages.find(img => img.id === "host-5")?.imageUrl || "" },
    { top: "45%", left: "45%", avatar: PlaceHolderImages.find(img => img.id === "host-3")?.imageUrl || "" },
  ];

  return (
    <div className="relative h-screen w-full max-w-lg mx-auto bg-background overflow-hidden border-x border-border flex flex-col">
      {/* Header Overlay */}
      <header className="absolute top-0 left-0 right-0 z-30 p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
              className="bg-background/60 border-primary/20 rounded-full py-2 pl-10 pr-4 text-sm backdrop-blur-md" 
              placeholder="Search global hosts..." 
            />
          </div>
          <Button variant="outline" size="icon" className="rounded-full size-10 bg-background/60 backdrop-blur-md border-primary/20">
            <Bell className="size-5 text-primary" />
          </Button>
        </div>
        
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {["Couples", "Groups", "Nearby", "Trending"].map((cat, i) => (
            <Badge 
              key={cat} 
              variant={i === 0 ? "default" : "outline"}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap backdrop-blur-md",
                i === 0 ? "bg-primary border-none" : "bg-background/60 border-primary/20"
              )}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </header>

      {/* Map Content */}
      <div className="flex-1 relative bg-slate-950">
        <Image 
          src={mapImg} 
          alt="World Map" 
          fill 
          className="object-cover opacity-40 mix-blend-lighten" 
        />
        {hosts.map((h, i) => (
          <MapHotspot key={i} {...h} />
        ))}
        
        <div className="absolute bottom-40 right-4 flex flex-col gap-2">
          <Button variant="secondary" size="icon" className="size-12 rounded-2xl glass-effect shadow-xl">
            <Target className="size-6" />
          </Button>
          <Button variant="secondary" size="icon" className="size-12 rounded-2xl glass-effect shadow-xl">
            <Layers className="size-6" />
          </Button>
        </div>
      </div>

      {/* Details Sheet Simulation */}
      <div className="h-[40%] glass-effect rounded-t-[2.5rem] flex flex-col pt-4 px-6 relative z-40 border-t border-primary/20">
        <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-6 opacity-50" />
        
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold tracking-tight font-headline">
            Active Couples <span className="text-primary ml-1">• 24</span>
          </h2>
          <Button variant="link" className="text-primary text-sm font-semibold p-0 h-auto">
            View List
          </Button>
        </div>

        <div className="flex-1 overflow-x-auto no-scrollbar flex items-start gap-4 pb-8">
          {[1, 2].map((i) => (
            <div key={i} className="flex-shrink-0 w-72 bg-card/60 border border-primary/20 rounded-2xl overflow-hidden relative shadow-lg">
              <div className="h-32 relative">
                <Image 
                  src={PlaceHolderImages.find(img => img.id === (i === 1 ? "hero-stream" : "host-5"))?.imageUrl || ""} 
                  alt="Preview" 
                  fill 
                  className="object-cover" 
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge className="bg-destructive text-[10px] uppercase gap-1">
                    <span className="size-1.5 bg-white rounded-full animate-ping" /> Live
                  </Badge>
                  <Badge variant="secondary" className="bg-black/40 backdrop-blur-md text-white text-[10px] gap-1">
                    <Eye className="size-3" /> 1.2k
                  </Badge>
                </div>
              </div>
              <div className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg leading-tight">Alex & Maria</h3>
                    <p className="text-muted-foreground text-xs flex items-center mt-1">
                      Barcelona, Spain
                    </p>
                  </div>
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90 rounded-xl font-bold">
                  Connect Now
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

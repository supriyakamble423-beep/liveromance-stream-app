"use client"

import { Heart, SlidersHorizontal } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

const categories = ["All", "Boys", "Girls", "Couples", "Groups", "LGBTQ+"];

export function Header() {
  const [activeCategory, setActiveCategory] = useState("All");

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="romantic-gradient p-2 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
            <Heart className="text-white size-5 fill-current" />
          </div>
          <h1 className="text-xl font-black tracking-tighter font-headline italic text-primary">Global Love</h1>
        </div>
        <Button variant="secondary" size="icon" className="rounded-full size-10 bg-secondary/10 hover:bg-secondary/20">
          <SlidersHorizontal className="size-5 text-secondary" />
        </Button>
      </div>
      
      <div className="flex overflow-x-auto no-scrollbar px-4 py-3 gap-6 items-center">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all relative py-1",
              activeCategory === cat 
                ? "text-primary scale-105" 
                : "text-muted-foreground hover:text-primary"
            )}
          >
            {cat}
            {activeCategory === cat && (
              <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>
    </header>
  );
}

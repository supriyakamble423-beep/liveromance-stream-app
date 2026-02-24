"use client"

import { Heart, SlidersHorizontal } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

const categories = ["All", "Boys", "Girls", "Couples", "Groups", "LGBTQ+"];

export function Header() {
  const [activeCategory, setActiveCategory] = useState("All");

  return (
    <header className="sticky top-0 z-50 bg-[#2D1B2D]/90 backdrop-blur-2xl border-b border-white/5 shadow-lg">
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <div className="romantic-gradient p-2 rounded-xl flex items-center justify-center shadow-lg shadow-primary/40">
            <Heart className="text-white size-5 fill-current" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter font-headline italic bg-gradient-to-r from-white to-[#FDA4AF] bg-clip-text text-transparent">Global Love</h1>
        </div>
        <Button variant="secondary" size="icon" className="rounded-full size-10 bg-white/5 hover:bg-white/10 border border-white/5">
          <SlidersHorizontal className="size-5 text-[#F472B6]" />
        </Button>
      </div>
      
      <div className="flex overflow-x-auto no-scrollbar px-6 py-4 gap-8 items-center">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "text-[11px] font-black uppercase tracking-[0.15em] whitespace-nowrap transition-all relative py-1",
              activeCategory === cat 
                ? "text-[#F472B6] scale-105" 
                : "text-[#FDA4AF]/60 hover:text-[#F472B6]"
            )}
          >
            {cat}
            {activeCategory === cat && (
              <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#F472B6] rounded-full shadow-[0_0_10px_#F472B6]" />
            )}
          </button>
        ))}
      </div>
    </header>
  );
}

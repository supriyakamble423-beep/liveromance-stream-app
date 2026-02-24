'use client';

import { cn } from "@/lib/utils";

interface LiveEarningTimerProps {
  minutes: number;
}

export default function LiveEarningTimer({ minutes }: LiveEarningTimerProps) {
  const progress = (minutes / 30) * 100; // 30 mins primary goal

  return (
    <div className="absolute top-24 left-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="bg-[#2D1B2D]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl">
        <div className="flex justify-between items-end mb-2">
          <div className="flex flex-col">
            <span className={cn(
              "text-[9px] font-black uppercase tracking-[0.2em]",
              minutes >= 60 ? "text-yellow-400" : minutes >= 30 ? "text-cyan-400" : "text-pink-400"
            )}>
              {minutes >= 60 ? "👑 Legend Mode" : minutes >= 30 ? "⭐ Diamond Queen" : "✨ Stay-to-Earn"}
            </span>
            <h4 className="text-[11px] font-black text-white uppercase tracking-tight italic">
              {minutes >= 60 ? "2x Jackpot Active" : minutes >= 30 ? "1.5x Bonus Active" : "Bronze Goal: 15m"}
            </h4>
          </div>
          <span className="text-[10px] font-black text-white bg-white/10 px-2 py-0.5 rounded-full">
            {minutes}m <span className="opacity-40">/ 60m</span>
          </span>
        </div>
        
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <div 
            className={cn(
              "h-full transition-all duration-1000 rounded-full",
              minutes >= 60 ? "bg-gradient-to-r from-yellow-400 to-amber-600 shadow-[0_0_10px_#fbbf24]" :
              minutes >= 30 ? "bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_#22d3ee]" :
              "bg-gradient-to-r from-[#E11D48] to-[#F472B6]"
            )}
            style={{ width: `${Math.min((minutes / 60) * 100, 100)}%` }}
          />
        </div>

        {minutes >= 30 && (
          <div className="flex items-center justify-center gap-2 mt-2 animate-bounce">
            <span className="size-1.5 rounded-full bg-yellow-400 shadow-[0_0_10px_#fbbf24]" />
            <p className="text-[9px] text-yellow-400 font-black uppercase tracking-widest italic">
              Multiplier Active: {minutes >= 60 ? "2.0x" : "1.5x"}
            </p>
            <span className="size-1.5 rounded-full bg-yellow-400 shadow-[0_0_10px_#fbbf24]" />
          </div>
        )}
      </div>
    </div>
  );
}

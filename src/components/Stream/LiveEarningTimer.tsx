'use client';

import { cn } from "@/lib/utils";

interface LiveEarningTimerProps {
  minutes: number;
}

export default function LiveEarningTimer({ minutes }: LiveEarningTimerProps) {
  // Milestones: 15 (Bronze), 30 (Silver), 60 (Gold)
  const getLevel = () => {
    if (minutes >= 60) return { label: "👑 Legend Level", multiplier: "2.0x", color: "text-yellow-400", bar: "bg-yellow-500 shadow-[0_0_15px_#fbbf24]" };
    if (minutes >= 30) return { label: "⭐ Diamond Queen", multiplier: "1.5x", color: "text-cyan-400", bar: "bg-cyan-500 shadow-[0_0_15px_#22d3ee]" };
    if (minutes >= 15) return { label: "✨ Rising Star", multiplier: "1.2x", color: "text-pink-400", bar: "bg-pink-500 shadow-[0_0_15px_#ec4899]" };
    return { label: "🌱 Newbie Node", multiplier: "1.0x", color: "text-slate-400", bar: "romantic-gradient shadow-[0_0_10px_#E11D48]" };
  };

  const level = getLevel();
  const progress = Math.min((minutes / 60) * 100, 100);

  return (
    <div className="absolute top-24 left-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="bg-[#2D1B2D]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl romantic-card-glow">
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-col">
            <span className={cn("text-[10px] font-black uppercase tracking-[0.25em] mb-1", level.color)}>
              {level.label}
            </span>
            <h4 className="text-sm font-black text-white uppercase tracking-tight italic">
              {minutes >= 30 ? `${level.multiplier} Earnings Active` : "Bonus Goal: 30 Mins"}
            </h4>
          </div>
          <div className="text-right">
            <div className="bg-white/5 px-3 py-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
              <span className="text-xs font-black text-white italic">{minutes}m</span>
              <span className="text-[10px] font-bold text-white/40 ml-1">/ 60m</span>
            </div>
          </div>
        </div>
        
        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
          <div 
            className={cn("h-full transition-all duration-1000 rounded-full", level.bar)}
            style={{ width: `${progress}%` }}
          />
        </div>

        {minutes >= 15 && (
          <div className="flex items-center justify-center gap-3 mt-4 animate-pulse">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
            <p className={cn("text-[9px] font-black uppercase tracking-widest italic flex items-center gap-2", level.color)}>
              <span className="size-1.5 rounded-full bg-current animate-ping" />
              {level.multiplier} Multiplier Unlocked
            </p>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
          </div>
        )}
      </div>
    </div>
  );
}
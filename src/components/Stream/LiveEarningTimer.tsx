'use client';

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Trophy, Zap, Star } from "lucide-react";

interface LiveEarningTimerProps {
  minutes: number;
}

export default function LiveEarningTimer({ minutes }: LiveEarningTimerProps) {
  const [showPopup, setShowPopup] = useState(false);

  // Trigger popup animation every 15 minutes
  useEffect(() => {
    if (minutes > 0 && minutes % 15 === 0) {
      setShowPopup(true);
      const timer = setTimeout(() => setShowPopup(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [minutes]);

  const getLevelDetails = () => {
    if (minutes >= 60) return { 
      label: "👑 LEGEND NODE", 
      multiplier: "2.5x", 
      color: "text-yellow-400", 
      bar: "bg-yellow-500 shadow-[0_0_20px_#fbbf24]",
      nextGoal: 120,
      icon: <Trophy className="size-4" />
    };
    if (minutes >= 45) return { 
      label: "💎 ELITE QUEEN", 
      multiplier: "2.0x", 
      color: "text-purple-400", 
      bar: "bg-purple-500 shadow-[0_0_20px_#a855f7]",
      nextGoal: 60,
      icon: <Sparkles className="size-4" />
    };
    if (minutes >= 30) return { 
      label: "⭐ DIAMOND STAR", 
      multiplier: "1.5x", 
      color: "text-cyan-400", 
      bar: "bg-cyan-500 shadow-[0_0_20px_#22d3ee]",
      nextGoal: 45,
      icon: <Star className="size-4" />
    };
    if (minutes >= 15) return { 
      label: "✨ RISING SIGNAL", 
      multiplier: "1.2x", 
      color: "text-pink-400", 
      bar: "bg-pink-500 shadow-[0_0_20px_#ec4899]",
      nextGoal: 30,
      icon: <Zap className="size-4" />
    };
    return { 
      label: "🌱 NEWBIE NODE", 
      multiplier: "1.0x", 
      color: "text-slate-400", 
      bar: "romantic-gradient shadow-[0_0_10px_#E11D48]",
      nextGoal: 15,
      icon: <Zap className="size-4" />
    };
  };

  const level = getLevelDetails();
  const currentIntervalStart = Math.floor(minutes / 15) * 15;
  const progress = ((minutes - currentIntervalStart) / 15) * 100;

  return (
    <div className="absolute top-24 left-6 right-6 z-50 pointer-events-none">
      {/* Goal Reached Popup Overlay */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] animate-in zoom-in fade-in duration-500">
           <div className="bg-white/10 backdrop-blur-3xl border-2 border-primary p-10 rounded-[4rem] text-center shadow-[0_0_100px_rgba(225,29,72,0.6)] romantic-glow">
              <Trophy className="size-20 text-yellow-400 mx-auto mb-4 animate-bounce" />
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-2">BONUS UNLOCKED!</h2>
              <p className="text-xl font-black text-primary uppercase tracking-widest">{level.multiplier} EARNINGS ACTIVE</p>
              <p className="text-[10px] text-white/60 font-black uppercase mt-4 tracking-[0.5em]">Establishing Next Goal...</p>
           </div>
        </div>
      )}

      <div className="bg-[#2D1B2D]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl romantic-card-glow animate-in slide-in-from-top-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <div className={cn("flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] mb-1", level.color)}>
              {level.icon}
              {level.label}
            </div>
            <h4 className="text-base font-black text-white uppercase tracking-tight italic flex items-center gap-2">
              <span className="text-primary">{level.multiplier}</span> 
              {minutes >= 15 ? "Premium Rate Active" : `Goal: ${level.nextGoal} Mins`}
            </h4>
          </div>
          <div className="text-right">
            <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-md">
              <span className="text-sm font-black text-white italic">{minutes}m</span>
              <span className="text-[10px] font-bold text-white/30 ml-1">Live</span>
            </div>
          </div>
        </div>
        
        <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/10 p-1">
          <div 
            className={cn("h-full transition-all duration-1000 rounded-full", level.bar)}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
            Level Progress
          </p>
          <p className={cn("text-[9px] font-black uppercase tracking-widest flex items-center gap-2", level.color)}>
            Next Bonus: {level.nextGoal}m
          </p>
        </div>
      </div>
    </div>
  );
}

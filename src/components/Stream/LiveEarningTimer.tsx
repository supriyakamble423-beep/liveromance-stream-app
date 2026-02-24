'use client';

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Trophy, Zap, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LiveEarningTimerProps {
  minutes: number;
}

export default function LiveEarningTimer({ minutes }: LiveEarningTimerProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [lastMilestone, setLastMilestone] = useState(0);

  // Trigger luxury popup every 15 minutes
  useEffect(() => {
    const currentMilestone = Math.floor(minutes / 15);
    if (minutes > 0 && minutes % 15 === 0 && currentMilestone > lastMilestone) {
      setShowPopup(true);
      setLastMilestone(currentMilestone);
      const timer = setTimeout(() => setShowPopup(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [minutes, lastMilestone]);

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
      {/* 🏆 LUXURY BONUS POPUP OVERLAY */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] animate-in zoom-in fade-in duration-700 bg-black/40 backdrop-blur-sm">
           <div className="bg-[#2D1B2D]/90 backdrop-blur-3xl border-4 border-primary p-12 rounded-[4rem] text-center shadow-[0_0_120px_rgba(225,29,72,0.8)] romantic-glow animate-bounce">
              <Trophy className="size-24 text-yellow-400 mx-auto mb-6 animate-pulse" />
              <div className="space-y-2">
                <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white">GOAL REACHED!</h2>
                <div className="bg-primary px-6 py-2 rounded-2xl inline-block shadow-xl">
                   <p className="text-2xl font-black text-white uppercase tracking-widest">{level.multiplier} BONUS UNLOCKED</p>
                </div>
              </div>
              <p className="text-[12px] text-white/60 font-black uppercase mt-8 tracking-[0.6em] animate-pulse">Establishing Next Milestone...</p>
           </div>
        </div>
      )}

      {/* 📊 MINI HUD (Focus on Goals, not Stopwatch) */}
      <div className="bg-[#2D1B2D]/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl romantic-card-glow animate-in slide-in-from-top-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <div className={cn("flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] mb-1", level.color)}>
              {level.icon}
              {level.label}
            </div>
            <h4 className="text-base font-black text-white uppercase tracking-tight italic flex items-center gap-2">
              Current Rate: <span className="text-primary text-xl">{level.multiplier}</span> 
            </h4>
          </div>
          <div className="text-right flex flex-col items-end">
            <Badge className="bg-white/5 border-none text-primary font-black italic px-4 py-1 rounded-xl">
              GOAL: {level.nextGoal}m
            </Badge>
          </div>
        </div>
        
        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 p-0.5">
          <div 
            className={cn("h-full transition-all duration-1000 rounded-full", level.bar)}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-3">
          <p className="text-[8px] font-black uppercase text-slate-500 tracking-[0.3em]">
            Establishment Progress
          </p>
          <div className="flex items-center gap-2 opacity-40">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[8px] font-black uppercase text-white tracking-widest">Signal Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
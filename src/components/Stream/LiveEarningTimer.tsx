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

  // Trigger luxury popup every 30 minutes
  useEffect(() => {
    const currentMilestone = Math.floor(minutes / 30);
    if (minutes > 0 && minutes % 30 === 0 && currentMilestone > lastMilestone) {
      setShowPopup(true);
      setLastMilestone(currentMilestone);
      const timer = setTimeout(() => setShowPopup(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [minutes, lastMilestone]);

  const getLevelDetails = () => {
    if (minutes >= 120) return { 
      label: "👑 LEGEND NODE", 
      multiplier: "3.0x", 
      color: "text-yellow-400", 
      bar: "bg-yellow-500 shadow-[0_0_20px_#fbbf24]",
      nextGoal: 150,
      icon: <Trophy className="size-4" />
    };
    if (minutes >= 90) return { 
      label: "💎 ELITE QUEEN", 
      multiplier: "2.5x", 
      color: "text-purple-400", 
      bar: "bg-purple-500 shadow-[0_0_20px_#a855f7]",
      nextGoal: 120,
      icon: <Sparkles className="size-4" />
    };
    if (minutes >= 60) return { 
      label: "⭐ DIAMOND STAR", 
      multiplier: "2.0x", 
      color: "text-cyan-400", 
      bar: "bg-cyan-500 shadow-[0_0_20px_#22d3ee]",
      nextGoal: 90,
      icon: <Star className="size-4" />
    };
    if (minutes >= 30) return { 
      label: "✨ RISING SIGNAL", 
      multiplier: "1.5x", 
      color: "text-pink-400", 
      bar: "bg-pink-500 shadow-[0_0_20px_#ec4899]",
      nextGoal: 60,
      icon: <Zap className="size-4" />
    };
    return { 
      label: "🌱 NEWBIE NODE", 
      multiplier: "1.0x", 
      color: "text-slate-400", 
      bar: "romantic-gradient shadow-[0_0_10px_#E11D48]",
      nextGoal: 30,
      icon: <Zap className="size-4" />
    };
  };

  const level = getLevelDetails();
  const currentIntervalStart = Math.floor(minutes / 30) * 30;
  const progress = ((minutes - currentIntervalStart) / 30) * 100;

  return (
    <div className="absolute top-20 left-10 right-10 z-50 pointer-events-none">
      {/* 🏆 LUXURY BONUS POPUP OVERLAY - Appears only on milestone hit */}
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

      {/* 📊 MINI HUD - More minimal to prevent face obstruction */}
      <div className="bg-[#2D1B2D]/40 backdrop-blur-md border border-white/5 rounded-3xl p-4 shadow-xl transition-all">
        <div className="flex justify-between items-center mb-2">
          <div className="flex flex-col">
            <div className={cn("flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.2em]", level.color)}>
              {level.icon}
              {level.label}
            </div>
            <h4 className="text-xs font-black text-white uppercase tracking-tight italic flex items-center gap-1">
              Rate: <span className="text-primary">{level.multiplier}</span> 
            </h4>
          </div>
          <Badge className="bg-white/5 border-none text-primary font-black italic text-[9px] px-3 py-0.5 rounded-full">
            GOAL: {level.nextGoal}m
          </Badge>
        </div>
        
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <div 
            className={cn("h-full transition-all duration-1000 rounded-full", level.bar)}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

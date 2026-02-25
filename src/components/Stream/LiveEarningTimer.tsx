
'use client';

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Trophy, Zap, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LiveEarningTimerProps {
  minutes: number;
}

/**
 * Luxury 30-Minute Milestone HUD (Minimized to prevent Face Blocking)
 */
export default function LiveEarningTimer({ minutes }: LiveEarningTimerProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [lastMilestone, setLastMilestone] = useState(0);

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
    if (minutes >= 120) return { multiplier: "3.0x", color: "text-yellow-400", nextGoal: 150, icon: <Trophy className="size-3" /> };
    if (minutes >= 90) return { multiplier: "2.5x", color: "text-purple-400", nextGoal: 120, icon: <Sparkles className="size-3" /> };
    if (minutes >= 60) return { multiplier: "2.0x", color: "text-cyan-400", nextGoal: 90, icon: <Star className="size-3" /> };
    if (minutes >= 30) return { multiplier: "1.5x", color: "text-pink-400", nextGoal: 60, icon: <Zap className="size-3" /> };
    return { multiplier: "1.0x", color: "text-white", nextGoal: 30, icon: <Zap className="size-3" /> };
  };

  const level = getLevelDetails();

  return (
    <div className="relative">
      {/* CELEBRATION MODAL (FULL SCREEN) */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-[110] animate-in zoom-in fade-in duration-700 bg-black/60 backdrop-blur-md">
           <div className="bg-[#2D1B2D]/90 backdrop-blur-3xl border-4 border-primary p-12 rounded-[4rem] text-center shadow-[0_0_120px_rgba(225,29,72,0.8)] romantic-glow">
              <Trophy className="size-24 text-yellow-400 mx-auto mb-6 animate-bounce" />
              <div className="space-y-4">
                <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-none">GOAL REACHED!</h2>
                <div className="bg-primary px-8 py-3 rounded-2xl inline-block shadow-2xl">
                   <p className="text-3xl font-black text-white uppercase tracking-widest">{level.multiplier} REVENUE UNLOCKED</p>
                </div>
              </div>
              <p className="text-[12px] text-white/60 font-black uppercase mt-10 tracking-[0.6em] animate-pulse">Stay Live to earn more</p>
           </div>
        </div>
      )}

      {/* MINIMAL BADGE (TOP RIGHT - NO FACE BLOCKING) */}
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-2 px-4 shadow-2xl flex items-center gap-3">
        <div className="flex flex-col items-start">
          <span className="text-[8px] font-black text-primary uppercase tracking-widest leading-none mb-1">Revenue</span>
          <div className="flex items-center gap-1.5">
            {level.icon}
            <span className={cn("text-xs font-black italic tracking-tighter", level.color)}>{level.multiplier}</span>
          </div>
        </div>
        <div className="h-6 w-px bg-white/10" />
        <div className="flex flex-col items-end">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Target</span>
          <span className="text-[10px] font-black text-white italic">{level.nextGoal}m</span>
        </div>
      </div>
    </div>
  );
}

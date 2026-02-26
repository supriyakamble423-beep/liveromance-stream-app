'use client';

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Trophy, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFirebase } from "@/firebase";
import { doc, updateDoc, serverTimestamp, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface LiveEarningTimerProps {
  minutes: number;
  hostId: string;
  minimal?: boolean;
}

export default function LiveEarningTimer({ minutes, hostId, minimal = false }: LiveEarningTimerProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [lastMilestone, setLastMilestone] = useState(0);
  const { firestore } = useFirebase();
  const { toast } = useToast();

  useEffect(() => {
    const currentMilestone = Math.floor(minutes / 30);
    if (minutes > 0 && minutes % 30 === 0 && currentMilestone > lastMilestone) {
      setShowPopup(true);
      setLastMilestone(currentMilestone);
    }
  }, [minutes, lastMilestone]);

  const claimBonus = async () => {
    if (!firestore || !hostId) return;
    try {
      const hostRef = doc(firestore, 'hosts', hostId);
      await updateDoc(hostRef, {
        earnings: increment(500),
        updatedAt: serverTimestamp()
      });
      setShowPopup(false);
      toast({ title: "Bonus Claimed!", description: "500 Diamonds added to your vault." });
    } catch (e) {
      toast({ variant: "destructive", title: "Claim Failed" });
    }
  };

  const getLevelDetails = () => {
    if (minutes >= 120) return { multiplier: "3.0x", color: "text-yellow-400", nextGoal: 150, icon: <Trophy className="size-3" /> };
    if (minutes >= 90) return { multiplier: "2.5x", color: "text-purple-400", nextGoal: 120, icon: <Sparkles className="size-3" /> };
    if (minutes >= 60) return { multiplier: "2.0x", color: "text-cyan-400", nextGoal: 90, icon: <Star className="size-3" /> };
    if (minutes >= 30) return { multiplier: "1.5x", color: "text-pink-400", nextGoal: 60, icon: <Zap className="size-3" /> };
    return { multiplier: "1.0x", color: "text-white", nextGoal: 30, icon: <Zap className="size-3" /> };
  };

  const level = getLevelDetails();

  if (minimal) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-start">
          <span className="text-[7px] font-black text-primary uppercase tracking-[0.2em] leading-none mb-1">Revenue</span>
          <div className="flex items-center gap-1">
            {level.icon}
            <span className={cn("text-[10px] font-black italic tracking-tighter", level.color)}>{level.multiplier}</span>
          </div>
        </div>
        <div className="h-5 w-px bg-white/20" />
        <div className="flex flex-col items-start">
          <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-1">Target</span>
          <span className="text-[10px] font-black text-white italic">{level.nextGoal}m</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-[200] bg-black/80 backdrop-blur-md p-6">
           <div className="bg-gradient-to-br from-[#2D1B2D] to-black border-4 border-yellow-500/50 p-10 rounded-[3.5rem] text-center shadow-[0_0_100px_rgba(234,179,8,0.4)] animate-in zoom-in duration-500">
              <Trophy className="size-20 text-yellow-400 mx-auto mb-6 animate-bounce" />
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none mb-2">30 MIN BONUS!</h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Milestone Reached Successfully</p>
              
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl mb-8">
                <p className="text-2xl font-black text-yellow-400 tracking-tight">+500 DIAMONDS</p>
              </div>

              <div className="flex flex-col gap-3">
                <Button onClick={claimBonus} className="w-full h-16 bg-yellow-500 hover:bg-yellow-600 text-black font-black uppercase tracking-widest rounded-2xl shadow-xl">
                  Claim Reward
                </Button>
                <Button variant="ghost" onClick={() => setShowPopup(false)} className="text-white/40 font-bold uppercase text-[10px] tracking-widest">
                  Later
                </Button>
              </div>
           </div>
        </div>
      )}
    </>
  );
}

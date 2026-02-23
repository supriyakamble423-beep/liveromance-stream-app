'use server';
/**
 * @fileOverview Referral Leaderboard page for the GlobalStream application.
 * Displays the top 10 hosts based on their referral counts.
 */

'use client';

import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { Trophy, Crown, Heart, Share2, Medal, ChevronLeft } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

export default function ReferralLeaderboard() {
  const { firestore } = useFirebase();

  // Top 10 Referrers Query - Ordering by referralCount descending
  const leaderboardQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'hosts'), 
      orderBy('referralCount', 'desc'), 
      limit(10)
    );
  }, [firestore]);

  const { data: topHosts, isLoading } = useCollection(leaderboardQuery);

  return (
    <div className="min-h-screen bg-[#0F0101] text-white pb-32 max-w-lg mx-auto border-x border-white/10">
      {/* --- Sticky Header --- */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <Link href="/lifetime">
          <Button variant="ghost" size="icon" className="rounded-full bg-white/5">
            <ChevronLeft className="size-5" />
          </Button>
        </Link>
        <h2 className="text-sm font-black uppercase tracking-widest italic">Hall of Fame</h2>
        <div className="size-10" />
      </header>

      {/* --- Hero Section --- */}
      <section className="py-12 text-center space-y-4 px-6 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="flex justify-center mb-2">
          <div className="relative animate-bounce duration-[2000ms]">
            <Crown className="size-16 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]" />
          </div>
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
            Referral Queens
          </h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
            Top 10 Global Network Architects
          </p>
        </div>
      </section>

      {/* --- Leaderboard List --- */}
      <main className="px-4 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center py-20 opacity-30 animate-pulse">
            <Trophy className="size-12 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Calculating Ranks...</p>
          </div>
        ) : topHosts && topHosts.length > 0 ? (
          topHosts.map((host, index) => (
            <div 
              key={host.id}
              className={cn(
                "flex items-center justify-between p-5 rounded-[2.5rem] border transition-all duration-500 animate-in slide-in-from-bottom-4",
                index === 0 
                ? "bg-gradient-to-r from-red-600/20 to-pink-600/20 border-yellow-500/50 shadow-[0_15px_40px_rgba(236,72,153,0.2)] ring-1 ring-yellow-400/20" 
                : "bg-white/5 border-white/5 hover:bg-white/10"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-4">
                {/* Rank Badge */}
                <div className={cn(
                  "flex flex-col items-center justify-center size-12 rounded-2xl border font-black italic text-lg",
                  index === 0 ? "bg-yellow-400 text-black border-yellow-300" : 
                  index === 1 ? "bg-slate-300 text-black border-slate-200" :
                  index === 2 ? "bg-amber-700 text-white border-amber-600" :
                  "bg-white/5 text-slate-400 border-white/10"
                )}>
                  {index === 0 ? <Medal className="size-6" /> : index + 1}
                </div>

                {/* Host Info */}
                <div className="flex items-center gap-3">
                  <div className="relative size-12 rounded-2xl overflow-hidden border border-white/10 bg-slate-900">
                    <Image 
                      src={host.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${host.id}`} 
                      alt="Host" 
                      fill 
                      className="object-cover" 
                    />
                  </div>
                  <div>
                    <p className="text-sm font-black tracking-tight flex items-center gap-1 uppercase italic">
                      {host.username || `Host_${host.id.slice(0, 4)}`}
                      {index === 0 && <Sparkles className="size-3 text-yellow-400 fill-current" />}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest mt-0.5">
                      <Share2 className="size-3" /> {host.referralCount || 0} Nodes
                    </div>
                  </div>
                </div>
              </div>

              {/* Earnings / Diamonds */}
              <div className="text-right">
                <p className="text-xl font-black italic text-white flex items-center justify-end gap-1 tracking-tighter">
                  <Heart className="size-4 text-red-500 fill-current" />
                  {host.referralEarnings?.toLocaleString() || 0}
                </p>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Comm. Earned</p>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">The race hasn't started yet...</p>
          </div>
        )}
      </main>

      {/* --- Program CTA --- */}
      <section className="p-6 mt-8">
        <div className="romantic-gradient p-8 rounded-[3rem] text-white text-center space-y-4 shadow-2xl romantic-glow">
          <h3 className="text-xl font-black uppercase italic tracking-tighter leading-none">Join the Global Elite</h3>
          <p className="text-[11px] font-bold uppercase opacity-90 leading-relaxed">
            Every referral earns you 1% lifetime commission. Start building your empire today.
          </p>
          <Link href="/lifetime" className="block">
            <Button className="w-full h-12 rounded-2xl bg-white text-primary font-black uppercase tracking-widest text-[10px] border-none shadow-xl hover:scale-105 transition-transform">
              Get Invite Link
            </Button>
          </Link>
        </div>
      </section>

      <BottomNav />
    </div>
  );
}

const Sparkles = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
  </svg>
);

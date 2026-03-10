'use client';

import { useState, useEffect } from "react";
import { 
  ShieldCheck, Activity, Users, Ban, DollarSign, TrendingUp, Loader2, ChevronLeft, Lock, RefreshCw, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminControlRoom() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeStreams: 0,
    totalEarnings: 0,
    platformRevenue: 0
  });
  
  const { firestore, user, areServicesAvailable } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const fetchStats = async () => {
    if (!firestore) return;
    try {
      const usersSnap = await getDocs(collection(firestore, 'users'));
      const hostsSnap = await getDocs(query(collection(firestore, 'hosts'), where('isLive', '==', true)));
      
      let totalD = 0;
      usersSnap.forEach(d => {
        totalD += (d.data().diamonds || 0);
      });

      setStats({
        totalUsers: usersSnap.size,
        activeStreams: hostsSnap.size,
        totalEarnings: totalD,
        platformRevenue: totalD * 0.02 * 0.8 
      });
    } catch (e) {
      console.error("Stats fetch failed", e);
    }
  };

  useEffect(() => {
    async function checkAdmin() {
      if (!areServicesAvailable || !user || !firestore) {
        const timeout = setTimeout(() => {
          if (!user && !isChecking) router.push('/global');
        }, 5000);
        return () => clearTimeout(timeout);
      }

      try {
        const adminSnap = await getDocs(query(collection(firestore, 'admins'), where('email', '==', user.email)));
        
        if (adminSnap.empty && user.email !== 'supriyakamble423@gmail.com') {
          setIsAdmin(false);
        } else {
          setIsAdmin(true);
          fetchStats();
        }
      } catch (e) {
        console.error("Admin check failed", e);
      } finally {
        setIsChecking(false);
      }
    }
    checkAdmin();
  }, [user, firestore, areServicesAvailable, isChecking, router]);

  const activeStreamsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, 'hosts'), where('isLive', '==', true));
  }, [firestore, isAdmin]);

  const { data: activeStreams } = useCollection(activeStreamsQuery);

  if (isChecking) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="relative size-20">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
          <div className="relative size-full bg-slate-900 border-2 border-primary rounded-full flex items-center justify-center">
            <Loader2 className="size-10 text-primary animate-spin" />
          </div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse">Verifying Authority...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
        <div className="size-24 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mb-8 border border-red-500/20 romantic-glow">
          <Lock className="size-12 text-red-500" />
        </div>
        <h1 className="text-3xl font-black uppercase italic mb-4 tracking-tighter">Access <span className="text-red-500">Denied</span></h1>
        <p className="text-xs text-slate-400 mb-10 leading-relaxed uppercase font-bold tracking-widest px-6">
          Authority Restricted. Your email <span className="text-primary">{user?.email || 'Guest'}</span> is not in the Overseer list.
        </p>
        
        <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 text-left mb-10 shadow-2xl">
          <div>
            <p className="text-[10px] font-black text-primary uppercase mb-2 tracking-widest">1. Collection Name</p>
            <p className="text-sm font-mono bg-black/40 p-3 rounded-xl border border-white/5">admins</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-primary uppercase mb-2 tracking-widest">2. Email Field</p>
            <p className="text-sm font-mono bg-black/40 p-3 rounded-xl border border-white/5 select-all truncate">{user?.email || 'Login Required'}</p>
          </div>
        </div>

        <Link href="/global" className="w-full">
          <Button className="w-full h-16 rounded-2xl font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/20">
            Back to Safety
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-lg mx-auto border-x border-white/10 bg-slate-950 text-white pb-20 mesh-gradient">
      <header className="flex flex-col px-8 pt-12 pb-8 bg-slate-950/40 backdrop-blur-xl border-b border-white/5 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="size-14 bg-primary/20 rounded-[1.5rem] flex items-center justify-center border border-primary/30 romantic-glow">
                <ShieldCheck className="size-8 text-primary" />
             </div>
             <div>
                <h1 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Sentinel</h1>
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mt-1">Overseer Active</p>
             </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchStats} variant="ghost" size="icon" className="rounded-full bg-white/5 border border-white/10 size-10">
              <RefreshCw className="size-4 text-slate-400" />
            </Button>
            <Link href="/admin/payouts">
              <Button size="sm" className="rounded-full text-[9px] font-black uppercase romantic-gradient h-10 px-6 border-none shadow-lg">
                Payout Queue
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 space-y-8 pb-32 no-scrollbar pt-8">
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-blue-600/10 p-6 rounded-[2.5rem] border border-blue-500/20 shadow-xl">
            <Users className="size-6 text-blue-400 mb-3" />
            <p className="text-3xl font-black italic tracking-tighter">{stats.totalUsers}</p>
            <p className="text-[9px] font-black uppercase text-blue-400/60 tracking-widest mt-1">Global Nodes</p>
          </div>
          <div className="bg-red-600/10 p-6 rounded-[2.5rem] border border-red-500/20 shadow-xl">
            <Activity className="size-6 text-red-400 mb-3" />
            <p className="text-3xl font-black italic tracking-tighter">{stats.activeStreams}</p>
            <p className="text-[9px] font-black uppercase text-red-400/60 tracking-widest mt-1">Live Signals</p>
          </div>
          <div className="bg-amber-600/10 p-6 rounded-[2.5rem] border border-amber-500/20 shadow-xl">
            <DollarSign className="size-6 text-amber-400 mb-3" />
            <p className="text-3xl font-black italic tracking-tighter">💎 {stats.totalEarnings}</p>
            <p className="text-[9px] font-black uppercase text-amber-400/60 tracking-widest mt-1">Total Diamonds</p>
          </div>
          <div className="bg-green-600/10 p-6 rounded-[2.5rem] border border-green-500/20 shadow-xl">
            <TrendingUp className="size-6 text-green-400 mb-3" />
            <p className="text-3xl font-black italic tracking-tighter">₹{stats.platformRevenue.toFixed(0)}</p>
            <p className="text-[9px] font-black uppercase text-green-400/60 tracking-widest mt-1">Net Yield</p>
          </div>
        </section>

        <section className="bg-white/5 border border-white/10 rounded-[3rem] p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="size-5 text-primary" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Network Health</h2>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-none text-[8px] font-black">STABLE</Badge>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
              <span>Sync Latency</span>
              <span className="text-green-400">42ms</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[95%] romantic-glow" />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Live Signals</h2>
            <Badge variant="secondary" className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase px-3 py-1">Monitoring</Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {activeStreams?.map((stream) => (
              <div key={stream.id} className="relative aspect-square rounded-[2rem] overflow-hidden border border-white/10 group shadow-2xl">
                <Image 
                  src={stream.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${stream.id}`} 
                  alt="Node" 
                  fill 
                  className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-3 gap-2 backdrop-blur-sm">
                  <p className="text-[8px] font-black uppercase text-white truncate w-full text-center">@{stream.username}</p>
                  <Button size="icon" variant="destructive" className="size-8 rounded-full shadow-xl"><Ban className="size-4" /></Button>
                </div>
                <div className="absolute top-2 right-2 size-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]" />
              </div>
            ))}
            {(!activeStreams || activeStreams.length === 0) && (
              <div className="col-span-3 py-16 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 shadow-inner">
                <div className="size-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="size-8 text-slate-700" />
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">No active signals detected <br/>in the global grid</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
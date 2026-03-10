'use client';

import { useState, useEffect } from "react";
import { 
  ShieldCheck, Activity, Users, Ban, DollarSign, TrendingUp, Loader2, ChevronLeft, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
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

  useEffect(() => {
    async function checkAdmin() {
      if (!areServicesAvailable || !user || !firestore) {
        if (!user && !isChecking) router.push('/global');
        return;
      }

      try {
        // Checking if user email exists in 'admins' collection
        const adminSnap = await getDocs(query(collection(firestore, 'admins'), where('email', '==', user.email)));
        
        if (adminSnap.empty) {
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
  }, [user, firestore, areServicesAvailable]);

  const fetchStats = async () => {
    if (!firestore) return;
    try {
      const usersSnap = await getDocs(collection(firestore, 'users'));
      const hostsSnap = await getDocs(query(collection(firestore, 'hosts'), where('isLive', '==', true)));
      
      let totalD = 0;
      usersSnap.forEach(d => totalD += (d.data().diamonds || 0));

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

  const activeStreamsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, 'hosts'), where('isLive', '==', true));
  }, [firestore, isAdmin]);

  const { data: activeStreams } = useCollection(activeStreamsQuery);

  if (isChecking) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="size-10 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Verifying Authority...</p>
      </div>
    );
  }

  // 🔐 ACCESS DENIED UI (With Setup Info)
  if (!isAdmin) {
    return (
      <div className="h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
        <div className="size-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30">
          <Lock className="size-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-black uppercase italic mb-2">Access Denied</h1>
        <p className="text-xs text-slate-400 mb-8 leading-relaxed">
          Aapka account Admin list mein nahi hai. Is page ko access karne ke liye niche di gayi details ko Firestore mein add karein:
        </p>
        
        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 text-left mb-8">
          <div>
            <p className="text-[10px] font-black text-primary uppercase mb-1">Collection Name</p>
            <p className="text-sm font-mono bg-black/40 p-2 rounded border border-white/5">admins</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-primary uppercase mb-1">Your Email (Add this field)</p>
            <p className="text-sm font-mono bg-black/40 p-2 rounded border border-white/5 select-all">{user?.email || 'Guest'}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-primary uppercase mb-1">Your UID (Optional)</p>
            <p className="text-[10px] font-mono bg-black/40 p-2 rounded border border-white/5 select-all">{user?.uid}</p>
          </div>
        </div>

        <Link href="/global" className="w-full">
          <Button className="w-full h-14 rounded-xl font-black uppercase tracking-widest">Back to Safety</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-lg mx-auto border-x border-white/10 bg-slate-950 text-white pb-20">
      <header className="flex flex-col px-6 pt-10 pb-6 bg-slate-950/80 backdrop-blur-md border-b border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
                <ShieldCheck className="size-6 text-primary" />
             </div>
             <div>
                <h1 className="text-xl font-black uppercase italic tracking-tighter">Sentinel</h1>
                <p className="text-[8px] font-black text-primary uppercase tracking-[0.3em]">Overseer Active</p>
             </div>
          </div>
          <Link href="/admin/payouts">
            <Button size="sm" variant="outline" className="rounded-full text-[9px] font-black uppercase border-white/10 h-9">
              Payout Queue
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 space-y-8 pb-24 no-scrollbar pt-6">
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-blue-600/20 p-5 rounded-3xl border border-blue-500/30">
            <Users className="size-5 text-blue-400 mb-2" />
            <p className="text-2xl font-black">{stats.totalUsers}</p>
            <p className="text-[8px] font-black uppercase text-blue-400/60">Total Nodes</p>
          </div>
          <div className="bg-red-600/20 p-5 rounded-3xl border border-red-500/30">
            <Activity className="size-5 text-red-400 mb-2" />
            <p className="text-2xl font-black">{stats.activeStreams}</p>
            <p className="text-[8px] font-black uppercase text-red-400/60">Active Signals</p>
          </div>
          <div className="bg-yellow-600/20 p-5 rounded-3xl border border-yellow-500/30">
            <DollarSign className="size-5 text-yellow-400 mb-2" />
            <p className="text-2xl font-black">{stats.totalEarnings}</p>
            <p className="text-[8px] font-black uppercase text-yellow-400/60">Diamonds in Vault</p>
          </div>
          <div className="bg-green-600/20 p-5 rounded-3xl border border-green-500/30">
            <TrendingUp className="size-5 text-green-400 mb-2" />
            <p className="text-2xl font-black">₹{stats.platformRevenue.toFixed(0)}</p>
            <p className="text-[8px] font-black uppercase text-green-400/60">Net Yield</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-2">Active Signals</h2>
          <div className="grid grid-cols-4 gap-3">
            {activeStreams?.map((stream) => (
              <div key={stream.id} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group">
                <Image src={stream.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${stream.id}`} alt="Node" fill className="object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                  <Button size="icon" variant="destructive" className="size-8 rounded-full"><Ban className="size-4" /></Button>
                </div>
              </div>
            ))}
            {(!activeStreams || activeStreams.length === 0) && (
              <div className="col-span-4 py-10 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                <p className="text-[10px] font-black text-slate-500 uppercase">No active streams</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

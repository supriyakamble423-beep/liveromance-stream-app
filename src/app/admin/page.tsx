'use client';

import { useState, useEffect } from "react";
import { 
  Monitor, ShieldAlert, Send, PowerOff, AlertTriangle, 
  Search, Grid, LayoutGrid, ShieldCheck, Activity, Users,
  Ban, ShieldX, Ghost, Eye, Loader2, DollarSign, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { adminAIErrorReports, type AdminAIErrorReportsOutput } from "@/ai/flows/admin-ai-error-reports";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, doc, setDoc, where, updateDoc, getDocs } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminControlRoom() {
  const [reports, setReports] = useState<AdminAIErrorReportsOutput["autoReports"]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeStreams: 0,
    totalEarnings: 0,
    platformRevenue: 0
  });
  
  const { firestore, user, areServicesAvailable } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  // ✅ Secure Admin Check
  useEffect(() => {
    async function checkAdmin() {
      if (!user || !firestore) return;
      const adminSnap = await getDocs(query(collection(firestore, 'admins'), where('email', '==', user.email)));
      if (adminSnap.empty) {
        toast({ variant: "destructive", title: "Access Denied", description: "Admin rights required." });
        router.push('/global');
        return;
      }
      setIsAdmin(true);
      fetchStats();
    }
    checkAdmin();
  }, [user, firestore]);

  const fetchStats = async () => {
    if (!firestore) return;
    const usersSnap = await getDocs(collection(firestore, 'users'));
    const hostsSnap = await getDocs(query(collection(firestore, 'hosts'), where('isLive', '==', true)));
    
    let totalD = 0;
    usersSnap.forEach(d => totalD += (d.data().diamonds || 0));

    setStats({
      totalUsers: usersSnap.size,
      activeStreams: hostsSnap.size,
      totalEarnings: totalD,
      platformRevenue: totalD * 0.02 * 0.8 // Simulated 80% commission value
    });
  };

  const activeStreamsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'hosts'), where('isLive', '==', true));
  }, [firestore]);

  const { data: activeStreams } = useCollection(activeStreamsQuery);

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-lg mx-auto border-x border-white/10 bg-slate-950 text-white pb-20 screen-guard-active">
      <header className="flex flex-col px-6 pt-10 pb-6 bg-slate-950/80 backdrop-blur-md border-b border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
                <ShieldCheck className="size-6 text-primary" />
             </div>
             <div>
                <h1 className="text-xl font-black uppercase italic tracking-tighter">Sentinel Command</h1>
                <p className="text-[8px] font-black text-primary uppercase tracking-[0.3em]">System Overseer Active</p>
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
        {/* Stats Grid */}
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

        {/* Active Nodes List */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Active Signals Explorer</h2>
          <div className="grid grid-cols-4 gap-3">
            {activeStreams?.map((stream) => (
              <div key={stream.id} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group">
                <Image src={stream.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${stream.id}`} alt="Node" fill className="object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                  <Button size="icon" variant="destructive" className="size-8 rounded-full"><Ban className="size-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

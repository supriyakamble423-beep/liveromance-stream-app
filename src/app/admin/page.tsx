'use client';

import { useState, useEffect } from "react";
import { 
  Bell, Monitor, MessageSquare, ShieldAlert, Send, Eye, ShieldCheck, UserCircle, Download, Wifi, Activity, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { adminAIErrorReports, type AdminAIErrorReportsOutput } from "@/ai/flows/admin-ai-error-reports";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, limit, orderBy } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export default function AdminControlRoom() {
  const [reports, setReports] = useState<AdminAIErrorReportsOutput["autoReports"]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [adminMsg, setAdminMsg] = useState("");
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const liveHostsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'hosts'), orderBy('updatedAt', 'desc'), limit(1));
  }, [firestore]);

  const { data: hosts } = useCollection(liveHostsQuery);
  const activeHost = hosts?.[0];

  useEffect(() => {
    async function fetchReports() {
      setIsLoading(true);
      try {
        const res = await adminAIErrorReports({
          systemLogs: "Global success rate: 99.8%. Nodes scaling in US-EAST-1.",
          hostVerificationIssues: ["User #442: High shadow count during capture"]
        });
        setReports(res.autoReports);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReports();
  }, []);

  const sendAdminMessage = async () => {
    if (!adminMsg.trim() || !activeHost) {
      toast({ variant: "destructive", title: "Error", description: "Target host required." });
      return;
    }
    
    try {
      await addDoc(collection(firestore, 'adminMessages'), {
        hostId: activeHost.id,
        content: adminMsg,
        timestamp: serverTimestamp(),
        sender: 'Admin-GodMode'
      });
      setAdminMsg("");
      toast({ title: "Signal Transmitted", description: "Direct communication established." });
    } catch (e) {
      console.error("Admin message error:", e);
      toast({ variant: "destructive", title: "Failure", description: "Node disconnection." });
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-lg mx-auto border-x border-white/10 bg-slate-950 text-white pb-20">
      <header className="flex items-center justify-between px-6 pt-10 pb-4 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22D3EE]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Mainframe</span>
          </div>
          <h1 className="text-xl font-black tracking-tight font-headline">SYSTEM OVERSEER</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="icon" className="rounded-full bg-white/5 text-white border-white/10">
            <Bell className="size-5" />
          </Button>
          <div className="size-10 rounded-full border-2 border-cyan-400/30 flex items-center justify-center bg-slate-900 overflow-hidden relative">
             <UserCircle className="size-6 text-slate-500" />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 space-y-6 pb-24 no-scrollbar">
        <section className="grid grid-cols-2 gap-3 mt-6">
          <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] font-black uppercase text-slate-500">Success Rate</p>
              <Activity className="size-3 text-green-500" />
            </div>
            <p className="text-2xl font-black">99.8%</p>
            <p className="text-[8px] text-green-500 font-bold uppercase mt-1">+0.2% Optimal</p>
          </div>
          <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] font-black uppercase text-slate-500">Total Zaps</p>
              <Zap className="size-3 text-primary" />
            </div>
            <p className="text-2xl font-black">1.5M</p>
            <p className="text-[8px] text-primary font-bold uppercase mt-1">Global Revenue Active</p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Monitor className="size-4 text-cyan-400" /> Satellite Feed
            </h2>
            <Badge className="bg-red-500/20 text-red-500 border-none text-[8px] font-black uppercase tracking-widest">Live Surveillance</Badge>
          </div>

          <div className="relative aspect-video rounded-[2rem] bg-black overflow-hidden border border-white/10 group shadow-2xl">
            {activeHost ? (
              <>
                <Image 
                  src={activeHost.previewImageUrl || "https://picsum.photos/seed/admin/800/450"} 
                  alt="Monitor" 
                  fill
                  className="object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge className="bg-red-600 text-[10px] font-black uppercase shadow-lg">TARGET_{activeHost.id.slice(0,4)}</Badge>
                  <Badge className="bg-black/60 backdrop-blur-md text-[10px] uppercase border border-white/10">{activeHost.streamType || 'PUBLIC'}</Badge>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1 bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-md">
                    <Eye className="size-3" /> {activeHost.viewers || 0} viewers
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-700">
                <ShieldAlert className="size-12 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">All Systems Nominal - No Active Feeds</p>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-2">
            <MessageSquare className="size-4 text-primary" /> Command Terminal
          </h2>
          <div className="bg-slate-900/50 border border-white/10 rounded-[2.5rem] p-5 flex flex-col h-60 shadow-inner">
            <div className="flex-grow overflow-y-auto space-y-3 mb-4 pr-2 no-scrollbar">
              <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-3xl">
                <div className="flex items-center gap-2 mb-1">
                   <ShieldCheck className="size-3 text-primary" />
                   <p className="text-[10px] font-black text-primary uppercase tracking-widest">Overseer Message Log</p>
                </div>
                <p className="text-xs text-slate-400 font-medium">Ready for transmission. Select a node to initiate direct override.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Input 
                value={adminMsg}
                onChange={(e) => setAdminMsg(e.target.value)}
                placeholder="Command input..." 
                className="bg-black/50 border-white/10 text-xs h-14 rounded-2xl focus-visible:ring-primary uppercase font-bold tracking-tight"
              />
              <Button onClick={sendAdminMessage} size="icon" className="bg-primary hover:bg-primary/90 shrink-0 rounded-2xl size-14 shadow-xl shadow-primary/20">
                <Send className="size-6" />
              </Button>
            </div>
          </div>
        </section>

        <section className="pb-10">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">AI Intelligence Reports</h2>
            <Download className="size-4 text-slate-600" />
          </div>
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex flex-col items-center py-10 opacity-30 animate-pulse">
                 <Wifi className="size-8" />
              </div>
            ) : reports.map((report, idx) => (
              <div key={idx} className="p-5 rounded-[2rem] bg-white/5 border border-white/5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-black text-xs uppercase tracking-tight">{report.reportType}</h3>
                  <Badge variant="secondary" className={cn(
                    "text-[8px] uppercase font-black px-3 py-1",
                    report.severity === 'Critical' ? "bg-red-500/20 text-red-500" : "bg-cyan-500/20 text-cyan-400"
                  )}>
                    {report.severity}
                  </Badge>
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase tracking-tighter">{report.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

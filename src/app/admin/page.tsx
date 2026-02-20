'use client';

import { useState, useEffect } from "react";
import { 
  Bell, LayoutDashboard, 
  Monitor, MessageSquare, ShieldAlert, Send, Eye, ShieldCheck, UserCircle, Download, Wifi
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

export default function AdminControlRoom() {
  const [reports, setReports] = useState<AdminAIErrorReportsOutput["autoReports"]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [adminMsg, setAdminMsg] = useState("");
  const { firestore, auth } = useFirebase();
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
          systemLogs: "Memory usage spike on Node 3. Latency > 200ms detected in AP-South-1 region.",
          hostVerificationIssues: ["User #882: ID document blurry", "User #991: Face mismatch detected"]
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
      toast({ variant: "destructive", title: "Error", description: "No message or no active host selected." });
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
      toast({ title: "Message Sent", description: "Host has been notified directly." });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error", description: "Failed to send message." });
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-lg mx-auto border-x border-white/10 bg-slate-950 text-white pb-20">
      <header className="flex items-center justify-between px-6 pt-10 pb-4 sticky top-0 z-20 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22D3EE] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Control Room</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight font-headline">God Mode</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="icon" className="size-10 rounded-full bg-white/5 text-white border-white/10 border">
            <Bell className="size-5" />
          </Button>
          <div className="size-10 rounded-full overflow-hidden border-2 border-cyan-400/30 relative bg-slate-900 flex items-center justify-center">
            <UserCircle className="size-6 text-slate-500" />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 space-y-6 pb-24 no-scrollbar">
        {/* Real-time Monitor Section */}
        <section className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Monitor className="size-4 text-cyan-400" /> Live Feed Monitor
            </h2>
            <Badge className="bg-red-500/20 text-red-500 border-none text-[9px] font-bold">GOD MODE ACTIVE</Badge>
          </div>

          <div className="relative aspect-video rounded-2xl bg-black overflow-hidden border border-white/10 group shadow-2xl">
            {activeHost ? (
              <>
                <img 
                  src={activeHost.previewImageUrl || "https://picsum.photos/seed/admin/800/450"} 
                  alt="Monitor" 
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge className="bg-red-600 text-[10px] font-black uppercase shadow-lg">Host_{activeHost.id.slice(0,4)}</Badge>
                  <Badge className="bg-black/40 backdrop-blur-md text-[10px] uppercase border border-white/10">{activeHost.streamType || 'PUBLIC'}</Badge>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
                    <Eye className="size-3" /> {activeHost.viewers || 0} watching
                  </span>
                  <Badge variant="outline" className="border-cyan-400 text-cyan-400 text-[9px] animate-pulse">ENCRYPTED FEED</Badge>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-600">
                <div className="size-16 rounded-full bg-white/5 flex items-center justify-center border border-white/5 animate-pulse">
                   <ShieldAlert className="size-8" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest">No Active Streams Found</p>
              </div>
            )}
          </div>
        </section>

        {/* God Mode Direct Chat */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
             <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
               <MessageSquare className="size-4 text-primary" /> Direct Host Chat
             </h2>
             {activeHost && <span className="text-[10px] text-primary font-bold uppercase tracking-widest">Target: Host_{activeHost.id.slice(0,4)}</span>}
          </div>
          <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-4 flex flex-col h-56 shadow-inner">
            <div className="flex-grow overflow-y-auto space-y-3 mb-4 pr-2 no-scrollbar">
              <div className="bg-primary/10 border-l-2 border-primary p-3 rounded-r-2xl">
                <div className="flex items-center gap-2 mb-1">
                   <ShieldCheck className="size-3 text-primary" />
                   <p className="text-[10px] font-black text-primary uppercase tracking-widest">GodMode System</p>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">Awaiting your command, Admin. Select a host to transmit guidance or warnings.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input 
                value={adminMsg}
                onChange={(e) => setAdminMsg(e.target.value)}
                placeholder="Message host dashboard..." 
                className="bg-black/50 border-white/10 text-xs h-12 rounded-2xl focus-visible:ring-primary"
              />
              <Button onClick={sendAdminMessage} size="icon" className="bg-primary hover:bg-primary/90 shrink-0 rounded-2xl size-12 shadow-lg shadow-primary/20">
                <Send className="size-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* AI Reports */}
        <section className="pb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">AI Operational reports</h2>
            <Button variant="link" className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest p-0 h-auto gap-1">
              Export Logs <Download className="size-3" />
            </Button>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex flex-col items-center py-10 gap-2 opacity-50">
                 <Wifi className="size-6 text-slate-500 animate-pulse" />
                 <p className="text-[10px] font-bold uppercase tracking-widest">Syncing Global Logs...</p>
              </div>
            ) : reports.map((report, idx) => (
              <div key={idx} className="p-4 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-xs text-white">{report.reportType}</h3>
                  <Badge variant="secondary" className={cn(
                    "text-[8px] uppercase font-bold px-2 py-0",
                    report.severity === 'Critical' ? "bg-red-500/20 text-red-500" : "bg-cyan-500/20 text-cyan-500"
                  )}>
                    {report.severity}
                  </Badge>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">{report.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

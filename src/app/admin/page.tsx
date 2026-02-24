
'use client';

import { useState, useEffect } from "react";
import { 
  Bell, Monitor, MessageSquare, ShieldAlert, Send, Eye, ShieldCheck, UserCircle, Download, Wifi, Activity, Zap, Trash2, PowerOff, Ban, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { adminAIErrorReports, type AdminAIErrorReportsOutput } from "@/ai/flows/admin-ai-error-reports";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, limit, orderBy, doc, setDoc, where } from "firebase/firestore";
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

  const activeStreamsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'hosts'), where('isLive', '==', true), orderBy('updatedAt', 'desc'));
  }, [firestore]);

  const { data: activeStreams } = useCollection(activeStreamsQuery);
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  
  const activeHost = activeStreams?.find(h => h.id === selectedStreamId) || activeStreams?.[0];

  useEffect(() => {
    async function fetchReports() {
      setIsLoading(true);
      try {
        const res = await adminAIErrorReports({
          systemLogs: "AI Node Active. Real-time NSFW scanning enabled on 14 public channels.",
          hostVerificationIssues: ["Node #882: Manual Blur activated by host"]
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

  const terminateStream = async (hostId: string) => {
    if (!firestore) return;
    try {
      await setDoc(doc(firestore, 'hosts', hostId), { 
        isLive: false, 
        adminTermination: true,
        terminatedAt: serverTimestamp() 
      }, { merge: true });
      
      await addDoc(collection(firestore, 'adminMessages'), {
        hostId,
        content: "System Overide: Your stream was terminated due to AI detected violations.",
        timestamp: serverTimestamp(),
        sender: 'AI-Sentinel'
      });
      
      toast({ title: "Node Severed", description: "Host disconnected successfully." });
    } catch (e) {
      toast({ variant: "destructive", title: "Failure", description: "Override failed." });
    }
  };

  const sendAdminMessage = async () => {
    if (!adminMsg.trim() || !activeHost) {
      toast({ variant: "destructive", title: "Error", description: "Target required." });
      return;
    }
    
    try {
      await addDoc(collection(firestore, 'adminMessages'), {
        hostId: activeHost.id,
        content: adminMsg,
        timestamp: serverTimestamp(),
        sender: 'System-Overseer'
      });
      setAdminMsg("");
      toast({ title: "Directive Sent", description: "Message delivered to host node." });
    } catch (e) {
      toast({ variant: "destructive", title: "Failure", description: "Node disconnection." });
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-lg mx-auto border-x border-white/10 bg-slate-950 text-white pb-20">
      <header className="flex items-center justify-between px-6 pt-10 pb-4 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22D3EE]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">AI Sentinel</span>
          </div>
          <h1 className="text-xl font-black tracking-tight font-headline">COMMAND CENTER</h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-red-500/20 text-red-500 border-none text-[8px] font-black uppercase tracking-widest px-3">Overseer active</Badge>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 space-y-6 pb-24 no-scrollbar">
        <section className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Monitor className="size-4 text-cyan-400" /> Active Grid Nodes
            </h2>
            <Badge variant="outline" className="text-[8px] uppercase">{activeStreams?.length || 0} Online</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
             {activeStreams?.map(stream => (
               <div 
                key={stream.id} 
                onClick={() => setSelectedStreamId(stream.id)}
                className={cn(
                  "relative aspect-square rounded-3xl overflow-hidden border cursor-pointer transition-all",
                  selectedStreamId === stream.id ? "border-cyan-400 scale-[0.98] shadow-lg shadow-cyan-400/20" : "border-white/5 opacity-60 hover:opacity-100"
                )}
               >
                 <Image 
                   src={stream.previewImageUrl || "https://picsum.photos/seed/admin/400/400"} 
                   alt="Feed" 
                   fill 
                   className={cn("object-cover", stream.manualBlur && "blur-xl")} 
                 />
                 <div className="absolute inset-0 bg-black/40" />
                 
                 {/* Violation Flag */}
                 {(stream.reportsCount || 0) > 0 && (
                   <div className="absolute top-2 left-2 bg-red-500 rounded-full p-1 animate-pulse">
                     <AlertTriangle className="size-3 text-white" />
                   </div>
                 )}

                 <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                    <span className="text-[8px] font-black uppercase tracking-tighter truncate max-w-[50%]">{stream.username || stream.id.slice(0,4)}</span>
                    <Badge className={cn("text-[6px] h-3 px-1 border-none font-black uppercase", stream.streamType === 'public' ? "bg-green-500" : "bg-primary")}>
                      {stream.streamType || 'PUB'}
                    </Badge>
                 </div>
               </div>
             ))}
          </div>
        </section>

        {activeHost && (
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-slate-900/80 border border-white/10 rounded-[2.5rem] p-5 space-y-4">
               <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-black uppercase italic tracking-tighter">Target: @{activeHost.username || activeHost.id.slice(0,6)}</h3>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-[6px] h-3 px-1 border-white/20 uppercase font-black">{activeHost.streamType || 'Public'}</Badge>
                      {activeHost.manualBlur && <Badge className="text-[6px] h-3 px-1 bg-amber-500 border-none uppercase font-black">Manual Blur ON</Badge>}
                    </div>
                  </div>
                  <Button 
                    onClick={() => terminateStream(activeHost.id)}
                    variant="destructive" 
                    size="sm" 
                    className="rounded-full gap-2 text-[10px] font-black uppercase h-8 px-4"
                  >
                    <PowerOff className="size-3" /> Sever Signal
                  </Button>
               </div>
               
               <div className="flex gap-3">
                  <Input 
                    value={adminMsg}
                    onChange={(e) => setAdminMsg(e.target.value)}
                    placeholder="Direct directive..." 
                    className="bg-black/50 border-white/10 text-xs h-12 rounded-2xl focus-visible:ring-primary uppercase font-bold tracking-widest"
                  />
                  <Button onClick={sendAdminMessage} size="icon" className="bg-primary rounded-2xl size-12 shrink-0">
                    <Send className="size-5" />
                  </Button>
               </div>
            </div>
          </section>
        )}

        <section className="pb-10">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">AI Sentinel Logs</h2>
            <ShieldAlert className="size-4 text-red-500" />
          </div>
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex flex-col items-center py-10 opacity-30 animate-pulse">
                 <Wifi className="size-8" />
              </div>
            ) : reports.map((report, idx) => (
              <div key={idx} className="p-5 rounded-[2rem] bg-white/5 border border-white/5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-black text-xs uppercase tracking-tight italic">{report.reportType}</h3>
                  <Badge variant="secondary" className={cn(
                    "text-[8px] uppercase font-black px-3 py-1 tracking-widest",
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

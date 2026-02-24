
'use client';

import { useState, useEffect } from "react";
import { 
  Monitor, ShieldAlert, Send, PowerOff, AlertTriangle, 
  Search, Grid, LayoutGrid, ShieldCheck, Activity, Users,
  Ban, ShieldX, Ghost, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { adminAIErrorReports, type AdminAIErrorReportsOutput } from "@/ai/flows/admin-ai-error-reports";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, doc, setDoc, where, updateDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export default function AdminControlRoom() {
  const [reports, setReports] = useState<AdminAIErrorReportsOutput["autoReports"]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [adminMsg, setAdminMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const activeStreamsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'hosts'), 
      where('isLive', '==', true), 
      orderBy('updatedAt', 'desc')
    );
  }, [firestore]);

  const { data: activeStreams } = useCollection(activeStreamsQuery);
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  
  const activeHost = activeStreams?.find(h => h.id === selectedStreamId);

  useEffect(() => {
    async function fetchReports() {
      setIsLoading(true);
      try {
        const res = await adminAIErrorReports({
          systemLogs: "Admin Node Active. Ghost Mode Monitoring Enabled.",
          hostVerificationIssues: ["Node #441: Low light warning", "Node #102: Background noise detected"]
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

  const banHost = async (hostId: string) => {
    if (!firestore) return;
    try {
      // One-Click Ban Logic
      await updateDoc(doc(firestore, 'hosts', hostId), { 
        isLive: false, 
        isBanned: true,
        bannedAt: serverTimestamp(),
        banReason: "Admin Override: Policy Violation"
      });
      
      await addDoc(collection(firestore, 'adminMessages'), {
        hostId,
        content: "CRITICAL: Your account has been BANNED for policy violations. Connection severed.",
        timestamp: serverTimestamp(),
        sender: 'AI-Sentinel'
      });
      
      toast({ 
        variant: "destructive", 
        title: "NODE EXTERMINATED", 
        description: "Host has been banned and disconnected permanently." 
      });
      setSelectedStreamId(null);
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

  const filteredStreams = activeStreams?.filter(s => 
    s.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-lg mx-auto border-x border-white/10 bg-slate-950 text-white pb-20 screen-guard-active">
      <header className="flex flex-col px-6 pt-10 pb-6 bg-slate-950/80 backdrop-blur-md border-b border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#EF4444]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-red-500 italic">Sentinel Overseer</span>
            </div>
            <h1 className="text-2xl font-black tracking-tighter font-headline italic uppercase">Live Monitor</h1>
          </div>
          <div className="flex items-center gap-3">
             <Badge className="bg-white/10 text-white border-none text-[8px] font-black uppercase tracking-widest px-3">
               {activeStreams?.length || 0} Nodes
             </Badge>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Global IDs..." 
            className="bg-black/50 border-white/5 rounded-2xl pl-10 h-10 text-[10px] font-black uppercase tracking-widest"
          />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 space-y-8 pb-24 no-scrollbar pt-6">
        {/* Live Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
              <LayoutGrid className="size-4" /> Multi-Stream Grid
            </h2>
            <div className="flex gap-2">
              <Ghost className="size-4 text-primary animate-pulse" />
              <span className="text-[8px] font-black uppercase text-primary">Ghost Mode Active</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             {filteredStreams?.map(stream => (
               <div 
                key={stream.id} 
                onClick={() => setSelectedStreamId(stream.id)}
                className={cn(
                  "relative aspect-[9/12] rounded-[2rem] overflow-hidden border cursor-pointer transition-all group",
                  selectedStreamId === stream.id ? "border-primary ring-2 ring-primary/20 scale-[0.98]" : "border-white/5 bg-slate-900"
                )}
               >
                 <Image 
                   src={stream.previewImageUrl || "https://picsum.photos/seed/admin/400/600"} 
                   alt="Feed" 
                   fill 
                   className={cn("object-cover transition-transform duration-700 group-hover:scale-110", stream.streamType === 'private' && "blur-xl opacity-60")} 
                 />
                 
                 {/* Ghost Overlay for Private */}
                 {stream.streamType === 'private' && (
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                     <Ghost className="size-10 text-white/20" />
                   </div>
                 )}

                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                 
                 {/* Badges */}
                 <div className="absolute top-3 left-3 flex flex-col gap-1">
                    <Badge className={cn("text-[6px] h-3 px-1 border-none font-black uppercase", stream.streamType === 'public' ? "bg-green-500" : "bg-red-600")}>
                      {stream.streamType || 'PUB'}
                    </Badge>
                    {(stream.reportsCount || 0) > 0 && (
                      <Badge className="bg-red-500 animate-pulse text-[6px] h-3 px-1 border-none font-black uppercase">
                        {stream.reportsCount} Reports
                      </Badge>
                    )}
                 </div>

                 <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-1">
                    <span className="text-[9px] font-black uppercase tracking-tight truncate italic">@{stream.username || stream.id.slice(0,6)}</span>
                    <div className="flex items-center gap-1 opacity-60">
                      <Eye className="size-2" />
                      <span className="text-[7px] font-black uppercase">{stream.viewers || 0}</span>
                    </div>
                    
                    {/* Hover Ban Button */}
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        banHost(stream.id);
                      }}
                      className="mt-2 h-7 rounded-xl bg-red-600 hover:bg-red-700 text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Ban Now
                    </Button>
                 </div>
               </div>
             ))}
          </div>
        </section>

        {activeHost && (
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="bg-[#1e111e]/80 border border-primary/20 rounded-[3rem] p-6 space-y-6 shadow-2xl romantic-card-glow">
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="size-14 rounded-2xl overflow-hidden border-2 border-primary relative">
                      <Image src={activeHost.previewImageUrl || "https://picsum.photos/seed/admin/200/200"} alt="Target" fill className="object-cover" />
                    </div>
                    <div>
                      <h3 className="text-base font-black uppercase italic tracking-tighter">Target: @{activeHost.username || activeHost.id.slice(0,6)}</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-[7px] h-4 px-2 border-white/20 uppercase font-black">{activeHost.streamType || 'Public'}</Badge>
                        <Badge className="text-[7px] h-4 px-2 bg-blue-500 border-none uppercase font-black">Admin Mute ON</Badge>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={() => banHost(activeHost.id)}
                    variant="destructive" 
                    size="sm" 
                    className="rounded-2xl gap-2 text-[9px] font-black uppercase h-10 px-5 shadow-lg shadow-red-500/20"
                  >
                    <Ban className="size-3" /> Terminate Node
                  </Button>
               </div>
               
               <div className="flex gap-3">
                  <Input 
                    value={adminMsg}
                    onChange={(e) => setAdminMsg(e.target.value)}
                    placeholder="Direct directive..." 
                    className="bg-black/50 border-white/5 text-[10px] h-14 rounded-2xl focus-visible:ring-primary uppercase font-black tracking-widest"
                  />
                  <Button onClick={sendAdminMessage} size="icon" className="romantic-gradient rounded-2xl size-14 shrink-0 shadow-xl border-none">
                    <Send className="size-6 text-white" />
                  </Button>
               </div>
            </div>
          </section>
        )}

        {/* Sentinel Logs */}
        <section className="pb-10">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sentinel Event Logs</h2>
            <ShieldAlert className="size-4 text-primary" />
          </div>
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex flex-col items-center py-10 opacity-10 animate-pulse">
                 <Activity className="size-10" />
              </div>
            ) : reports.map((report, idx) => (
              <div key={idx} className="p-5 rounded-[2.5rem] bg-white/5 border border-white/5 group hover:border-primary/20 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-black text-[10px] uppercase tracking-tight italic text-slate-300">{report.reportType}</h3>
                  <Badge variant="secondary" className={cn(
                    "text-[7px] uppercase font-black px-3 py-1 tracking-widest",
                    report.severity === 'Critical' ? "bg-red-500/20 text-red-500" : "bg-primary/20 text-primary"
                  )}>
                    {report.severity}
                  </severity>
                </div>
                <p className="text-[9px] text-slate-500 font-bold leading-relaxed uppercase tracking-tighter">{report.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

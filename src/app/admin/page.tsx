'use client';

import { useState, useEffect } from "react";
import { 
  Monitor, ShieldAlert, Send, PowerOff, AlertTriangle, 
  Search, Grid, LayoutGrid, ShieldCheck, Activity, Users,
  Ban, ShieldX, Ghost, Eye, Loader2
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
import Link from "next/link";

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
        console.error("AI Reports fetch error:", e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReports();
  }, []);

  const banHost = async (hostId: string) => {
    if (!firestore) return;
    try {
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
        title: "NODE TERMINATED", 
        description: "Host banned and disconnected." 
      });
      setSelectedStreamId(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Ban Failed" });
    }
  };

  const sendAdminMessage = async () => {
    if (!adminMsg.trim() || !activeHost) {
      toast({ variant: "destructive", title: "Error", description: "Select host and enter message." });
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
      toast({ title: "Message Sent", description: "Directive delivered." });
    } catch (e) {
      toast({ variant: "destructive", title: "Send Failed" });
    }
  };

  const filteredStreams = activeStreams?.filter(s => 
    s.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-lg mx-auto border-x border-white/10 bg-slate-950 text-white pb-20 screen-guard-active">
      <header className="flex flex-col px-6 pt-10 pb-6 bg-slate-950/80 backdrop-blur-md border-b border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 romantic-glow">
                <ShieldCheck className="size-6 text-primary" />
             </div>
             <div>
                <h1 className="text-xl font-black uppercase italic tracking-tighter">Sentinel Command</h1>
                <p className="text-[8px] font-black text-primary uppercase tracking-[0.3em] animate-pulse">Global Security Active</p>
             </div>
          </div>
          <Link href="/admin/payouts">
            <Button size="sm" variant="outline" className="rounded-full text-[9px] font-black uppercase border-white/10 gap-2 h-9">
              <Activity className="size-3 text-green-500" /> Payout Queue
            </Button>
          </Link>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white/5 border-none rounded-2xl h-12 pl-12 text-xs font-bold" 
            placeholder="Search active nodes..." 
          />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 space-y-8 pb-24 no-scrollbar pt-6">
        <section className="grid grid-cols-4 gap-3">
          {filteredStreams.map((stream) => (
            <button 
              key={stream.id}
              onClick={() => setSelectedStreamId(stream.id)}
              className={cn(
                "relative aspect-square rounded-2xl overflow-hidden border-2 transition-all",
                selectedStreamId === stream.id ? "border-primary scale-105 shadow-xl" : "border-white/5 opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
              )}
            >
              <Image src={stream.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${stream.id}`} alt="Node" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-1.5">
                <span className="text-[6px] font-black uppercase truncate text-white">@{stream.username}</span>
              </div>
            </button>
          ))}
          {filteredStreams.length === 0 && (
            <div className="col-span-4 p-12 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
               <Ghost className="size-10 text-slate-800 mx-auto mb-3" />
               <p className="text-[10px] font-black uppercase text-slate-500">No active signals found</p>
            </div>
          )}
        </section>

        {activeHost && (
          <section className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-6 space-y-6 animate-in slide-in-from-bottom-5">
             <div className="flex items-center gap-4">
                <div className="relative size-16 rounded-[1.5rem] overflow-hidden border-2 border-primary/30">
                   <Image src={activeHost.previewImageUrl || ""} alt="Host" fill className="object-cover" />
                </div>
                <div className="flex-1">
                   <h2 className="text-lg font-black uppercase italic tracking-tighter">@{activeHost.username}</h2>
                   <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase">Active Signal</Badge>
                      <Badge variant="outline" className="text-[8px] font-black uppercase border-white/10">{activeHost.viewers || 0} Watchers</Badge>
                   </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedStreamId(null)}><PowerOff className="size-5" /></Button>
             </div>

             <div className="space-y-3">
                <div className="bg-black/50 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <ShieldX className="size-5 text-red-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Policy Override</span>
                   </div>
                   <Button onClick={() => banHost(activeHost.id)} variant="destructive" size="sm" className="rounded-full h-8 px-5 text-[9px] font-black uppercase">Terminate Node</Button>
                </div>

                <div className="bg-black/50 rounded-2xl p-2 border border-white/5 flex gap-2">
                   <Input 
                    value={adminMsg}
                    onChange={(e) => setAdminMsg(e.target.value)}
                    className="bg-transparent border-none text-[10px] font-bold" 
                    placeholder="Send administrative directive..." 
                   />
                   <Button onClick={sendAdminMessage} className="rounded-xl h-10 w-10 bg-primary"><Send className="size-4" /></Button>
                </div>
             </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
             <AlertTriangle className="size-4 text-amber-500" /> AI Sentinel Log
          </h2>
          <div className="space-y-3">
             {isLoading ? (
               <div className="flex justify-center py-10 opacity-20"><Loader2 className="animate-spin size-8" /></div>
             ) : reports.map((report, idx) => (
               <div key={idx} className="bg-slate-900 border border-white/5 rounded-3xl p-5 group transition-all hover:border-primary/30">
                  <div className="flex justify-between items-start mb-2">
                     <h3 className="text-[11px] font-black uppercase italic text-white tracking-tight">{report.reportType}</h3>
                     <Badge className={cn(
                       "text-[8px] font-black uppercase border-none",
                       report.severity === 'Critical' ? "bg-red-500 text-white" : "bg-amber-500 text-black"
                     )}>{report.severity}</Badge>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{report.description}</p>
               </div>
             ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
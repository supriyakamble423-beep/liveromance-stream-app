
'use client';

import { useState } from "react";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { 
  ChevronLeft, Banknote, CheckCircle2, Copy, 
  ExternalLink, Loader2, AlertCircle, ShieldCheck 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/BottomNav";

export default function AdminPayouts() {
  const { firestore, areServicesAvailable } = useFirebase();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingRequestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'payoutRequests'),
      where('status', '==', 'pending'),
      orderBy('requestedAt', 'asc')
    );
  }, [firestore]);

  const { data: requests, isLoading } = useCollection(pendingRequestsQuery);

  const handleMarkAsPaid = async (requestId: string) => {
    if (!firestore) return;
    setProcessingId(requestId);
    try {
      await updateDoc(doc(firestore, 'payoutRequests', requestId), {
        status: 'paid',
        paidAt: serverTimestamp()
      });
      toast({ title: "Status Updated", description: "Payout marked as paid successfully." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
    } finally {
      setProcessingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Detail copied to clipboard." });
  };

  if (!areServicesAvailable) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-32 max-w-lg mx-auto border-x border-white/10 screen-guard-active">
      <header className="p-8 pt-16 bg-slate-900/50 border-b border-white/5 rounded-b-[3rem]">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="rounded-full bg-white/5">
              <ChevronLeft className="size-6" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Sentinel Finance</span>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter">Payout Approvals</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-primary/10 p-5 rounded-2xl border border-primary/20">
          <div className="size-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <Banknote className="size-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-black uppercase text-white">Pending Payout Vol.</p>
            <p className="text-xl font-black text-primary">₹{requests?.reduce((acc, r) => acc + (r.amountCash || 0), 0).toFixed(2)}</p>
          </div>
        </div>
      </header>

      <main className="px-6 pt-8 space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Active Queue</h2>
          <Badge variant="outline" className="text-[8px] font-black uppercase border-white/10">
            {requests?.length || 0} Pending
          </Badge>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-20 opacity-20"><Loader2 className="animate-spin size-10" /></div>
          ) : requests?.length === 0 ? (
            <div className="p-16 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
              <CheckCircle2 className="size-12 text-slate-700 mx-auto mb-4" />
              <p className="text-[10px] font-black uppercase text-slate-500">Queue is Clear</p>
            </div>
          ) : requests?.map((req) => (
            <div key={req.id} className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-6 space-y-5 shadow-xl transition-all hover:border-primary/30">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center font-black italic text-lg border border-white/10">
                    {req.hostName?.charAt(0) || 'H'}
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase italic text-white">@{req.hostName}</h3>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Host ID: {req.hostId.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-green-400 italic tracking-tighter">₹{req.amountCash}</p>
                  <p className="text-[8px] font-black text-slate-500 uppercase">{req.amountDiamonds} 💎</p>
                </div>
              </div>

              <div className="bg-black/50 p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase text-slate-500">UPI ID</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-primary truncate max-w-[150px]">{req.paymentDetails?.upiId}</span>
                    <button onClick={() => copyToClipboard(req.paymentDetails?.upiId)} className="text-slate-500 hover:text-white"><Copy className="size-3" /></button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => handleMarkAsPaid(req.id)}
                  disabled={processingId === req.id}
                  className="flex-1 h-12 rounded-xl bg-green-600 hover:bg-green-700 text-[10px] font-black uppercase tracking-widest gap-2"
                >
                  {processingId === req.id ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  Mark as Paid
                </Button>
                <Button variant="outline" className="h-12 w-12 rounded-xl border-white/10 hover:bg-white/5">
                  <ExternalLink className="size-4 text-slate-400" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <section className="bg-slate-900/50 p-6 rounded-[2rem] border border-white/5 flex items-start gap-4 mt-8">
          <ShieldCheck className="size-6 text-primary shrink-0" />
          <div>
            <p className="text-[10px] font-black uppercase text-white mb-1 tracking-widest">Audit Policy (80% Platform Commission)</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">
              Rate is fixed at ₹20 per 1000 Diamonds. Ensure manual transfer is completed before clicking 'Mark as Paid'.
            </p>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

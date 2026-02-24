
'use client';

import { useState, useEffect } from "react";
import { useFirebase, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, setDoc, addDoc, collection, serverTimestamp, query, where, orderBy } from "firebase/firestore";
import { 
  ChevronLeft, Wallet, CreditCard, Send, History, 
  CheckCircle2, AlertCircle, Loader2, Sparkles 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";

export default function PayoutDashboard() {
  const { firestore, user, areServicesAvailable, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const userId = user?.uid || 'simulate_host';

  const [upiId, setUpiId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hostRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'hosts', userId);
  }, [firestore, userId]);

  const { data: hostProfile, isLoading: isProfileLoading } = useDoc(hostRef);

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(
      collection(firestore, 'payoutRequests'),
      where('hostId', '==', userId),
      orderBy('requestedAt', 'desc')
    );
  }, [firestore, userId]);

  const { data: requests, isLoading: isRequestsLoading } = useCollection(requestsQuery);

  /** 
   * PROFIT MODEL: 80% Platform Fee
   * Conversion: 1000 Diamonds -> ₹20 Cash.
   * Rate: 0.02 INR per Diamond.
   */
  const DIAMOND_RATE = 0.02; 
  const MIN_PAYOUT_INR = 500;
  
  // Use profile data or simulated data if Firebase is missing
  const currentEarnings = hostProfile?.earnings || 4500; 
  const cashValue = (currentEarnings * DIAMOND_RATE).toFixed(2);

  const handleWithdraw = async () => {
    if (!areServicesAvailable) {
      toast({ title: "Simulation Mode", description: "Withdrawal request simulated successfully!" });
      return;
    }

    if (!userId || !hostProfile) return;
    
    if (parseFloat(cashValue) < MIN_PAYOUT_INR) {
      toast({ 
        variant: "destructive", 
        title: "Minimum Not Met", 
        description: `You need at least ₹${MIN_PAYOUT_INR} to withdraw.` 
      });
      return;
    }

    if (!upiId && !hostProfile.paymentDetails?.upiId) {
      toast({ variant: "destructive", title: "Missing Details", description: "Please enter your UPI ID." });
      return;
    }

    setIsSubmitting(true);
    try {
      await setDoc(hostRef!, {
        paymentDetails: {
          upiId: upiId || hostProfile.paymentDetails?.upiId,
          updatedAt: serverTimestamp()
        }
      }, { merge: true });

      await addDoc(collection(firestore!, 'payoutRequests'), {
        hostId: userId,
        hostName: hostProfile.username || 'Anonymous Host',
        amountDiamonds: currentEarnings,
        amountCash: parseFloat(cashValue),
        status: 'pending',
        paymentDetails: { upiId: upiId || hostProfile.paymentDetails?.upiId },
        requestedAt: serverTimestamp()
      });

      toast({ title: "Request Sent!", description: "Admin will process your payment within 24-48h." });
      setUpiId("");
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to process request." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white pb-32 max-w-lg mx-auto border-x border-white/5 mesh-gradient">
      {!areServicesAvailable && (
        <div className="mx-8 mt-16 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
           <AlertCircle className="size-6 text-red-500 shrink-0" />
           <p className="text-[10px] font-black uppercase text-red-200">Simulation Active. Financial data mocked.</p>
        </div>
      )}

      <header className="p-8 pt-16 bg-[#E11D48]/10 rounded-b-[4rem] border-b border-white/5">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/host-p">
            <Button variant="ghost" size="icon" className="rounded-full bg-white/5">
              <ChevronLeft className="size-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter">Earnings Hub</h1>
        </div>

        <div className="bg-[#3D263D]/80 p-8 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden romantic-glow">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Wallet className="size-24" />
          </div>
          <div className="relative z-10 space-y-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Total Diamonds</p>
              <div className="flex items-center gap-3">
                <span className="text-5xl font-black italic tracking-tighter">💎 {currentEarnings}</span>
                <Sparkles className="size-6 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Net Cash Value</p>
                <p className="text-3xl font-black text-green-400 tracking-tighter">₹{cashValue}</p>
              </div>
              <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase px-3 py-1">
                Rate: 1000💎 = ₹20
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="px-8 pt-10 space-y-10">
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <CreditCard className="size-4 text-primary" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Payout Details</h2>
          </div>
          
          <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 space-y-4">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase text-slate-500 ml-2">UPI ID</p>
              <Input 
                value={upiId || hostProfile?.paymentDetails?.upiId || ""}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. host@upi" 
                className="bg-black/40 border-white/10 rounded-2xl h-14 font-black text-sm px-6"
              />
            </div>
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-3">
              <AlertCircle className="size-4 text-primary shrink-0" />
              <p className="text-[9px] font-bold text-slate-400 leading-relaxed">
                Min. Withdrawal: <span className="text-white">₹{MIN_PAYOUT_INR}</span>. 
                Values shown are after 80% platform commission.
              </p>
            </div>
            <Button 
              onClick={handleWithdraw}
              disabled={isSubmitting || (parseFloat(cashValue) < MIN_PAYOUT_INR && areServicesAvailable)}
              className="w-full h-16 rounded-2xl romantic-gradient font-black uppercase tracking-widest text-white shadow-xl gap-3"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Send className="size-5" />}
              Request Withdrawal
            </Button>
          </div>
        </section>

        <section className="space-y-6 pb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="size-4 text-primary" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Request History</h2>
            </div>
            <Badge variant="outline" className="text-[8px] border-white/10 uppercase font-black">
              {requests?.length || 0} Records
            </Badge>
          </div>

          <div className="space-y-3">
            {isRequestsLoading ? (
              <div className="flex justify-center py-10 opacity-20"><Loader2 className="animate-spin" /></div>
            ) : (!requests || requests?.length === 0) ? (
              <div className="p-10 text-center border border-dashed border-white/10 rounded-[2rem]">
                <p className="text-[10px] font-black text-slate-500 uppercase">No payout requests yet.</p>
              </div>
            ) : requests?.map((req) => (
              <div key={req.id} className="p-5 rounded-[2rem] bg-white/5 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "size-10 rounded-xl flex items-center justify-center",
                    req.status === 'paid' ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
                  )}>
                    {req.status === 'paid' ? <CheckCircle2 className="size-5" /> : <Loader2 className="size-5 animate-spin" />}
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-tight text-white">₹{req.amountCash}</p>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                      {req.requestedAt ? new Date(req.requestedAt?.toDate()).toLocaleDateString() : 'Simulated'}
                    </p>
                  </div>
                </div>
                <Badge className={cn(
                  "text-[8px] font-black uppercase px-3 border-none",
                  req.status === 'paid' ? "bg-green-500 text-white" : "bg-amber-500 text-black"
                )}>
                  {req.status}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

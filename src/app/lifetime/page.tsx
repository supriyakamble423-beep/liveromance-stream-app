
'use client';

import { BottomNav } from "@/components/BottomNav";
import { 
  ArrowLeft, Sparkles, Copy, 
  TrendingUp, Users, Wallet, Trophy, 
  QrCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function LifetimeReferral() {
  const { toast } = useToast();
  const referralLink = "stream.ai/ref/host_prod_1";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Link Copied!", description: "Share this link with potential hosts." });
  };

  return (
    <div className="relative flex h-screen w-full max-w-lg flex-col bg-background overflow-x-hidden border-x border-border mx-auto">
      <header className="flex items-center p-4 justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border">
        <Link href="/host-p">
          <Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="size-5" /></Button>
        </Link>
        <h2 className="text-lg font-bold font-headline tracking-tight">Referral Program</h2>
        <div className="size-8" />
      </header>

      <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        <div className="px-6 pt-10 pb-6 text-center">
          <Badge variant="secondary" className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4 text-primary gap-1">
            <Sparkles className="size-3" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Lifetime Earnings</span>
          </Badge>
          <h1 className="text-4xl font-extrabold leading-tight mb-3 font-headline">
            Earn <span className="text-primary">1% Daily</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-[280px] mx-auto">
            Refer hosts and get 1% of their coin earnings for life.
          </p>
        </div>

        <div className="px-6 mb-8">
          <div className="glass-effect rounded-3xl p-6 border-primary/20 bg-primary/5 shadow-xl">
            <p className="text-sm font-bold mb-4">Your Referral ID</p>
            <div className="flex items-stretch gap-2">
              <div className="flex flex-1 items-center bg-muted/50 border border-border rounded-2xl px-4 py-3">
                <span className="text-muted-foreground text-sm truncate font-mono">{referralLink}</span>
              </div>
              <Button onClick={copyToClipboard} className="bg-primary hover:bg-primary/90 rounded-2xl size-12 shadow-lg shadow-primary/25">
                <Copy className="size-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="px-6 mb-10 flex flex-col items-center">
          <div className="p-5 bg-white rounded-3xl shadow-2xl border border-slate-100">
            <QrCode className="size-32 text-slate-800" />
          </div>
          <p className="mt-4 text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em]">Scan to Join</p>
        </div>

        <div className="px-6 mb-8 space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2 font-headline">
            <TrendingUp className="text-primary size-5" /> Commission Tracker
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 border border-border rounded-3xl p-5">
              <p className="text-muted-foreground text-[10px] font-bold uppercase mb-1">Lifetime</p>
              <div className="flex items-center gap-1.5">
                <Wallet className="text-accent size-5" />
                <span className="text-2xl font-bold">12k</span>
              </div>
            </div>
            <div className="bg-muted/30 border border-border rounded-3xl p-5">
              <p className="text-muted-foreground text-[10px] font-bold uppercase mb-1">Hosts</p>
              <div className="flex items-center gap-1.5">
                <Users className="size-5 text-primary" />
                <span className="text-2xl font-bold">24</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

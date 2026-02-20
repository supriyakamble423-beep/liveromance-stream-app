"use client"

import { BottomNav } from "@/components/BottomNav";
import { 
  ArrowLeft, Info, Sparkles, Copy, 
  TrendingUp, Users, Wallet, Trophy, 
  UserPlus, UserMinus, QrCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function ReferralPage() {
  const { toast } = useToast();
  const referralLink = "stream.ai/ref/host_9421";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Link Copied!", description: "Referral link copied to clipboard." });
  };

  return (
    <div className="relative flex h-screen w-full max-w-lg flex-col bg-background overflow-x-hidden border-x border-border mx-auto">
      {/* Header */}
      <div className="flex items-center p-4 justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <h2 className="text-lg font-bold font-headline tracking-tight flex-1 text-center">Referral Program</h2>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
          <Info className="size-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        {/* Hero */}
        <div className="px-6 pt-10 pb-6 text-center">
          <Badge variant="secondary" className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4 text-primary gap-1">
            <Sparkles className="size-3" />
            <span className="text-[10px] font-bold uppercase tracking-widest">AI-Powered Onboarding</span>
          </Badge>
          <h1 className="text-4xl font-extrabold leading-tight mb-3 font-headline">
            Earn <span className="text-primary">1% Lifetime</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-[280px] mx-auto">
            Get 1% of every coin earned by hosts you onboard, forever.
          </p>
        </div>

        {/* Referral Card */}
        <div className="px-6 mb-8">
          <div className="glass-effect rounded-3xl p-6 border-primary/20 bg-primary/5 shadow-xl">
            <p className="text-sm font-bold mb-4">Your Unique Link</p>
            <div className="flex items-stretch gap-2">
              <div className="flex flex-1 items-center bg-muted/50 border border-border rounded-2xl px-4 py-3">
                <span className="text-muted-foreground text-sm truncate">{referralLink}</span>
              </div>
              <Button 
                onClick={copyToClipboard}
                className="bg-primary hover:bg-primary/90 rounded-2xl size-12 shadow-lg shadow-primary/25"
              >
                <Copy className="size-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* QR Section */}
        <div className="px-6 mb-10 flex flex-col items-center">
          <div className="p-5 bg-white rounded-3xl shadow-2xl border border-slate-100">
            <div className="size-44 flex items-center justify-center bg-slate-50 rounded-2xl overflow-hidden relative border border-slate-200">
               <QrCode className="size-32 text-slate-800" />
            </div>
          </div>
          <p className="mt-4 text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em]">Scan to Onboard</p>
        </div>

        {/* Stats */}
        <div className="px-6 mb-8 space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2 font-headline">
            <TrendingUp className="text-primary size-5" /> Referral Tracker
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 border border-border rounded-3xl p-5">
              <p className="text-muted-foreground text-[10px] font-bold uppercase mb-1">Total Earned</p>
              <div className="flex items-center gap-1.5">
                <Wallet className="text-accent size-5" />
                <span className="text-2xl font-bold">12,450</span>
              </div>
              <p className="text-green-500 text-[10px] font-bold mt-2 flex items-center gap-0.5">
                <TrendingUp className="size-3" /> +12% this week
              </p>
            </div>
            <div className="bg-muted/30 border border-border rounded-3xl p-5">
              <p className="text-muted-foreground text-[10px] font-bold uppercase mb-1">Active Hosts</p>
              <div className="flex items-center gap-1.5">
                <Users className="text-primary size-5" />
                <span className="text-2xl font-bold">24</span>
              </div>
              <p className="text-muted-foreground text-[10px] font-medium mt-2">
                8 streaming now
              </p>
            </div>
          </div>
        </div>

        {/* Banner */}
        <div className="px-6">
          <div className="bg-primary/10 border border-primary/20 rounded-3xl p-5 flex items-start gap-4">
            <div className="bg-primary rounded-xl p-2.5 flex items-center justify-center shadow-lg shadow-primary/20">
              <Trophy className="text-white size-5" />
            </div>
            <div>
              <p className="text-sm font-bold">Become a Platinum Recruiter</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">Onboard 10 more active hosts to unlock 1.5% commission rate.</p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

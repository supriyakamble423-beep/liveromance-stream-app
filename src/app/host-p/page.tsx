
'use client';

import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { BottomNav } from "@/components/BottomNav";
import { User, ShieldCheck, Wallet, Settings, LayoutDashboard, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";

export default function HostProfileDashboard() {
  const { auth, firestore } = useFirebase();
  const userId = auth?.currentUser?.uid;

  const hostRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'hosts', userId);
  }, [firestore, userId]);

  const { data: hostProfile, isLoading } = useDoc(hostRef);

  return (
    <div className="min-h-screen bg-background pb-24 max-w-lg mx-auto border-x border-border">
      <header className="p-6 pt-12 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold font-headline">Host Hub</h1>
          <Button variant="ghost" size="icon"><Settings className="size-5" /></Button>
        </div>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="relative size-20 rounded-3xl overflow-hidden border-2 border-primary shadow-xl">
            <Image src={hostProfile?.previewImageUrl || "https://picsum.photos/seed/hostprofile/200/200"} alt="Profile" fill className="object-cover" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">Host_{userId?.slice(0, 4)}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={hostProfile?.verified ? "default" : "secondary"} className="h-5 text-[10px] gap-1">
                <ShieldCheck className="size-3" /> {hostProfile?.verified ? "Verified" : "Unverified"}
              </Badge>
              <Badge variant="secondary" className="h-5 text-[10px] bg-secondary/10 text-secondary border-none uppercase font-bold tracking-widest">
                Level 1
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/30 p-4 rounded-3xl border border-border">
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Total Earnings</p>
            <div className="flex items-center gap-2">
              <Wallet className="size-5 text-accent" />
              <span className="text-xl font-bold">1,240</span>
            </div>
          </div>
          <div className="bg-muted/30 p-4 rounded-3xl border border-border">
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Rating</p>
            <div className="flex items-center gap-2">
              <Star className="size-5 text-primary fill-current" />
              <span className="text-xl font-bold">{hostProfile?.rating || "N/A"}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-2">Management</h3>
        
        <div className="grid grid-cols-1 gap-3">
          <Link href="/host-f">
            <div className="bg-card p-4 rounded-2xl border border-border flex items-center justify-between hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><ShieldCheck className="size-6" /></div>
                <div>
                  <p className="font-bold text-sm">Identity Verification</p>
                  <p className="text-xs text-muted-foreground">Required to start streaming</p>
                </div>
              </div>
              <Badge className="bg-destructive/10 text-destructive">Action Required</Badge>
            </div>
          </Link>

          <div className="bg-card p-4 rounded-2xl border border-border flex items-center justify-between opacity-50">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary"><Radio className="size-6" /></div>
              <div>
                <p className="font-bold text-sm">Go Live</p>
                <p className="text-xs text-muted-foreground">Verified hosts only</p>
              </div>
            </div>
          </div>

          <Link href="/admin">
            <div className="bg-card p-4 rounded-2xl border border-border flex items-center justify-between hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500"><LayoutDashboard className="size-6" /></div>
                <div>
                  <p className="font-bold text-sm">Admin Dashboard</p>
                  <p className="text-xs text-muted-foreground">System health & reports</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

import { doc } from "firebase/firestore";

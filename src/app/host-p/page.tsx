
'use client';

import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { BottomNav } from "@/components/BottomNav";
import { User, ShieldCheck, Wallet, Settings, LayoutDashboard, Radio, Star, Lock, Globe, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function HostProfileDashboard() {
  const { auth, firestore } = useFirebase();
  const { toast } = useToast();
  const userId = auth?.currentUser?.uid;

  const hostRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'hosts', userId);
  }, [firestore, userId]);

  const { data: hostProfile, isLoading } = useDoc(hostRef);

  const updateStreamType = (type: 'public' | 'private' | 'invite-only') => {
    if (!hostRef) return;
    updateDoc(hostRef, { 
      streamType: type,
      updatedAt: serverTimestamp()
    }).then(() => {
      toast({ title: "Settings Updated", description: `Stream set to ${type} mode.` });
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24 max-w-lg mx-auto border-x border-border">
      <header className="p-6 pt-12 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold font-headline">Host Hub</h1>
          <Button variant="ghost" size="icon"><Settings className="size-5" /></Button>
        </div>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="relative size-20 rounded-3xl overflow-hidden border-2 border-primary shadow-xl bg-muted">
            <Image 
              src={hostProfile?.previewImageUrl || "https://picsum.photos/seed/hostprofile/200/200"} 
              alt="Profile" 
              fill 
              className="object-cover" 
            />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">Host_{userId?.slice(0, 4)}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={hostProfile?.verified ? "default" : "secondary"} className={cn("h-5 text-[10px] gap-1", hostProfile?.verified ? "bg-green-500" : "")}>
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
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Earnings</p>
            <div className="flex items-center gap-2">
              <Wallet className="size-5 text-accent" />
              <span className="text-xl font-bold">1.2k</span>
            </div>
          </div>
          <div className="bg-muted/30 p-4 rounded-3xl border border-border">
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Rating</p>
            <div className="flex items-center gap-2">
              <Star className="size-5 text-primary fill-current" />
              <span className="text-xl font-bold">{hostProfile?.rating || "5.0"}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-2">Stream Controls</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'public', icon: Globe, label: 'Public' },
              { id: 'private', icon: Lock, label: 'Private' },
              { id: 'invite-only', icon: Users, label: 'Invites' }
            ].map((type) => (
              <Button
                key={type.id}
                variant={hostProfile?.streamType === type.id ? 'default' : 'outline'}
                onClick={() => updateStreamType(type.id as any)}
                className="flex flex-col h-20 rounded-2xl gap-1 border-primary/20"
              >
                <type.icon className="size-5" />
                <span className="text-[10px] font-bold">{type.label}</span>
              </Button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-2">Management</h3>
          <div className="grid grid-cols-1 gap-3">
            {!hostProfile?.verified && (
              <Link href="/host-f">
                <div className="bg-card p-4 rounded-2xl border border-border flex items-center justify-between hover:bg-muted/30 transition-colors animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><ShieldCheck className="size-6" /></div>
                    <div>
                      <p className="font-bold text-sm">Identity Verification</p>
                      <p className="text-xs text-muted-foreground">Required to start streaming</p>
                    </div>
                  </div>
                  <Badge className="bg-destructive/10 text-destructive border-none">Action Required</Badge>
                </div>
              </Link>
            )}

            <div className={cn(
              "bg-card p-4 rounded-2xl border border-border flex items-center justify-between",
              !hostProfile?.verified && "opacity-50 grayscale"
            )}>
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary"><Radio className="size-6" /></div>
                <div>
                  <p className="font-bold text-sm">Start Live Session</p>
                  <p className="text-xs text-muted-foreground">{hostProfile?.verified ? "Reach 1.2k followers" : "Verified hosts only"}</p>
                </div>
              </div>
            </div>

            <Link href="/admin">
              <div className="bg-card p-4 rounded-2xl border border-border flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500"><LayoutDashboard className="size-6" /></div>
                  <div>
                    <p className="font-bold text-sm">AI Moderator Logs</p>
                    <p className="text-xs text-muted-foreground">System health & reports</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

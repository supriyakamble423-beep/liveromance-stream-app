'use client';

import { useFirebase, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { BottomNav } from "@/components/BottomNav";
import { User, ShieldCheck, Wallet, Settings, LayoutDashboard, Radio, Star, Lock, Globe, Users, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { doc, updateDoc, serverTimestamp, query, where, orderBy, limit, collection } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function HostProfileDashboard() {
  const { auth, firestore, user } = useFirebase();
  const { toast } = useToast();
  const userId = user?.uid;

  // 1. Host Profile Reference
  const hostRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'hosts', userId);
  }, [firestore, userId]);

  const { data: hostProfile, isLoading } = useDoc(hostRef);

  // 2. Filtered Query: Satisfies Security Rules by filtering by hostId
  const msgQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(
      collection(firestore, 'adminMessages'), 
      where('hostId', '==', userId), 
      orderBy('timestamp', 'desc'), 
      limit(1)
    );
  }, [firestore, userId]);

  const { data: adminMessages } = useCollection(msgQuery);
  const latestAdminMsg = adminMessages?.[0];

  const updateStreamType = (type: 'public' | 'private' | 'invite-only') => {
    if (!hostRef || !hostProfile?.verified) {
      toast({ variant: 'destructive', title: 'Action Denied', description: 'Please verify identity first.' });
      return;
    }
    updateDoc(hostRef, { 
      streamType: type,
      updatedAt: serverTimestamp()
    }).then(() => {
      toast({ title: "Settings Updated", description: `Stream set to ${type} mode.` });
    });
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24 max-w-lg mx-auto border-x border-white/10">
      <header className="p-6 pt-12 bg-gradient-to-b from-primary/20 to-transparent">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black tracking-tighter uppercase font-headline">Host Hub</h1>
          <Button variant="ghost" size="icon" className="text-white"><Settings className="size-5" /></Button>
        </div>
        
        {/* Admin Message Alert Section */}
        {latestAdminMsg && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 p-4 rounded-2xl animate-pulse">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="size-4 text-red-500" />
              <span className="text-[10px] font-black uppercase text-red-500 tracking-widest">Official Alert</span>
            </div>
            <p className="text-xs text-slate-300 font-medium italic">
              "{latestAdminMsg.content || latestAdminMsg.message}"
            </p>
          </div>
        )}

        <div className="flex items-center gap-4 mb-8">
          <div className="relative size-24 rounded-[2rem] overflow-hidden border-4 border-primary shadow-2xl bg-slate-900">
            <Image 
              src={hostProfile?.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`} 
              alt="Profile" 
              fill 
              className="object-cover" 
            />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black tracking-tight">Host_{userId?.slice(0, 4)}</h2>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={hostProfile?.verified ? "default" : "secondary"} className={cn("h-6 text-[10px] px-3 font-black tracking-widest", hostProfile?.verified ? "bg-green-500 text-white" : "bg-white/5 text-slate-500")}>
                <ShieldCheck className="size-3 mr-1" /> {hostProfile?.verified ? "VERIFIED" : "UNVERIFIED"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-5 rounded-[1.5rem] border border-white/5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Earnings</p>
            <div className="flex items-center gap-2">
              <Wallet className="size-5 text-accent" />
              <span className="text-2xl font-black">{hostProfile?.earnings || "0"}</span>
            </div>
          </div>
          <div className="bg-white/5 p-5 rounded-[1.5rem] border border-white/5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Rating</p>
            <div className="flex items-center gap-2">
              <Star className="size-5 text-primary fill-current" />
              <span className="text-2xl font-black">{hostProfile?.rating || "5.0"}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Stream Type Toggles */}
        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-2">Stream Type</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'public', icon: Globe, label: 'Public' },
              { id: 'private', icon: Lock, label: 'Private' },
              { id: 'invite-only', icon: Users, label: 'Invites' }
            ].map((type) => (
              <Button
                key={type.id}
                variant={hostProfile?.streamType === type.id ? 'default' : 'outline'}
                onClick={() => updateStreamType(type.id as any)}
                className={cn(
                  "flex flex-col h-24 rounded-[1.5rem] gap-2 transition-all active:scale-95",
                  hostProfile?.streamType === type.id ? "bg-primary border-none shadow-[0_0_15px_rgba(139,92,246,0.3)]" : "bg-white/5 border-white/10 hover:bg-white/10"
                )}
              >
                <type.icon className="size-6" />
                <span className="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
              </Button>
            ))}
          </div>
        </section>

        {/* Action Controls */}
        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-2">Controls</h3>
          <div className="grid grid-cols-1 gap-4">
            {!hostProfile?.verified && (
              <Link href="/host-f">
                <div className="bg-primary/10 p-5 rounded-[1.5rem] border border-primary/20 flex items-center justify-between hover:bg-primary/20 transition-all group animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary"><ShieldCheck className="size-7" /></div>
                    <div>
                      <p className="font-black text-sm uppercase tracking-tight text-white">Identity Verification</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Required to go live</p>
                    </div>
                  </div>
                  <Badge className="bg-primary text-white text-[9px] font-black px-4">START</Badge>
                </div>
              </Link>
            )}

            <div 
              onClick={() => hostProfile?.verified && window.location.assign(`/stream/${userId}`)}
              className={cn(
              "p-5 rounded-[1.5rem] border transition-all flex items-center justify-between",
              hostProfile?.verified 
                ? "bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer" 
                : "bg-white/5 border-white/5 opacity-40 grayscale pointer-events-none"
            )}>
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary"><Radio className="size-7" /></div>
                <div>
                  <p className="font-black text-sm uppercase tracking-tight">Go Live Session</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    {hostProfile?.verified ? "Ready to stream" : "Verify to unlock"}
                  </p>
                </div>
              </div>
              {hostProfile?.verified && <Badge className="bg-secondary text-white text-[9px] font-black">GO</Badge>}
            </div>

            <Link href="/admin">
              <div className="bg-white/5 p-5 rounded-[1.5rem] border border-white/10 flex items-center justify-between hover:bg-white/10 transition-all">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500"><LayoutDashboard className="size-7" /></div>
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">Admin GodMode</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">System Health</p>
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
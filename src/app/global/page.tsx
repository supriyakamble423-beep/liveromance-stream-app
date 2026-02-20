
'use client';

import { useState } from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, doc, getDoc } from 'firebase/firestore';
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MessageCircle, Zap, Users, Star, Lock, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function GlobalMarketplace() {
  const { firestore, auth } = useFirebase();
  const { toast } = useToast();

  // ONLY show verified hosts in the marketplace
  const liveHostsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'hosts'), 
      where('isLive', '==', true),
      where('verified', '==', true)
    );
  }, [firestore]);

  const { data: hosts, isLoading } = useCollection(liveHostsQuery);

  const zapConnect = async (hostId: string, streamType: string = 'public') => {
    if (!auth?.currentUser) {
      toast({ variant: "destructive", title: "Sign in required", description: "Please log in to send a Zap." });
      return;
    }

    if (streamType === 'private') {
      toast({ title: "Private Stream", description: "This host is currently in a private session. You have been added to the waiting room." });
    }

    try {
      await addDoc(collection(firestore, 'streamRequests'), {
        hostId,
        userId: auth.currentUser.uid,
        status: 'pending',
        requestType: 'zap',
        coins: 50,
        streamType,
        timestamp: serverTimestamp()
      });
      toast({ title: "🎉 Zap sent!", description: "Host has been notified!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not send Zap." });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 max-w-lg mx-auto border-x border-border">
      <Header />
      
      <main className="px-4 pt-6 space-y-6">
        <section className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold font-headline">Verified Hosts</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Safe & Secured Discovery</p>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
            {hosts?.length || 0} Online
          </Badge>
        </section>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground animate-pulse">Scanning global signals...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {hosts?.map((host) => (
              <div key={host.id} className="flex flex-col bg-card rounded-3xl overflow-hidden border border-border group transition-all hover:shadow-xl relative">
                <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                  <Image 
                    src={host.previewImageUrl || "https://picsum.photos/seed/host/600/800"} 
                    alt={host.id} 
                    fill 
                    className="object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <Badge className="bg-destructive border-none text-[9px] font-black uppercase tracking-tighter shadow-lg">Live</Badge>
                    <Badge className="bg-green-500 border-none text-[9px] font-bold gap-1 shadow-lg">
                      <ShieldCheck className="size-2.5" /> Verified
                    </Badge>
                  </div>
                  {host.streamType === 'private' && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                      <Lock className="size-10 text-white/50" />
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm truncate">Host_{host.id.slice(0, 4)}</h3>
                    <span className="text-xs opacity-60">🇺🇸</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => zapConnect(host.id, host.streamType)}
                      className="flex-1 bg-primary hover:bg-primary/90 rounded-xl h-9 text-xs font-bold gap-1 shadow-lg shadow-primary/20"
                    >
                      <Zap className="size-3 fill-current" /> {host.streamType === 'private' ? 'Wait' : 'Zap'}
                    </Button>
                    <Link href={`/stream/${host.id}`} className="flex-1">
                      <Button variant="outline" className="w-full rounded-xl h-9 text-xs font-bold gap-1 border-primary/20 hover:bg-primary/5 text-primary">
                        <MessageCircle className="size-3" /> Chat
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            {hosts?.length === 0 && (
              <div className="col-span-2 text-center py-20 text-muted-foreground bg-muted/30 rounded-3xl border border-dashed border-border flex flex-col items-center gap-3">
                <Users className="size-10 opacity-20" />
                <p>No verified hosts are live right now.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

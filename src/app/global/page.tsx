
'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useAuth, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MessageCircle, Zap, Users, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function GlobalMarketplace() {
  const { firestore, auth } = useFirebase();
  const { toast } = useToast();

  const liveHostsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'hosts'), where('isLive', '==', true));
  }, [firestore]);

  const { data: hosts, isLoading } = useCollection(liveHostsQuery);

  const zapConnect = async (hostId: string) => {
    if (!auth?.currentUser) {
      toast({ variant: "destructive", title: "Sign in required", description: "Please log in to send a Zap." });
      return;
    }

    try {
      await addDoc(collection(firestore, 'streamRequests'), {
        hostId,
        userId: auth.currentUser.uid,
        status: 'pending',
        requestType: 'zap',
        coins: 50,
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
          <h2 className="text-2xl font-bold font-headline">Live Now</h2>
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
              <div key={host.id} className="flex flex-col bg-card rounded-3xl overflow-hidden border border-border group transition-all hover:shadow-xl">
                <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                  <Image 
                    src={host.previewImageUrl || "https://picsum.photos/seed/host/600/800"} 
                    alt={host.id} 
                    fill 
                    className="object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className="bg-destructive border-none text-[9px] font-black uppercase tracking-tighter">Live</Badge>
                    <Badge variant="secondary" className="bg-black/40 backdrop-blur-md text-white border-none text-[9px]">
                      <Star className="size-2 fill-current mr-1" /> {host.rating || "5.0"}
                    </Badge>
                  </div>
                </div>
                <div className="p-3 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm truncate">Host_{host.id.slice(0, 4)}</h3>
                    <span className="text-xs opacity-60">🇺🇸</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => zapConnect(host.id)}
                      className="flex-1 bg-primary hover:bg-primary/90 rounded-xl h-9 text-xs font-bold gap-1 shadow-lg shadow-primary/20"
                    >
                      <Zap className="size-3 fill-current" /> Zap
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
              <div className="col-span-2 text-center py-20 text-muted-foreground bg-muted/30 rounded-3xl border border-dashed border-border">
                No hosts are currently live. Start your own!
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

import { useFirebase } from '@/firebase';

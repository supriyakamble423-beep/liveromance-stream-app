
'use client';

import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp, query, where, limit } from 'firebase/firestore';
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MessageCircle, Zap, Users, ShieldCheck, Lock, TrendingUp, Sparkles, RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from 'react';
import { MOCK_HOSTS } from '@/lib/mock-data';

export default function GlobalMarketplace() {
  const { firestore, auth } = useFirebase();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

  const liveHostsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'hosts'), 
      where('isLive', '==', true),
      limit(20)
    );
  }, [firestore]);

  const { data: hosts, isLoading } = useCollection(liveHostsQuery);

  const seedFakeLiveHosts = async () => {
    if (!firestore || isSeeding) return;
    setIsSeeding(true);
    try {
      for (const mock of MOCK_HOSTS) {
        const hostRef = doc(firestore, 'hosts', `fake_${mock.id}`);
        await setDoc(hostRef, {
          id: `fake_${mock.id}`,
          username: mock.name,
          isLive: true,
          verified: true,
          viewers: Math.floor(Math.random() * 5000),
          rating: mock.rating,
          streamType: Math.random() > 0.7 ? 'private' : 'public',
          previewImageUrl: mock.imageUrl,
          country: mock.country,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        }, { merge: true });
      }
      toast({ title: "Live Simulation Active", description: "Global nodes have been populated with live streams." });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Seed Failed", description: "Could not initiate live simulation." });
    } finally {
      setIsSeeding(false);
    }
  };

  const zapConnect = async (hostId: string, streamType: string) => {
    if (!auth?.currentUser) {
      toast({ variant: "destructive", title: "Sign in required", description: "Please log in to interact." });
      return;
    }

    try {
      const requestRef = doc(collection(firestore!, 'streamRequests'));
      await setDoc(requestRef, {
        hostId,
        userId: auth.currentUser.uid,
        status: 'pending',
        requestType: 'zap',
        coins: 50,
        streamType,
        timestamp: serverTimestamp()
      });
      toast({ title: "🎉 Zap Sent!", description: streamType === 'private' ? "Added to waiting room." : "Host has been notified!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not send Zap." });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 max-w-lg mx-auto border-x border-border">
      <Header />
      
      <main className="px-4 pt-6 space-y-6">
        {/* Marketplace Stats Banner */}
        <section className="bg-primary/5 border border-primary/10 rounded-[2rem] p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Global Health</p>
            <h2 className="text-xl font-black font-headline tracking-tighter uppercase">Market Activity</h2>
          </div>
          <div className="flex gap-4 text-right">
            <div>
              <p className="text-xs font-bold text-slate-400">Online</p>
              <p className="text-lg font-black">{hosts?.length || 0}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400">Zaps</p>
              <p className="text-lg font-black text-secondary">4.2k</p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black font-headline tracking-tight uppercase">Live Verified</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1">
              <ShieldCheck className="size-3 text-green-500" /> Real-time Global Traffic
            </p>
          </div>
          {hosts?.length === 0 && !isLoading && (
            <Button onClick={seedFakeLiveHosts} disabled={isSeeding} size="sm" variant="outline" className="rounded-full gap-2 text-[10px] font-black uppercase tracking-widest h-8 border-primary/20 text-primary">
              <RefreshCw className={cn("size-3", isSeeding && "animate-spin")} /> Simulate Live
            </Button>
          )}
        </section>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 opacity-50">
            <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest">Syncing World Nodes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {hosts?.map((host) => (
              <div key={host.id} className="flex flex-col bg-card rounded-[2.5rem] overflow-hidden border border-border group transition-all hover:shadow-2xl relative">
                <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                  <Image 
                    src={host.previewImageUrl || "https://picsum.photos/seed/host/600/800"} 
                    alt={host.id} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <Badge className="bg-destructive border-none text-[9px] font-black uppercase tracking-widest px-3">Live</Badge>
                  </div>
                  {host.streamType === 'private' && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[4px] flex flex-col items-center justify-center gap-2">
                      <Lock className="size-8 text-white/40" />
                      <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Private</p>
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-black text-sm tracking-tight truncate uppercase">{host.username || `Host_${host.id.slice(0, 4)}`}</h3>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="size-3 text-primary" />
                      <span className="text-[8px] font-bold text-slate-500 uppercase">{host.country || 'Global'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => zapConnect(host.id, host.streamType || 'public')}
                      className="flex-1 bg-primary hover:bg-primary/90 rounded-2xl h-10 text-[10px] font-black gap-1 uppercase tracking-widest shadow-lg shadow-primary/20"
                    >
                      <Zap className="size-3 fill-current" /> {host.streamType === 'private' ? 'Wait' : 'Zap'}
                    </Button>
                    <Link href={`/stream/${host.id}`} className="flex-1">
                      <Button variant="outline" className="w-full rounded-2xl h-10 text-[10px] font-black gap-1 border-primary/20 text-primary uppercase tracking-widest">
                        <MessageCircle className="size-3" /> Chat
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            {hosts?.length === 0 && (
              <div className="col-span-2 text-center py-20 bg-muted/20 rounded-[3rem] border-2 border-dashed border-border flex flex-col items-center gap-4">
                <Sparkles className="size-12 opacity-10 text-primary" />
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Market Currently Idle</p>
                  <p className="text-[10px] text-slate-400 uppercase">Click "Simulate Live" to populate global traffic</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

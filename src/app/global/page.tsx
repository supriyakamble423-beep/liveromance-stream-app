
'use client';

import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp, query, where, limit, addDoc } from 'firebase/firestore';
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MessageCircle, Zap, ShieldCheck, Lock, TrendingUp, RefreshCw, Sparkles, X, Heart, ShieldAlert } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from 'react';
import { MOCK_HOSTS } from '@/lib/mock-data';
import { cn } from "@/lib/utils";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import AdBanner from "@/components/Ads/AdBanner";

export default function GlobalMarketplace() {
  const { firestore, auth } = useFirebase();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const [showAIBot, setShowAIBot] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowAIBot(true), 1500);
    return () => clearTimeout(timer);
  }, []);

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
        setDoc(hostRef, {
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
        }, { merge: true }).catch(err => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: hostRef.path,
            operation: 'write',
            requestResourceData: mock
          }));
        });
      }
      toast({ title: "Live Simulation Active", description: "Global nodes have been populated." });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSeeding(false);
    }
  };

  const zapConnect = (hostId: string, streamType: string) => {
    if (!auth?.currentUser || !firestore) {
      toast({ variant: "destructive", title: "Sign in required", description: "Please log in to interact." });
      return;
    }

    const requestData = {
      hostId,
      userId: auth.currentUser.uid,
      status: 'pending',
      requestType: 'zap',
      coins: 50,
      streamType,
      timestamp: serverTimestamp()
    };

    const requestRef = collection(firestore, 'streamRequests');
    addDoc(requestRef, requestData)
      .then(() => {
        toast({ title: "🎉 Zap Sent!", description: streamType === 'private' ? "50 Coins deducted. Waiting for host." : "Host notified!" });
      })
      .catch((err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'streamRequests',
          operation: 'create',
          requestResourceData: requestData
        }));
      });
  };

  return (
    <div className="min-h-screen bg-background pb-24 max-w-lg mx-auto border-x border-border">
      <Header />
      
      <main className="px-4 pt-6 space-y-6">
        {showAIBot && (
          <div className="relative animate-in slide-in-from-right-10 duration-500 z-40">
            <div className="romantic-gradient p-5 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group romantic-glow border border-white/20">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck className="size-16" />
              </div>
              <button 
                onClick={() => setShowAIBot(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white"
              >
                <X className="size-4" />
              </button>
              <div className="flex items-center gap-3 mb-2">
                 <div className="size-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl shadow-inner">🤖</div>
                 <div className="flex flex-col">
                   <span className="text-[10px] font-black uppercase tracking-widest text-white/80 leading-none mb-1">Stream-X Agent</span>
                   <span className="text-xs font-black uppercase tracking-tight italic">Safety Overseer</span>
                 </div>
              </div>
              <p className="text-[11px] font-bold leading-relaxed mb-4 text-white/90">
                "Welcome! I monitor all Public streams 24/7. <span className="underline decoration-pink-300">Nudity is strictly banned here.</span> Use filters to find your perfect vibe!"
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" className="h-8 rounded-xl text-[10px] font-black uppercase tracking-tight bg-white text-primary hover:bg-slate-100 shadow-lg">
                  Explore Safe Nodes
                </Button>
                <Button size="sm" variant="outline" className="h-8 rounded-xl text-[10px] font-black uppercase tracking-tight border-white/30 text-white hover:bg-white/10">
                  Privacy Policy
                </Button>
              </div>
            </div>
          </div>
        )}

        <section className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-5 flex items-center justify-between romantic-card-glow group">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
              <ShieldCheck className="size-3" /> Global Safety Grid
            </p>
            <h2 className="text-xl font-black font-headline tracking-tighter uppercase italic group-hover:text-primary transition-colors">Market Activity</h2>
          </div>
          <div className="flex gap-4 text-right">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Live</p>
              <p className="text-lg font-black text-primary">{hosts?.length || 0}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Secure</p>
              <p className="text-lg font-black text-green-500">100%</p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-between px-1">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black font-headline tracking-tight uppercase italic text-primary">Live & Verified</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1">
              <Zap className="size-3 text-amber-500 fill-current" /> AI Scanned Every 10s
            </p>
          </div>
          {hosts?.length === 0 && !isLoading && (
            <Button onClick={seedFakeLiveHosts} disabled={isSeeding} size="sm" variant="outline" className="rounded-full gap-2 text-[10px] font-black uppercase tracking-widest h-8 border-primary/20 text-primary hover:bg-primary/5">
              <RefreshCw className={cn("size-3", isSeeding && "animate-spin")} /> Simulate Live
            </Button>
          )}
        </section>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 opacity-50">
            <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest">Connecting to AI Grid...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {hosts?.map((host) => (
              <div key={host.id} className="flex flex-col bg-card rounded-[2.5rem] overflow-hidden border border-border group transition-all hover:shadow-2xl relative romantic-card-glow">
                <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                  <Image 
                    src={host.previewImageUrl || "https://picsum.photos/seed/host/600/800"} 
                    alt={host.id} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <Badge className="bg-primary border-none text-[9px] font-black uppercase tracking-widest px-3 shadow-lg">Live</Badge>
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className="size-6 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-[10px] shadow-lg">
                      {host.country || '🌍'}
                    </div>
                  </div>
                  {host.streamType === 'private' && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[6px] flex flex-col items-center justify-center gap-2 animate-in fade-in duration-300">
                      <Lock className="size-10 text-primary/80" />
                      <p className="text-[10px] font-black text-white/80 uppercase tracking-widest">Private Hub</p>
                      <Badge variant="secondary" className="bg-primary text-white text-[8px] border-none font-black px-4">50 COINS</Badge>
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-black text-sm tracking-tight truncate uppercase italic">{host.username || `Host_${host.id.slice(0, 4)}`}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="size-3 text-amber-500 fill-current" />
                      <span className="text-[10px] font-black text-slate-500">{host.rating || '4.9'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => zapConnect(host.id, host.streamType || 'public')}
                      className="flex-1 romantic-gradient rounded-2xl h-10 text-[10px] font-black gap-1 uppercase tracking-widest text-white hover:scale-105 transition-transform romantic-glow shadow-md"
                    >
                      <Zap className="size-3 fill-current" /> {host.streamType === 'private' ? 'Unlock' : 'Zap'}
                    </Button>
                    <Link href={`/stream/${host.id}`} className="flex-1">
                      <Button variant="outline" className="w-full rounded-2xl h-10 text-[10px] font-black gap-1 border-secondary/20 text-secondary uppercase tracking-widest hover:bg-secondary/5">
                        <MessageCircle className="size-3" /> View
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <AdBanner />
      </main>

      <BottomNav />
    </div>
  );
}

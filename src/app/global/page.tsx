
'use client';

import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp, query, where, limit } from 'firebase/firestore';
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Zap, Lock, X, CheckCircle, AlertCircle, RefreshCw, ShieldAlert } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from 'react';
import { MOCK_HOSTS } from '@/lib/mock-data';
import { cn } from "@/lib/utils";
import AdBanner from "@/components/Ads/AdBanner";
import { personalizedHostRecommendations, type PersonalizedHostRecommendationsOutput } from "@/ai/flows/personalized-host-recommendations-flow";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function GlobalMarketplace() {
  const { firestore, user, areServicesAvailable, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const [showAIBot, setShowAIBot] = useState(false);
  const [showAgeGate, setShowAgeGate] = useState(true);
  const [recommendations, setRecommendations] = useState<PersonalizedHostRecommendationsOutput["recommendations"]>([]);

  useEffect(() => {
    const isVerified = localStorage.getItem('age-verified-18');
    if (isVerified) setShowAgeGate(false);
    const timer = setTimeout(() => setShowAIBot(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleAgeVerify = () => {
    localStorage.setItem('age-verified-18', 'true');
    setShowAgeGate(false);
    toast({ title: "Welcome to Global Love", description: "Identity check passed. Stay safe!" });
  };

  const liveHostsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'hosts'), 
      where('isLive', '==', true),
      limit(20)
    );
  }, [firestore]);

  const { data: hosts, isLoading } = useCollection(liveHostsQuery);

  useEffect(() => {
    if (!hosts || hosts.length === 0 || !user || recommendations.length > 0) return;
    async function getAIRecommendations() {
      try {
        const res = await personalizedHostRecommendations({
          userId: user?.uid || 'guest',
          userInterests: ['Music', 'Talk', 'Fun'],
          viewingHistory: [],
          availableHosts: hosts.map(h => ({
            id: h.id,
            name: h.username || 'Anonymous',
            categories: ['General'],
            country: h.country || 'Global',
            isLive: h.isLive || false,
            previewImage: h.previewImageUrl || "https://picsum.photos/seed/host/600/800"
          }))
        });
        setRecommendations(res.recommendations);
      } catch (e) { console.error(e); }
    }
    getAIRecommendations();
  }, [hosts, user, recommendations.length]);

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
      toast({ title: "Live Simulation Active" });
    } finally { setIsSeeding(false); }
  };

  if (isUserLoading && areServicesAvailable) {
    return (
      <div className="min-h-screen bg-[#2D1B2D] flex flex-col items-center justify-center space-y-8 mesh-gradient">
        <div className="relative size-32 animate-pulse logo-glow">
          <Image 
            src="/logo.png?v=2" 
            alt="Loading..." 
            fill 
            className="object-contain" 
            onError={(e) => { (e.target as any).src = "https://placehold.co/400x400/E11D48/white?text=GL" }} 
          />
        </div>
        <div className="size-8 border-4 border-[#E11D48] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 max-w-lg mx-auto border-x border-white/5 mesh-gradient screen-guard-active">
      <Header />
      
      {!areServicesAvailable && (
        <div className="mx-6 mt-6 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-4">
           <AlertCircle className="size-6 text-red-500 shrink-0" />
           <div className="flex-1">
             <p className="text-[10px] font-black uppercase text-red-200">Simulation Mode Active</p>
             <p className="text-[8px] font-bold uppercase text-red-300/60">Connect Firebase for Live Nodes</p>
           </div>
           <Button size="sm" onClick={seedFakeLiveHosts} className="bg-red-500 text-white text-[8px] font-black h-8 px-4">Initialize</Button>
        </div>
      )}

      <Dialog open={showAgeGate} onOpenChange={() => {}}>
        <DialogContent className="bg-[#2D1B2D] border-white/10 text-white rounded-[3rem] max-w-[90vw] mx-auto p-8">
          <DialogHeader className="items-center text-center">
            <div className="size-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 romantic-glow">
              <ShieldAlert className="size-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-white">Identity Check</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4 text-center">
             <p className="text-sm font-bold leading-relaxed text-slate-300">You must be <span className="text-primary font-black">18 or older</span> to enter.</p>
             <div className="bg-white/5 rounded-2xl p-4 text-[10px] text-left space-y-2 border border-white/10">
               <p className="flex items-start gap-2"><CheckCircle className="size-3 text-green-400 mt-0.5" /> Public Streams: No Nudity.</p>
               <p className="flex items-start gap-2"><CheckCircle className="size-3 text-green-400 mt-0.5" /> Private Streams: Encrypted.</p>
             </div>
             <Button onClick={handleAgeVerify} className="w-full h-14 rounded-2xl romantic-gradient font-black uppercase tracking-widest text-white shadow-xl">I am 18+ / Enter</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <main className="px-6 pt-8 space-y-8">
        {showAIBot && (
          <div className="romantic-gradient p-5 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border border-white/20 animate-in slide-in-from-right-10">
            <button onClick={() => setShowAIBot(false)} className="absolute top-4 right-4 text-white/60"><X className="size-4" /></button>
            <div className="flex items-center gap-3 mb-2">
               <div className="size-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl">🤖</div>
               <span className="text-xs font-black uppercase italic">Safety Agent Active</span>
            </div>
            <p className="text-[10px] font-bold leading-relaxed mb-4">"Public nudity is strictly banned. Keep it classy!"</p>
          </div>
        )}

        <section className="flex items-center justify-between px-2">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black font-headline tracking-tight uppercase italic text-white">Verified</h2>
            <p className="text-[9px] text-[#FDA4AF] uppercase tracking-[0.2em] font-black flex items-center gap-2"><Zap className="size-3 text-amber-400 fill-current" /> AI Scanned</p>
          </div>
          {(!hosts || hosts.length === 0) && (
            <Button onClick={seedFakeLiveHosts} disabled={isSeeding} size="sm" variant="outline" className="rounded-full gap-2 text-[9px] font-black uppercase h-9 border-white/10 text-[#FDA4AF]">
              <RefreshCw className={cn("size-3", isSeeding && "animate-spin")} /> Simulate
            </Button>
          )}
        </section>

        <div className="grid grid-cols-2 gap-5">
          {hosts?.map((host) => (
            <div key={host.id} className="flex flex-col bg-[#3D263D]/80 rounded-[2.5rem] overflow-hidden border border-white/5 group transition-all relative hover:border-[#F472B6]/20 shadow-xl">
              <div className="relative aspect-[3/4] overflow-hidden bg-[#2D1B2D]">
                <Image 
                  src={host.previewImageUrl || "https://picsum.photos/seed/host/600/800"} 
                  alt={host.id} 
                  fill 
                  className={cn("object-cover transition-transform duration-1000 group-hover:scale-110", (host.streamType === 'private' || host.manualBlur) && "blur-xl opacity-50")} 
                />
                <Badge className="absolute top-4 left-4 bg-[#E11D48] border-none text-[8px] font-black uppercase px-3 py-1">Live</Badge>
                {host.streamType === 'private' && (
                  <div className="absolute inset-0 bg-[#2D1B2D]/40 backdrop-blur-md flex flex-col items-center justify-center gap-3">
                    <Lock className="size-10 text-[#F472B6]/80" />
                    <Badge variant="secondary" className="bg-[#E11D48] text-white text-[8px] border-none font-black px-4 py-1">50 COINS</Badge>
                  </div>
                )}
              </div>
              <div className="p-4 space-y-4">
                <h3 className="font-black text-xs tracking-tight truncate uppercase italic text-white">@{host.username}</h3>
                <Link href={`/stream/${host.id}`} className="w-full block">
                  <Button variant="outline" className="w-full rounded-xl h-10 text-[9px] font-black border-white/10 text-white uppercase tracking-widest hover:bg-white/5">View Node</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
        <AdBanner />
      </main>
      <BottomNav />
    </div>
  );
}

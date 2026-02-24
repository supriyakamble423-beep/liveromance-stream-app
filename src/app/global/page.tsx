
'use client';

import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp, query, where, limit, addDoc } from 'firebase/firestore';
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MessageCircle, Zap, ShieldCheck, Lock, RefreshCw, X, Star, Sparkles, TrendingUp, ShieldAlert, CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from 'react';
import { MOCK_HOSTS } from '@/lib/mock-data';
import { cn } from "@/lib/utils";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import AdBanner from "@/components/Ads/AdBanner";
import { personalizedHostRecommendations, type PersonalizedHostRecommendationsOutput } from "@/ai/flows/personalized-host-recommendations-flow";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function GlobalMarketplace() {
  const { firestore, user, areServicesAvailable } = useFirebase();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const [showAIBot, setShowAIBot] = useState(false);
  const [showAgeGate, setShowAgeGate] = useState(true);
  const [recommendations, setRecommendations] = useState<PersonalizedHostRecommendationsOutput["recommendations"]>([]);

  // Check age verification from localStorage
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
        const availableHosts = hosts.map(h => ({
          id: h.id,
          name: h.username || 'Anonymous',
          categories: ['General'],
          country: h.country || 'Global',
          isLive: h.isLive || false,
          previewImage: h.previewImageUrl || "https://picsum.photos/seed/host/600/800"
        }));

        const res = await personalizedHostRecommendations({
          userId: user?.uid || 'guest',
          userInterests: ['Music', 'Talk', 'Fun'],
          viewingHistory: [],
          availableHosts
        });
        setRecommendations(res.recommendations);
      } catch (e) {
        console.error("AI Recommendation Error:", e);
      }
    }

    getAIRecommendations();
  }, [hosts, user, recommendations.length]);

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
          console.error("Seed error", err);
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
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Sign in required", description: "Please log in to interact." });
      return;
    }

    const requestData = {
      hostId,
      userId: user.uid,
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

  if (isLoading || !areServicesAvailable) {
    return (
      <div className="min-h-screen bg-[#2D1B2D] flex flex-col items-center justify-center space-y-8 mesh-gradient">
        <div className="relative size-40 animate-pulse drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] logo-glow">
          <Image 
            src="/logo.png" 
            alt="Loading..." 
            fill 
            className="object-contain" 
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "https://placehold.co/400x400/E11D48/white?text=GL";
            }}
          />
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 border-4 border-[#E11D48] border-t-transparent rounded-full animate-spin" />
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FDA4AF]">Connecting to Global Love...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 max-w-lg mx-auto border-x border-white/5 mesh-gradient screen-guard-active">
      <Header />

      {/* 18+ Age Gate & Policy Modal */}
      <Dialog open={showAgeGate} onOpenChange={() => {}}>
        <DialogContent className="bg-[#2D1B2D] border-white/10 text-white rounded-[3rem] max-w-[90vw] mx-auto p-8 overflow-hidden">
          <DialogHeader className="items-center text-center">
            <div className="size-20 bg-primary/20 rounded-full flex items-center justify-center mb-4 romantic-glow">
              <ShieldAlert className="size-10 text-primary" />
            </div>
            <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">Identity Check</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4 text-center">
             <div className="space-y-4">
               <p className="text-sm font-bold leading-relaxed text-slate-300">
                 You must be <span className="text-primary font-black">18 or older</span> to enter Global Love.
               </p>
               <div className="bg-white/5 rounded-2xl p-4 text-[10px] text-left space-y-2 border border-white/10">
                 <p className="flex items-start gap-2"><CheckCircle className="size-3 text-green-400 mt-0.5" /> Public Streams: No Nudity allowed.</p>
                 <p className="flex items-start gap-2"><CheckCircle className="size-3 text-green-400 mt-0.5" /> Private Streams: Encrypted & Private.</p>
                 <p className="text-[9px] opacity-60 mt-4 leading-relaxed font-bold italic">"Public nudity is strictly prohibited to maintain platform decorum. Private sessions are personal and consensual."</p>
               </div>
             </div>
             <div className="flex flex-col gap-3">
               <Button onClick={handleAgeVerify} className="h-16 rounded-2xl romantic-gradient font-black uppercase tracking-widest text-white shadow-xl">
                 I am 18+ / Enter
               </Button>
               <Link href="https://google.com" className="text-[10px] font-bold text-slate-500 uppercase underline decoration-slate-700">
                 Exit Platform
               </Link>
             </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <main className="px-6 pt-8 space-y-8">
        {showAIBot && (
          <div className="relative animate-in slide-in-from-right-10 duration-700 z-40">
            <div className="romantic-gradient p-6 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group romantic-glow border border-white/20">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck className="size-20" />
              </div>
              <button 
                onClick={() => setShowAIBot(false)}
                className="absolute top-5 right-5 text-white/60 hover:text-white"
              >
                <X className="size-5" />
              </button>
              <div className="flex items-center gap-4 mb-3">
                 <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shadow-inner backdrop-blur-md">🤖</div>
                 <div className="flex flex-col">
                   <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/80 leading-none mb-1">Stream-X Agent</span>
                   <span className="text-sm font-black uppercase tracking-tight italic">Safety Overseer</span>
                 </div>
              </div>
              <p className="text-xs font-bold leading-relaxed mb-5 text-white/90">
                "Welcome! I monitor all Public streams 24/7. <span className="underline decoration-pink-300 font-black">Nudity is strictly banned.</span> Keep it classy!"
              </p>
              <div className="flex gap-3">
                <Button size="sm" variant="secondary" className="h-10 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white text-primary hover:bg-slate-100 shadow-xl border-none">
                  Explore Safe Nodes
                </Button>
                <Button size="sm" variant="outline" className="h-10 rounded-2xl text-[10px] font-black uppercase tracking-widest border-white/30 text-white hover:bg-white/10">
                  Privacy
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* AI RECOMMENDED SECTION */}
        {recommendations.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#FDA4AF] flex items-center gap-2">
                <Sparkles className="size-4 text-amber-400 animate-pulse" /> Recommended For You
              </h2>
              <Badge variant="outline" className="text-[8px] font-black uppercase border-white/10 text-white/40">AI Selection</Badge>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {recommendations.map((rec) => (
                <Link key={rec.hostId} href={`/stream/${rec.hostId}`} className="flex-shrink-0 w-40">
                  <div className="bg-[#3D263D]/60 border border-white/5 rounded-[2rem] p-3 space-y-3 relative overflow-hidden group">
                    <div className="relative aspect-square rounded-[1.5rem] overflow-hidden">
                      <Image src={rec.previewImageUrl} alt={rec.hostName} fill className="object-cover transition-transform group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <Badge className="absolute bottom-2 left-2 bg-[#E11D48] text-[7px] border-none font-black uppercase px-2 h-4">Live</Badge>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white truncate italic">@{rec.hostName}</p>
                      <p className="text-[8px] text-amber-400/80 font-bold uppercase tracking-widest truncate">{rec.reason.slice(0, 30)}...</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="bg-[#3D263D]/60 border border-white/5 rounded-[2.5rem] p-6 flex items-center justify-between romantic-card-glow backdrop-blur-md">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F472B6] flex items-center gap-2">
              <ShieldCheck className="size-3" /> Global Safety Grid
            </p>
            <h2 className="text-2xl font-black font-headline tracking-tighter uppercase italic text-white">Market Status</h2>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <p className="text-[10px] font-black text-[#FDA4AF]/60 uppercase">Live</p>
              <p className="text-xl font-black text-[#E11D48] drop-shadow-[0_0_10px_#E11D48]">{hosts?.length || 0}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-[#FDA4AF]/60 uppercase">Secure</p>
              <p className="text-xl font-black text-green-400 drop-shadow-[0_0_10px_#4ade80]">100%</p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-between px-2">
          <div className="flex flex-col">
            <h2 className="text-3xl font-black font-headline tracking-tight uppercase italic text-white">Verified</h2>
            <p className="text-[10px] text-[#FDA4AF] uppercase tracking-[0.2em] font-black flex items-center gap-2">
              <Zap className="size-3 text-amber-400 fill-current" /> AI Scanned Every 10s
            </p>
          </div>
          {(!hosts || hosts.length === 0) && !isLoading && (
            <Button onClick={seedFakeLiveHosts} disabled={isSeeding} size="sm" variant="outline" className="rounded-full gap-2 text-[10px] font-black uppercase tracking-widest h-10 border-white/10 text-[#FDA4AF] hover:bg-white/5">
              <RefreshCw className={cn("size-3", isSeeding && "animate-spin")} /> Simulate
            </Button>
          )}
        </section>

        <div className="grid grid-cols-2 gap-5">
          {hosts?.map((host) => (
            <div key={host.id} className="flex flex-col bg-[#3D263D]/80 rounded-[3rem] overflow-hidden border border-white/5 group transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative hover:border-[#F472B6]/20">
              <div className="relative aspect-[3/4] overflow-hidden bg-[#2D1B2D]">
                <Image 
                  src={host.previewImageUrl || "https://picsum.photos/seed/host/600/800"} 
                  alt={host.id} 
                  fill 
                  className={cn("object-cover transition-transform duration-1000 group-hover:scale-110", (host.streamType === 'private' || host.manualBlur) && "blur-xl opacity-50")}
                />
                <div className="absolute top-5 left-5 flex flex-col gap-2">
                  <Badge className="bg-[#E11D48] border-none text-[9px] font-black uppercase tracking-widest px-4 py-1 shadow-2xl">Live</Badge>
                </div>
                <div className="absolute top-5 right-5">
                  <div className="size-8 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center text-xs shadow-2xl border border-white/10">
                    {host.country || '🌍'}
                  </div>
                </div>
                {host.streamType === 'private' && (
                  <div className="absolute inset-0 bg-[#2D1B2D]/40 backdrop-blur-md flex flex-col items-center justify-center gap-3 animate-in fade-in duration-500">
                    <Lock className="size-12 text-[#F472B6]/80" />
                    <p className="text-[10px] font-black text-white/90 uppercase tracking-[0.2em]">Private Hub</p>
                    <Badge variant="secondary" className="bg-[#E11D48] text-white text-[9px] border-none font-black px-5 py-1 shadow-lg">50 COINS</Badge>
                  </div>
                )}
                {host.streamType === 'public' && host.manualBlur && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center gap-2">
                    <ShieldAlert className="size-8 text-white/40" />
                    <p className="text-[8px] font-black uppercase text-white/40 tracking-[0.2em]">Manual Blur Active</p>
                  </div>
                )}
              </div>
              <div className="p-5 space-y-5">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-sm tracking-tight truncate uppercase italic text-white">@{host.username || `Host_${host.id.slice(0, 4)}`}</h3>
                  <div className="flex items-center gap-1.5">
                    <Star className="size-3 text-amber-400 fill-current" />
                    <span className="text-[11px] font-black text-[#FDA4AF]">{host.rating || '4.9'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => zapConnect(host.id, host.streamType || 'public')}
                    className="flex-1 romantic-gradient rounded-2xl h-11 text-[10px] font-black gap-2 uppercase tracking-widest text-white hover:scale-105 transition-transform shadow-xl border-none"
                  >
                    <Zap className="size-3 fill-current" /> {host.streamType === 'private' ? 'Unlock' : 'Zap'}
                  </Button>
                  <Link href={`/stream/${host.id}`} className="flex-1">
                    <Button variant="outline" className="w-full rounded-2xl h-11 text-[10px] font-black gap-2 border-white/10 text-white uppercase tracking-widest hover:bg-white/5">
                      <MessageCircle className="size-3" /> View
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {(!hosts || hosts.length === 0) && !isLoading && (
          <div className="flex flex-col items-center py-20 space-y-4">
             <div className="size-20 bg-white/5 rounded-full flex items-center justify-center border border-dashed border-white/10">
                <TrendingUp className="size-10 text-slate-500" />
             </div>
             <p className="text-xs font-black uppercase text-slate-500 tracking-[0.2em]">No Active Nodes Found</p>
             <Button onClick={seedFakeLiveHosts} variant="secondary" className="rounded-2xl px-8 h-12 font-black uppercase text-[10px]">Populate Market</Button>
          </div>
        )}

        <AdBanner />
      </main>

      <BottomNav />
    </div>
  );
}

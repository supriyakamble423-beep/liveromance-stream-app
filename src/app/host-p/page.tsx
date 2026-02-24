'use client';

import { useFirebase, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { BottomNav } from "@/components/BottomNav";
import { 
  ShieldCheck, Wallet, Settings, Radio, 
  Lock, Globe, Users, Loader2, Zap, Sparkles, Camera, Power,
  ChevronRight, Share2, MapPin, Save, Clock, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import Image from "next/image";
import Link from "next/link";
import { doc, serverTimestamp, query, where, orderBy, limit, collection, updateDoc, increment } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { aiGuidedHostProfileOptimization } from "@/ai/flows/ai-guided-host-profile-optimization-flow";
import { useState, useRef } from "react";
import AdBanner from "@/components/Ads/AdBanner";

export default function HostProfileDashboard() {
  const { firestore, storage, user } = useFirebase();
  const { toast } = useToast();
  const userId = user?.uid;
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isTogglingLive, setIsTogglingLive] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editCountry, setEditCountry] = useState("");

  const hostRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'hosts', userId);
  }, [firestore, userId]);

  const { data: hostProfile, isLoading: isProfileLoading } = useDoc(hostRef);

  const updateStreamType = async (type: 'public' | 'private') => {
    if (!hostRef) return;
    try {
      await updateDoc(hostRef, { streamType: type, updatedAt: serverTimestamp() });
      toast({ title: "Mode Updated", description: `Switched to ${type.toUpperCase()}` });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Update failed.' });
    }
  };

  const toggleLiveStatus = async () => {
    if (!hostRef) return;
    setIsTogglingLive(true);
    const newStatus = !hostProfile?.isLive;
    try {
      const updateData: any = { 
        isLive: newStatus, 
        updatedAt: serverTimestamp() 
      };

      if (newStatus) {
        updateData.streamStartTime = serverTimestamp();
      }

      await updateDoc(hostRef, updateData);
      toast({ 
        title: newStatus ? "Broadcast Active" : "Stream Offline",
        description: newStatus ? "Stay-to-Earn logic is now tracking your session." : "Session data synced to wallet."
      });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Action failed.' });
    } finally {
      setIsTogglingLive(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!hostRef) return;
    setIsUpdatingProfile(true);
    try {
      await updateDoc(hostRef, {
        username: editName || hostProfile?.username,
        bio: editBio || hostProfile?.bio,
        country: editCountry || hostProfile?.country,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Profile Updated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-[#2D1B2D] flex flex-col items-center justify-center space-y-8 mesh-gradient">
        <div className="relative size-40 animate-pulse drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
          <Image src="/logo.png" alt="Loading Profile..." fill className="object-contain" />
        </div>
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white pb-32 max-w-lg mx-auto border-x border-white/5 mesh-gradient">
      <header className="p-8 pt-16 bg-gradient-to-b from-[#E11D48]/15 to-transparent rounded-b-[4rem]">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-black tracking-tighter uppercase italic flex items-center gap-2">
             Dashboard <ChevronRight className="size-6 text-primary" />
          </h1>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full bg-white/5 border border-white/10 hover:bg-primary/20 size-12">
                <Settings className="size-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#2D1B2D] border-white/10 text-white rounded-[3rem] max-w-[90vw] mx-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic text-white">Edit Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-6">
                <div className="space-y-4">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Display Name" className="bg-white/5 border-white/10 rounded-2xl h-14" />
                  <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Bio" className="bg-white/5 border-white/10 rounded-2xl min-h-[120px]" />
                  <Input value={editCountry} onChange={(e) => setEditCountry(e.target.value)} placeholder="Country" className="bg-white/5 border-white/10 rounded-2xl h-14" />
                </div>
                <Button onClick={handleProfileUpdate} disabled={isUpdatingProfile} className="w-full romantic-gradient rounded-2xl h-14 font-black uppercase text-white shadow-xl">
                  {isUpdatingProfile ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />} Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-6 mb-10">
          <div className="relative size-28 rounded-[3.5rem] overflow-hidden border-4 border-primary shadow-[0_0_30px_rgba(225,29,72,0.3)] bg-[#3D263D]">
            <Image src={hostProfile?.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`} alt="Profile" fill className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl font-black tracking-tighter uppercase truncate text-white">@{hostProfile?.username || 'Host'}</h2>
            <div className="flex items-center gap-3 mt-3">
              <Badge className={cn("h-7 text-[10px] px-4 font-black tracking-widest border-none", hostProfile?.verified ? "bg-green-500 shadow-[0_0_15px_#22c55e]" : "bg-white/10")}>
                {hostProfile?.verified ? "VERIFIED" : "PENDING"}
              </Badge>
              {hostProfile?.isLive && <Badge className="h-7 text-[10px] px-4 font-black bg-[#E11D48] animate-pulse shadow-[0_0_15px_#E11D48] border-none">LIVE</Badge>}
            </div>
          </div>
        </div>

        {/* METRICS: SHOWING STAY-TO-EARN IMPACT */}
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-[#3D263D]/80 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-xl group hover:border-amber-500/30 transition-all">
            <p className="text-[10px] font-black text-[#FDA4AF]/60 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
              <Wallet className="size-3 text-amber-400" /> Total Earnings
            </p>
            <span className="text-3xl font-black tracking-tighter text-white">{Math.floor(hostProfile?.earnings || 0)}</span>
            {hostProfile?.lastSessionBonus > 0 && (
              <p className="text-[8px] text-green-400 font-bold mt-1 uppercase tracking-widest">+{hostProfile.lastSessionBonus} Last Bonus</p>
            )}
          </div>
          <div className="bg-[#3D263D]/80 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-xl group hover:border-primary/30 transition-all">
            <p className="text-[10px] font-black text-[#FDA4AF]/60 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
              <Clock className="size-3 text-primary" /> Stream Time
            </p>
            <span className="text-3xl font-black tracking-tighter text-white">{hostProfile?.totalStreamMinutes || "0"} <span className="text-sm opacity-40 font-bold tracking-normal uppercase">min</span></span>
          </div>
        </div>
      </header>

      <main className="px-8 space-y-8">
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#FDA4AF]/60">Earning Performance</h3>
            <TrendingUp className="size-4 text-green-400" />
          </div>
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 space-y-4">
             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-400">Current Rate:</span>
                <span className="text-primary">1.0x Base</span>
             </div>
             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-400">Target (30m):</span>
                <span className="text-cyan-400">1.5x Multiplier</span>
             </div>
             <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full romantic-gradient w-1/3 shadow-[0_0_10px_#E11D48]" />
             </div>
          </div>
        </section>

        <section className="space-y-4">
          <Button onClick={toggleLiveStatus} disabled={isTogglingLive} className={cn("w-full h-28 rounded-[3.5rem] font-black text-3xl uppercase tracking-[0.1em] gap-5 shadow-2xl transition-all border-none text-white", hostProfile?.isLive ? "bg-[#E11D48] hover:bg-[#E11D48]/90" : "bg-green-500 hover:bg-green-600 shadow-green-500/20")}>
            {isTogglingLive ? <Loader2 className="size-10 animate-spin" /> : <Power className="size-12" />}
            {hostProfile?.isLive ? "End Stream" : "Go Live Now"}
          </Button>
          
          {hostProfile?.isLive && (
            <Link href={`/stream/${userId}`} className="block">
              <Button variant="outline" className="w-full h-16 rounded-[2rem] border-primary text-primary font-black uppercase tracking-widest gap-3 shadow-xl bg-primary/5 hover:bg-primary/10">
                <Radio className="size-6" /> Preview My Signal
              </Button>
            </Link>
          )}
        </section>

        <section className="bg-gradient-to-br from-[#E11D48]/15 to-transparent border border-white/10 rounded-[3rem] p-8 space-y-6 shadow-2xl romantic-card-glow relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Sparkles className="size-24 text-white" />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-xl">
              <Trophy className="size-7 animate-pulse" />
            </div>
            <div>
              <h4 className="text-base font-black uppercase tracking-tight text-white">Profit Milestones</h4>
              <p className="text-[10px] text-[#FDA4AF]/60 font-black uppercase tracking-widest">Active Stay-to-Earn Meta</p>
            </div>
          </div>
          <div className="space-y-3 relative z-10">
            <div className="flex justify-between items-center p-3 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-[11px] font-black text-[#FDA4AF]/80 uppercase italic">15 Mins</span>
              <span className="text-[10px] font-bold text-white bg-[#CD7F32] px-3 py-1 rounded-full">+50 Bonus</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-[11px] font-black text-[#FDA4AF]/80 uppercase italic">30 Mins</span>
              <span className="text-[10px] font-bold text-white bg-cyan-500 px-3 py-1 rounded-full">1.5x Coins</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-[11px] font-black text-[#FDA4AF]/80 uppercase italic">60 Mins</span>
              <span className="text-[10px] font-bold text-black bg-yellow-400 px-3 py-1 rounded-full font-black">2.0x Jackpot</span>
            </div>
          </div>
        </section>

        <AdBanner />
      </main>

      <BottomNav />
    </div>
  );
}
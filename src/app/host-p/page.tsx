'use client';

import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { BottomNav } from "@/components/BottomNav";
import { 
  Settings, Radio, Power, ChevronRight, Save, Clock, Target, 
  Activity, Zap, AlertCircle, Loader2, Wallet, Camera, Video, ShieldCheck, Sparkles, Star,
  CheckCircle2
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
} from "@/components/ui/dialog";
import Image from "next/image";
import Link from "next/link";
import { doc, serverTimestamp, updateDoc, setDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import AdBanner from "@/components/Ads/AdBanner";

export default function HostProfileDashboard() {
  const { firestore, user, areServicesAvailable, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const userId = user?.uid || 'simulate_host';
  const [isTogglingLive, setIsTogglingLive] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [showRulebook, setShowRulebook] = useState(false);
  
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editCountry, setEditCountry] = useState("");

  const hostRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'hosts', userId);
  }, [firestore, userId]);

  const { data: hostProfile } = useDoc(hostRef);

  const startStreamProcess = () => {
    if (hostProfile?.isLive) {
      toggleLiveStatus();
    } else {
      setShowRulebook(true);
    }
  };

  const toggleLiveStatus = async () => {
    if (!hostRef || !firestore || !userId) {
       toast({ title: hostProfile?.isLive ? "Offline" : "Live Simulation Active" });
       return;
    }
    setIsTogglingLive(true);
    const newStatus = !hostProfile?.isLive;
    try {
      await setDoc(hostRef, {
        userId,
        isLive: newStatus,
        updatedAt: serverTimestamp(),
        streamStartTime: newStatus ? serverTimestamp() : null,
        username: hostProfile?.username || user?.displayName || "New Host",
        previewImageUrl: hostProfile?.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        streamType: hostProfile?.streamType || 'public',
        rating: hostProfile?.rating || 4.9,
        verified: hostProfile?.verified || true,
        reportsCount: 0 
      }, { merge: true });

      setShowRulebook(false);
      toast({ 
        title: newStatus ? "Broadcast Active" : "Stream Offline",
        description: newStatus ? "Rules accepted. You are now live." : "Session data saved."
      });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: 'Permission denied.' });
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

  if (isUserLoading && areServicesAvailable) {
    return (
      <div className="min-h-screen bg-[#2D1B2D] flex flex-col items-center justify-center space-y-8 mesh-gradient">
        <div className="relative size-40 animate-pulse logo-glow">
           <Image 
            src="/logo.png" 
            alt="Loading" 
            fill 
            className="object-contain" 
            onError={(e) => { (e.target as any).src = "https://placehold.co/400x400/E11D48/white?text=GL" }} 
          />
        </div>
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white pb-32 max-w-lg mx-auto border-x border-white/5 mesh-gradient">
      <header className="p-8 pt-10 bg-gradient-to-b from-[#E11D48]/15 to-transparent rounded-b-[4rem]">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-black tracking-tighter uppercase italic flex items-center gap-2">
             DASHBOARD <ChevronRight className="size-6 text-primary" />
          </h1>
          
          <div className="flex items-center gap-2">
            <Link href="/host-p/payout">
              <Button variant="ghost" size="icon" className="rounded-full bg-white/5 border border-white/10 hover:bg-primary/20 size-12">
                <Wallet className="size-6 text-primary" />
              </Button>
            </Link>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-white/5 border border-white/10 hover:bg-primary/20 size-12">
                  <Settings className="size-6 text-white/60" />
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
        </div>

        <div className="flex items-center gap-6 mb-10">
          <div className="relative size-28 rounded-[3.5rem] overflow-hidden border-4 border-primary shadow-[0_0_30px_rgba(225,29,72,0.3)] bg-[#3D263D]">
            <Image src={hostProfile?.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`} alt="Profile" fill className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl font-black tracking-tighter uppercase truncate text-white italic">@{hostProfile?.username || 'Host_Node'}</h2>
            <div className="flex items-center gap-3 mt-3">
              <Badge className={cn("h-7 text-[10px] px-4 font-black tracking-widest border-none", hostProfile?.verified ? "bg-green-500 text-white" : "bg-white/10 text-slate-400")}>
                {hostProfile?.verified ? "VERIFIED" : "UNVERIFIED"}
              </Badge>
              {hostProfile?.isLive && <Badge className="h-7 text-[10px] px-4 font-black bg-[#E11D48] animate-pulse border-none">LIVE</Badge>}
            </div>
          </div>
        </div>

        {/* Multiplier Status Card */}
        <section className="bg-[#3D263D]/60 p-6 rounded-[2.5rem] border border-white/10 backdrop-blur-xl mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FDA4AF]">Earning Level</span>
              <h3 className="text-xl font-black italic uppercase text-white flex items-center gap-2">
                <Sparkles className="size-5 text-amber-400" /> {hostProfile?.isLive ? "1.5x Multiplier" : "1.0x Base Rate"}
              </h3>
            </div>
            <div className="flex gap-1">
              <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black">1.5x</Badge>
              <Badge className="bg-white/5 text-slate-500 border-none text-[8px] font-black">2.0x</Badge>
            </div>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full w-[65%]" />
          </div>
          <p className="text-[9px] font-bold text-slate-500 uppercase mt-3 tracking-widest">
            Stream 15 more minutes to unlock 2.0x Gold Rate
          </p>
        </section>

        {/* Action Buttons: Pic & Video */}
        <div className="grid grid-cols-2 gap-4">
            <Link href="/host-f" className="flex-1">
              <Button variant="outline" className="w-full h-20 rounded-[2rem] border-white/10 bg-white/5 text-white flex flex-col items-center gap-1 hover:bg-primary/20 transition-all">
                <Camera className="size-6 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest">Face Verify (Pic)</span>
              </Button>
            </Link>
            <Button variant="outline" onClick={() => toast({ title: "Media Hub", description: "Video setup active." })} className="flex-1 h-20 rounded-[2rem] border-white/10 bg-white/5 text-white flex flex-col items-center gap-1 hover:bg-primary/20 transition-all">
              <Video className="size-6 text-secondary" />
              <span className="text-[10px] font-black uppercase tracking-widest">Stream Hub (Video)</span>
            </Button>
        </div>
      </header>

      <main className="px-8 space-y-10 pt-10">
        <section className="space-y-4">
          <Button 
            onClick={startStreamProcess} 
            disabled={isTogglingLive} 
            className={cn(
              "w-full h-28 rounded-[3.5rem] font-black text-3xl uppercase tracking-[0.1em] gap-5 shadow-2xl transition-all border-none text-white italic", 
              hostProfile?.isLive ? "bg-[#E11D48]" : "bg-green-500 shadow-green-500/20"
            )}
          >
            {isTogglingLive ? <Loader2 className="size-10 animate-spin" /> : <Power className="size-12" />}
            {hostProfile?.isLive ? "End Stream" : "Go Live"}
          </Button>

          {hostProfile?.isLive && (
            <Link href={`/stream/${userId}`} className="block">
              <Button variant="outline" className="w-full h-16 rounded-[2rem] border-primary text-primary font-black uppercase tracking-widest gap-3 bg-primary/5">
                <Radio className="size-6" /> Preview Stream
              </Button>
            </Link>
          )}
        </section>

        <section className="grid grid-cols-2 gap-4">
            <div className="bg-[#3D263D]/80 p-6 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center">
                <p className="text-[10px] font-black text-[#FDA4AF]/60 uppercase mb-2">Total Viewers</p>
                <div className="flex items-center gap-2">
                  <Star className="size-4 text-amber-400 fill-current" />
                  <span className="text-3xl font-black italic text-white">{hostProfile?.viewers || 0}</span>
                </div>
            </div>
            <div className="bg-[#3D263D]/80 p-6 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center">
                <p className="text-[10px] font-black text-[#FDA4AF]/60 uppercase mb-2">Total Minutes</p>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-secondary" />
                  <span className="text-3xl font-black italic text-white">{hostProfile?.totalStreamMinutes || 0}</span>
                </div>
            </div>
        </section>

        <AdBanner />
      </main>

      <BottomNav />

      {/* Rulebook Dialog */}
      <Dialog open={showRulebook} onOpenChange={setShowRulebook}>
        <DialogContent className="bg-[#2D1B2D] border-white/10 text-white rounded-[3rem] max-w-[90vw] mx-auto p-8">
          <DialogHeader className="items-center text-center">
            <div className="size-20 bg-primary/20 rounded-full flex items-center justify-center mb-4 romantic-glow">
              <ShieldCheck className="size-10 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-white">Streaming Rulebook</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
             <div className="bg-white/5 rounded-2xl p-5 text-[10px] space-y-4 border border-white/10 font-bold uppercase tracking-widest">
               <p className="flex items-start gap-3 text-green-400"><CheckCircle2 className="size-4 shrink-0" /> Public Mode: Bra / Panty Allowed.</p>
               <p className="flex items-start gap-3 text-red-500"><AlertCircle className="size-4 shrink-0" /> Public Mode: No Full Nudity.</p>
               <p className="flex items-start gap-3 text-blue-400"><Sparkles className="size-4 shrink-0" /> Private Mode: Full Freedom.</p>
             </div>
             <p className="text-[9px] text-center text-slate-500 font-bold uppercase italic leading-relaxed">
               Violating Public Mode rules will result in an instant and permanent ban from the grid.
             </p>
             <Button onClick={toggleLiveStatus} className="w-full h-16 rounded-2xl romantic-gradient font-black uppercase tracking-widest text-white shadow-xl">I Accept / Go Live</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

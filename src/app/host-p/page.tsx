'use client';

import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { BottomNav } from "@/components/BottomNav";
import { 
  Settings, Radio, Power, ChevronRight, Save, Clock, 
  Sparkles, Star, Camera, Video, ShieldCheck, Wallet, Loader2, CheckCircle2, AlertCircle
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
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdBanner from "@/components/Ads/AdBanner";

export default function HostProfileDashboard() {
  const { firestore, user, areServicesAvailable, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
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

  // Sync form fields with current profile data
  useEffect(() => {
    if (hostProfile) {
      setEditName(hostProfile.username || "");
      setEditBio(hostProfile.bio || "");
      setEditCountry(hostProfile.country || "");
    }
  }, [hostProfile]);

  const startStreamProcess = () => {
    // SECURITY: Enforce Face Verification before going live
    if (!hostProfile?.verified && areServicesAvailable) {
      toast({ 
        variant: "destructive", 
        title: "Identity Check Required", 
        description: "Please complete Face Verification before you can go live." 
      });
      router.push('/host-f');
      return;
    }

    if (hostProfile?.isLive) {
      toggleLiveStatus();
    } else {
      setShowRulebook(true);
    }
  };

  const toggleLiveStatus = async () => {
    if (!hostRef || !firestore || !userId) {
       toast({ title: hostProfile?.isLive ? "Offline" : "Live Simulation Active" });
       if (!hostProfile?.isLive) {
         setShowRulebook(false);
         router.push(`/stream/${userId}`);
       }
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
        username: editName || hostProfile?.username || user?.displayName || "New Host",
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

      if (newStatus) {
        router.push(`/stream/${userId}`);
      }
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to toggle stream.' });
    } finally {
      setIsTogglingLive(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!hostRef) return;
    setIsUpdatingProfile(true);
    try {
      await setDoc(hostRef, {
        username: editName,
        bio: editBio,
        country: editCountry,
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast({ title: "Profile Updated", description: "Changes saved to the grid." });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Update Failed", description: "Connection error." });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white pb-32 max-w-lg mx-auto border-x border-white/5 mesh-gradient">
      <header className="p-8 pt-10 bg-gradient-to-b from-primary/15 to-transparent rounded-b-[3.5rem]">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black tracking-tighter uppercase italic flex items-center gap-2">
             DASHBOARD <ChevronRight className="size-5 text-primary" />
          </h1>
          
          <div className="flex items-center gap-2">
            <Link href="/host-p/payout">
              <Button variant="ghost" size="icon" className="rounded-full bg-white/5 border border-white/10 hover:bg-primary/20 size-11">
                <Wallet className="size-5 text-primary" />
              </Button>
            </Link>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-white/5 border border-white/10 hover:bg-primary/20 size-11">
                  <Settings className="size-5 text-white/60" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#2D1B2D] border-white/10 text-white rounded-[2.5rem] max-w-[90vw] mx-auto p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black uppercase tracking-tighter italic text-white">Edit Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase text-primary ml-2">Display Name</p>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Display Name" className="bg-white/5 border-white/10 rounded-xl h-12" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase text-primary ml-2">Bio</p>
                      <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Tell the world about you..." className="bg-white/5 border-white/10 rounded-xl min-h-[100px]" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase text-primary ml-2">Country</p>
                      <Input value={editCountry} onChange={(e) => setEditCountry(e.target.value)} placeholder="e.g. USA, India" className="bg-white/5 border-white/10 rounded-xl h-12" />
                    </div>
                  </div>
                  <Button onClick={handleProfileUpdate} disabled={isUpdatingProfile} className="w-full romantic-gradient rounded-xl h-14 font-black uppercase text-white shadow-xl border-none">
                    {isUpdatingProfile ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />} Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center gap-5 mb-8">
          <div className="relative size-24 rounded-[2.5rem] overflow-hidden border-4 border-primary shadow-[0_0_20px_rgba(225,29,72,0.3)] bg-[#3D263D]">
            <Image src={hostProfile?.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`} alt="Profile" fill className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-black tracking-tighter uppercase truncate text-white italic">@{hostProfile?.username || 'New Host'}</h2>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={cn("h-6 text-[9px] px-3 font-black tracking-widest border-none", hostProfile?.verified ? "bg-green-500 text-white" : "bg-white/10 text-slate-400")}>
                {hostProfile?.verified ? "VERIFIED" : "UNVERIFIED"}
              </Badge>
              {hostProfile?.isLive && <Badge className="h-6 text-[9px] px-3 font-black bg-primary animate-pulse border-none">LIVE</Badge>}
            </div>
          </div>
        </div>

        <section className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 backdrop-blur-xl mb-8 romantic-glow relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Earning Level</span>
              <h3 className="text-lg font-black italic uppercase text-white flex items-center gap-2 mt-1">
                <Sparkles className="size-5 text-amber-400 animate-pulse" /> 
                {hostProfile?.isLive ? "1.5x Multiplier Active" : "1.0x Base Rate"}
              </h3>
            </div>
            <div className="flex flex-col items-end">
              <Badge className="bg-primary text-white border-none text-[10px] font-black h-8 px-5 romantic-glow">
                {hostProfile?.isLive ? "1.5x" : "1.0x"}
              </Badge>
            </div>
          </div>
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_15px_#E11D48]" 
              style={{ width: hostProfile?.isLive ? '65%' : '10%' }}
            />
          </div>
          <p className="text-[8px] font-black text-slate-500 uppercase mt-3 tracking-[0.2em] text-center">
            Stream more to unlock <span className="text-white">2.0x premium rate</span>
          </p>
        </section>

        <div className="grid grid-cols-2 gap-4 mt-6">
            <Link href="/host-f" className="flex-1">
              <Button variant="outline" className="w-full h-28 rounded-[2rem] border-white/10 bg-white/5 text-white flex flex-col items-center justify-center gap-3 hover:bg-primary/20 transition-all border-none romantic-card-glow group">
                <div className="size-12 bg-primary/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera className="size-7 text-primary" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest italic">Face Verification</span>
              </Button>
            </Link>
            <Button 
              onClick={() => toast({ title: "Media Hub", description: "Video setup is active in Live mode." })} 
              variant="outline" 
              className="flex-1 h-28 rounded-[2rem] border-white/10 bg-white/5 text-white flex flex-col items-center justify-center gap-3 hover:bg-primary/20 transition-all border-none romantic-card-glow group"
            >
              <div className="size-12 bg-secondary/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Video className="size-7 text-secondary" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest italic">Video Upload</span>
            </Button>
        </div>
      </header>

      <main className="px-8 space-y-8 pt-8">
        <section className="space-y-4">
          <Button 
            onClick={startStreamProcess} 
            disabled={isTogglingLive} 
            className={cn(
              "w-full h-24 rounded-[3.5rem] font-black text-2xl uppercase tracking-[0.1em] gap-4 shadow-2xl transition-all border-none text-white italic", 
              hostProfile?.isLive ? "bg-primary" : "bg-green-600 shadow-green-600/20"
            )}
          >
            {isTogglingLive ? <Loader2 className="size-8 animate-spin" /> : <Power className="size-10" />}
            {hostProfile?.isLive ? "Disconnect" : "Go Live"}
          </Button>

          {hostProfile?.isLive && (
            <Link href={`/stream/${userId}`} className="block">
              <Button variant="outline" className="w-full h-14 rounded-2xl border-primary text-primary font-black uppercase tracking-widest gap-2 bg-primary/5 border-2">
                <Radio className="size-5" /> Live Preview
              </Button>
            </Link>
          )}
        </section>

        <section className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center romantic-glow">
                <p className="text-[9px] font-black text-primary uppercase mb-2 tracking-widest">Global Viewers</p>
                <div className="flex items-center gap-2">
                  <Star className="size-4 text-amber-400 fill-current" />
                  <span className="text-3xl font-black italic text-white tracking-tighter">{hostProfile?.viewers || 0}</span>
                </div>
            </div>
            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center romantic-glow">
                <p className="text-[9px] font-black text-primary uppercase mb-2 tracking-widest">Active Mins</p>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-secondary" />
                  <span className="text-3xl font-black italic text-white tracking-tighter">{hostProfile?.totalStreamMinutes || 0}</span>
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
            <div className="size-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 romantic-glow">
              <ShieldCheck className="size-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-white">Streaming Rules</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
             <div className="bg-white/5 rounded-2xl p-5 text-[10px] space-y-4 border border-white/10 font-bold uppercase tracking-widest">
               <p className="flex items-start gap-3 text-green-400"><CheckCircle2 className="size-4 shrink-0" /> Public Mode: Bra / Panty Allowed.</p>
               <p className="flex items-start gap-3 text-red-500"><AlertCircle className="size-4 shrink-0" /> Public Mode: No Full Nudity.</p>
               <p className="flex items-start gap-3 text-blue-400"><Sparkles className="size-4 shrink-0" /> Private Mode: Full Freedom.</p>
             </div>
             <p className="text-[8px] text-center text-slate-500 font-black uppercase italic leading-relaxed px-6">
               Violating Public rules will result in a permanent ban.
             </p>
             <Button onClick={toggleLiveStatus} className="w-full h-16 rounded-2xl romantic-gradient font-black uppercase tracking-widest text-white shadow-xl border-none text-sm">Accept & Go Live</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

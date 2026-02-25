
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

  useEffect(() => {
    if (hostProfile) {
      setEditName(hostProfile.username || "");
      setEditBio(hostProfile.bio || "");
      setEditCountry(hostProfile.country || "");
    }
  }, [hostProfile]);

  const startStreamProcess = () => {
    // STRICT: Blocking Go Live if not verified
    if (!hostProfile?.verified && areServicesAvailable) {
      toast({ 
        variant: "destructive", 
        title: "Verification Required", 
        description: "Please complete Face Verification to access live nodes." 
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
       toast({ title: "Signal Simulation Active" });
       router.push(`/stream/${userId}`);
       return;
    }
    setIsTogglingLive(true);
    const newStatus = !hostProfile?.isLive;
    try {
      await setDoc(hostRef, {
        userId,
        isLive: newStatus,
        updatedAt: serverTimestamp(),
        username: editName || hostProfile?.username || user?.displayName || "New Host",
        previewImageUrl: hostProfile?.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        streamType: hostProfile?.streamType || 'public',
        verified: hostProfile?.verified || false
      }, { merge: true });

      setShowRulebook(false);
      toast({ 
        title: newStatus ? "Broadcast Started" : "Signal Cut",
        description: newStatus ? "Identity matched. You are now live." : "Session data synced."
      });

      if (newStatus) {
        router.push(`/stream/${userId}`);
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Signal Error', description: 'Could not update host node.' });
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
      toast({ title: "Details Saved", description: "Grid info updated successfully." });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
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
              <Button variant="ghost" size="icon" className="rounded-full bg-white/5 border border-white/10 size-11">
                <Wallet className="size-5 text-primary" />
              </Button>
            </Link>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-white/5 border border-white/10 size-11">
                  <Settings className="size-5 text-white/60" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#2D1B2D] border-white/10 text-white rounded-[2.5rem] p-6 max-w-[90vw] mx-auto border-none shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black uppercase tracking-tighter italic text-white">Edit Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase text-primary ml-2">Display Name</p>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-white/5 border-white/10 rounded-xl h-12" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase text-primary ml-2">Bio</p>
                      <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="bg-white/5 border-white/10 rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase text-primary ml-2">Country</p>
                      <Input value={editCountry} onChange={(e) => setEditCountry(e.target.value)} className="bg-white/5 border-white/10 rounded-xl h-12" />
                    </div>
                  </div>
                  <Button onClick={handleProfileUpdate} disabled={isUpdatingProfile} className="w-full h-14 romantic-gradient rounded-xl font-black uppercase shadow-xl border-none text-white">
                    {isUpdatingProfile ? <Loader2 className="animate-spin" /> : "Save Details"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center gap-5 mb-8">
          <div className="relative size-24 rounded-[2.5rem] overflow-hidden border-4 border-primary shadow-[0_0_20px_rgba(225,29,72,0.3)] bg-slate-900">
            <Image src={hostProfile?.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`} alt="Profile" fill className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-black tracking-tighter uppercase truncate italic">@{hostProfile?.username || 'New Host'}</h2>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={cn("h-6 text-[9px] px-3 font-black border-none", hostProfile?.verified ? "bg-green-500 text-white" : "bg-white/10 text-slate-400")}>
                {hostProfile?.verified ? "VERIFIED" : "UNVERIFIED"}
              </Badge>
              {hostProfile?.isLive && <Badge className="h-6 text-[9px] px-3 font-black bg-primary animate-pulse border-none">LIVE</Badge>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <Link href="/host-f" className="flex-1">
              <Button variant="outline" className="w-full h-28 rounded-[2rem] border-white/10 bg-white/5 text-white flex flex-col items-center justify-center gap-3 hover:bg-primary/20 transition-all border-none shadow-xl group">
                <div className="size-12 bg-primary/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera className="size-7 text-primary" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest italic text-center">Face Verification</span>
              </Button>
            </Link>
            <Button variant="outline" className="flex-1 h-28 rounded-[2rem] border-white/10 bg-white/5 text-white flex flex-col items-center justify-center gap-3 hover:bg-primary/20 transition-all border-none shadow-xl group">
              <div className="size-12 bg-secondary/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Video className="size-7 text-secondary" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest italic text-center">Video Upload</span>
            </Button>
        </div>
      </header>

      <main className="px-8 space-y-8 pt-8">
        <Button 
          onClick={startStreamProcess} 
          disabled={isTogglingLive} 
          className={cn(
            "w-full h-24 rounded-[3.5rem] font-black text-2xl uppercase tracking-widest gap-4 shadow-2xl transition-all border-none italic text-white", 
            hostProfile?.isLive ? "bg-primary" : "bg-green-600 shadow-green-600/30"
          )}
        >
          {isTogglingLive ? <Loader2 className="size-8 animate-spin" /> : <Power className="size-10" />}
          {hostProfile?.isLive ? "Disconnect" : "Go Live"}
        </Button>

        <section className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center">
                <p className="text-[9px] font-black text-primary uppercase mb-2 tracking-[0.2em]">Viewers</p>
                <div className="flex items-center gap-2">
                  <Star className="size-4 text-amber-400 fill-current" />
                  <span className="text-3xl font-black italic tracking-tighter">{hostProfile?.viewers || 0}</span>
                </div>
            </div>
            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center">
                <p className="text-[9px] font-black text-primary uppercase mb-2 tracking-[0.2em]">Earnings</p>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-secondary" />
                  <span className="text-3xl font-black italic tracking-tighter">{hostProfile?.earnings || 0}</span>
                </div>
            </div>
        </section>

        <AdBanner />
      </main>

      <BottomNav />

      {/* Acceptance Modal */}
      <Dialog open={showRulebook} onOpenChange={setShowRulebook}>
        <DialogContent className="bg-[#2D1B2D] border-white/10 text-white rounded-[3rem] p-8 max-w-[90vw] mx-auto border-none shadow-2xl">
          <DialogHeader className="items-center text-center">
            <div className="size-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 romantic-glow">
              <ShieldCheck className="size-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Safety Rules</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
             <div className="bg-white/5 rounded-2xl p-5 text-[10px] space-y-4 border border-white/10 font-bold uppercase tracking-widest text-slate-300">
               <p className="flex items-start gap-3 text-green-400"><CheckCircle2 className="size-4" /> Public Mode: Lingerie Allowed.</p>
               <p className="flex items-start gap-3 text-red-500"><AlertCircle className="size-4" /> Public Mode: No Full Nudity.</p>
               <p className="flex items-start gap-3 text-blue-400"><Sparkles className="size-4" /> Private Mode: No Restrictions.</p>
             </div>
             <Button onClick={toggleLiveStatus} className="w-full h-16 rounded-2xl romantic-gradient font-black uppercase tracking-widest shadow-xl border-none text-white">Accept & Go Live</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

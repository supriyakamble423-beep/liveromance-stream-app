'use client';

import { useFirebase, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { BottomNav } from "@/components/BottomNav";
import { 
  ShieldCheck, Wallet, Settings, Radio, 
  Lock, Globe, Users, Loader2, Zap, Sparkles, Camera, Power,
  ChevronRight, Share2, MapPin, Save
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
import { doc, serverTimestamp, query, where, orderBy, limit, collection, updateDoc } from "firebase/firestore";
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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editCountry, setEditCountry] = useState("");

  const hostRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'hosts', userId);
  }, [firestore, userId]);

  const { data: hostProfile, isLoading: isProfileLoading } = useDoc(hostRef);

  const msgQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(
      collection(firestore, 'adminMessages'), 
      where('hostId', '==', userId), 
      orderBy('timestamp', 'desc'), 
      limit(1)
    );
  }, [firestore, userId]);

  const { data: adminMessages } = useCollection(msgQuery);
  const latestAdminMsg = adminMessages?.[0];

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
      await updateDoc(hostRef, { isLive: newStatus, updatedAt: serverTimestamp() });
      toast({ title: newStatus ? "Broadcast Active" : "Stream Offline" });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Action failed.' });
    } finally {
      setIsTogglingLive(false);
    }
  };

  const handleOptimization = async () => {
    if (!hostProfile) return;
    setIsOptimizing(true);
    try {
      await aiGuidedHostProfileOptimization({
        profileDescription: hostProfile.bio || "Active streamer.",
        streamTitles: ["Global Vibe"],
        contentStrategy: "High energy interaction."
      });
      toast({ title: "AI Sync Complete" });
    } catch (e) {
      toast({ variant: "destructive", title: "AI Busy" });
    } finally {
      setIsOptimizing(false);
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

  if (isProfileLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

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
                <div className="flex flex-col items-center gap-4">
                  <div className="relative size-32 rounded-[3rem] overflow-hidden border-4 border-primary/30 group">
                    <Image src={hostProfile?.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`} alt="Profile" fill className="object-cover" />
                    <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                      <Camera className="size-8" />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
                  </div>
                </div>
                <div className="space-y-4">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Display Name" className="bg-white/5 border-white/10 rounded-2xl h-14" />
                  <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Bio" className="bg-white/5 border-white/10 rounded-2xl min-h-[120px]" />
                  <Input value={editCountry} onChange={(e) => setEditCountry(e.target.value)} placeholder="Country" className="bg-white/5 border-white/10 rounded-2xl h-14" />
                </div>
                <Button onClick={handleProfileUpdate} disabled={isUpdatingProfile} className="w-full romantic-gradient rounded-2xl h-14 font-black uppercase text-white">
                  {isUpdatingProfile ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />} Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-6 mb-10">
          <div className="relative size-28 rounded-[3rem] overflow-hidden border-4 border-primary shadow-2xl bg-[#3D263D]">
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

        <div className="grid grid-cols-2 gap-5">
          <div className="bg-[#3D263D]/80 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-xl">
            <p className="text-[10px] font-black text-[#FDA4AF]/60 uppercase tracking-[0.2em] mb-2">Earnings</p>
            <div className="flex items-center gap-3">
              <Wallet className="size-6 text-amber-400" />
              <span className="text-3xl font-black tracking-tighter text-white">{hostProfile?.earnings || "0"}</span>
            </div>
          </div>
          <div className="bg-[#3D263D]/80 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-xl">
            <p className="text-[10px] font-black text-[#FDA4AF]/60 uppercase tracking-[0.2em] mb-2">Viewers</p>
            <div className="flex items-center gap-3">
              <Users className="size-6 text-primary" />
              <span className="text-3xl font-black tracking-tighter text-white">{hostProfile?.viewers || "0"}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="px-8 space-y-8">
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#FDA4AF]/60">Broadcast Mode</h3>
            <Badge className={cn("border-none text-[9px] font-black", hostProfile?.streamType === 'public' ? "bg-green-500/20 text-green-400" : "bg-primary/20 text-primary")}>
              {hostProfile?.streamType === 'public' ? 'SFW' : 'EARNING'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={() => updateStreamType('public')} className={cn("h-20 rounded-[2rem] font-black uppercase tracking-widest gap-3 text-xs border-none", hostProfile?.streamType === 'public' ? "bg-green-500 text-white shadow-2xl" : "bg-white/5 text-[#FDA4AF]/60")}>
              <Globe className="size-5" /> Public
            </Button>
            <Button onClick={() => updateStreamType('private')} className={cn("h-20 rounded-[2rem] font-black uppercase tracking-widest gap-3 text-xs border-none", hostProfile?.streamType === 'private' ? "romantic-gradient text-white shadow-2xl" : "bg-white/5 text-[#FDA4AF]/60")}>
              <Lock className="size-5" /> Private
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <Button onClick={toggleLiveStatus} disabled={isTogglingLive} className={cn("w-full h-28 rounded-[3rem] font-black text-3xl uppercase tracking-[0.1em] gap-5 shadow-2xl transition-all border-none text-white", hostProfile?.isLive ? "bg-[#E11D48] hover:bg-[#E11D48]/90" : "bg-green-500 hover:bg-green-600")}>
            {isTogglingLive ? <Loader2 className="size-10 animate-spin" /> : <Power className="size-12" />}
            {hostProfile?.isLive ? "End Stream" : "Start Live"}
          </Button>
          
          {hostProfile?.isLive && (
            <Link href={`/stream/${userId}`} className="block">
              <Button variant="outline" className="w-full h-16 rounded-[2rem] border-primary text-primary font-black uppercase tracking-widest gap-3 shadow-xl bg-primary/5">
                <Radio className="size-6" /> Preview Signal
              </Button>
            </Link>
          )}
        </section>

        <section className="bg-gradient-to-br from-[#E11D48]/10 to-transparent border border-white/5 rounded-[3rem] p-8 space-y-5 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-xl">
              <Sparkles className="size-7 animate-pulse" />
            </div>
            <div>
              <h4 className="text-base font-black uppercase tracking-tight text-white">AI Profile Optimizer</h4>
              <p className="text-[10px] text-[#FDA4AF]/60 font-black uppercase tracking-widest">Meta Sync Active</p>
            </div>
          </div>
          <p className="text-[11px] text-[#FDA4AF]/80 font-bold leading-relaxed uppercase tracking-wide">Boost your Diamond collection efficiency by 40% with AI analysis.</p>
          <Button onClick={handleOptimization} disabled={isOptimizing} className="w-full h-12 rounded-2xl bg-[#E11D48] font-black uppercase text-[10px] tracking-[0.2em] shadow-xl text-white border-none">
            {isOptimizing ? <Loader2 className="animate-spin mr-2" /> : <Zap className="size-4 mr-2" />} Generate Analytics
          </Button>
        </section>

        <AdBanner />
      </main>

      <BottomNav />
    </div>
  );
}

'use client';

import { useFirebase, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { BottomNav } from "@/components/BottomNav";
import { 
  ShieldCheck, Wallet, Settings, Radio, 
  Star, Lock, Globe, Users, Loader2, Zap, Sparkles, Camera, Power, TrendingUp,
  ImagePlus, Video, ChevronRight, Share2, ShieldAlert, AlertTriangle, Repeat,
  User, MapPin, MessageSquare, Save, X
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
import { doc, setDoc, serverTimestamp, query, where, orderBy, limit, collection, updateDoc } from "firebase/firestore";
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

  // Form States
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

  const updateStreamType = async (type: 'public' | 'private' | 'invite-only') => {
    if (!hostRef) return;
    if (!hostProfile?.verified) {
      toast({ variant: 'destructive', title: 'Action Denied', description: 'Face ID required.' });
      return;
    }

    try {
      await updateDoc(hostRef, { streamType: type, updatedAt: serverTimestamp() });
      toast({ 
        title: "Mode Updated", 
        description: type === 'public' ? "SFW Mode: AI auto-cuts nudity." : "Adult Mode: Paid access active." 
      });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Update failed.' });
    }
  };

  const toggleLiveStatus = async () => {
    if (!hostRef || !hostProfile?.verified) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please verify identity first.' });
      return;
    }
    
    setIsTogglingLive(true);
    const newStatus = !hostProfile?.isLive;
    
    try {
      await updateDoc(hostRef, { 
        isLive: newStatus, 
        updatedAt: serverTimestamp(),
        streamType: hostProfile.streamType || 'public' 
      });
      toast({ 
        title: newStatus ? "🚀 BROADCAST ACTIVE" : "STREAM OFFLINE", 
        description: newStatus ? `Mode: ${hostProfile.streamType?.toUpperCase()}` : "Broadcasting terminated." 
      });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Status toggle failed.' });
    } finally {
      setIsTogglingLive(false);
    }
  };

  const handleOptimization = async () => {
    if (!hostProfile) return;
    setIsOptimizing(true);
    try {
      await aiGuidedHostProfileOptimization({
        profileDescription: hostProfile.bio || "Active streamer connecting globally.",
        streamTitles: ["Global Vibe Check", "Late Night Live"],
        contentStrategy: "High-energy interaction and real-time social discovery."
      });
      toast({ title: "AI Optimization Complete", description: "Your strategy has been refined." });
    } catch (e) {
      toast({ variant: "destructive", title: "AI Busy", description: "Please retry in 5s." });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!hostRef || !userId) return;
    setIsUpdatingProfile(true);
    try {
      await updateDoc(hostRef, {
        username: editName || hostProfile?.username,
        bio: editBio || hostProfile?.bio,
        country: editCountry || hostProfile?.country,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Profile Updated", description: "Your public identity has been refreshed." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save profile." });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage || !userId || !hostRef) return;

    setIsUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const photoData = event.target?.result as string;
        const storagePath = `host_profiles/${userId}_${Date.now()}.jpg`;
        const storageRef = ref(storage, storagePath);
        await uploadString(storageRef, photoData, "data_url");
        const downloadURL = await getDownloadURL(storageRef);

        await updateDoc(hostRef, {
          previewImageUrl: downloadURL,
          updatedAt: serverTimestamp()
        });
        toast({ title: "Image Uploaded", description: "Your profile picture is live!" });
      };
      reader.readAsDataURL(file);
    } catch (e) {
      toast({ variant: "destructive", title: "Upload Failed", description: "Check your connection." });
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="size-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-28 max-w-lg mx-auto border-x border-white/10">
      <header className="p-6 pt-12 bg-gradient-to-b from-primary/20 to-transparent">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black tracking-tighter uppercase italic flex items-center gap-2">
             Profile <ChevronRight className="size-5 text-primary" />
          </h1>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full bg-white/5 border border-white/10 hover:bg-primary/20"
                onClick={() => {
                  setEditName(hostProfile?.username || "");
                  setEditBio(hostProfile?.bio || "");
                  setEditCountry(hostProfile?.country || "");
                }}
              >
                <Settings className="size-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-950 border-white/10 text-white rounded-[2.5rem] max-w-[90vw] sm:max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-2">
                  <User className="size-5 text-primary" /> Edit Identity
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative size-28 rounded-[2.5rem] overflow-hidden border-4 border-primary/30 group">
                    <Image 
                      src={hostProfile?.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`} 
                      alt="Profile" 
                      fill 
                      className="object-cover" 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      {isUploadingImage ? <Loader2 className="size-6 animate-spin" /> : <Camera className="size-6" />}
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                    />
                  </div>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Tap to change photo</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Username</label>
                    <Input 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Your display name"
                      className="bg-white/5 border-white/10 rounded-2xl h-12 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Bio / Status</label>
                    <Textarea 
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Tell the world about yourself..."
                      className="bg-white/5 border-white/10 rounded-2xl min-h-[100px] focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Country / Location</label>
                    <Input 
                      value={editCountry}
                      onChange={(e) => setEditCountry(e.target.value)}
                      placeholder="e.g. Brazil 🇧🇷"
                      className="bg-white/5 border-white/10 rounded-2xl h-12 focus-visible:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <DialogClose asChild>
                    <Button variant="ghost" className="flex-1 rounded-2xl h-12 font-black uppercase tracking-widest text-[10px]">Cancel</Button>
                  </DialogClose>
                  <Button 
                    onClick={handleProfileUpdate}
                    disabled={isUpdatingProfile}
                    className="flex-1 romantic-gradient rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] text-white"
                  >
                    {isUpdatingProfile ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
                    Save Profile
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {latestAdminMsg && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl ring-1 ring-red-500/30 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldCheck className="size-4 text-red-500" />
              <span className="text-[10px] font-black uppercase text-red-500 tracking-widest">Urgent Directive</span>
            </div>
            <p className="text-xs text-slate-300 font-bold leading-relaxed italic">
              "{latestAdminMsg.content}"
            </p>
          </div>
        )}

        <div className="flex items-center gap-5 mb-8">
          <div className="relative size-24 rounded-[2.5rem] overflow-hidden border-4 border-primary/30 shadow-[0_0_30px_rgba(137,92,246,0.2)] bg-slate-900">
            <Image 
              src={hostProfile?.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`} 
              alt="Profile" 
              fill 
              className="object-cover" 
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-black tracking-tighter uppercase truncate">@{hostProfile?.username || `HOST_${userId?.slice(0, 4)}`}</h2>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={cn(
                "h-6 text-[9px] px-3 font-black tracking-widest border-none", 
                hostProfile?.verified ? "bg-green-500 text-white" : "bg-white/10 text-slate-500"
              )}>
                {hostProfile?.verified ? "VERIFIED HOST" : "IDENTITY CHECK PENDING"}
              </Badge>
              {hostProfile?.isLive && (
                <Badge className="h-6 text-[9px] px-3 font-black bg-red-600 animate-pulse border-none">LIVE</Badge>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-1">
              <MapPin className="size-3 text-primary" /> {hostProfile?.country || 'Global'}
            </p>
          </div>
        </div>

        {hostProfile?.bio && (
          <div className="mb-8 px-2">
            <p className="text-[11px] text-slate-300 font-medium leading-relaxed italic line-clamp-2">
              "{hostProfile.bio}"
            </p>
          </div>
        )}

        {/* PROMINENT MODE TOGGLE ON DASHBOARD */}
        <section className="mb-8 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Quick Mode Selection</h3>
            {hostProfile?.streamType === 'public' ? (
              <Badge className="bg-green-500/20 text-green-500 border-none text-[8px] font-black">SFW MODE</Badge>
            ) : (
              <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black">EARNING MODE</Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => updateStreamType('public')}
              className={cn(
                "h-16 rounded-2xl font-black uppercase tracking-widest gap-2 text-[10px]",
                hostProfile?.streamType === 'public' ? "bg-green-500 text-white" : "bg-white/5 text-slate-400"
              )}
            >
              <Globe className="size-4" /> Public (SFW)
            </Button>
            <Button
              onClick={() => updateStreamType('private')}
              className={cn(
                "h-16 rounded-2xl font-black uppercase tracking-widest gap-2 text-[10px]",
                hostProfile?.streamType === 'private' ? "bg-primary text-white" : "bg-white/5 text-slate-400"
              )}
            >
              <Lock className="size-4" /> Adult (Paid)
            </Button>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5 backdrop-blur-md">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Earnings</p>
            <div className="flex items-center gap-2">
              <Wallet className="size-5 text-amber-400" />
              <span className="text-2xl font-black tracking-tighter">{hostProfile?.earnings || "0"}</span>
            </div>
          </div>
          <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5 backdrop-blur-md">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Live Feed</p>
            <div className="flex items-center gap-2">
              <Users className="size-5 text-primary" />
              <span className="text-2xl font-black tracking-tighter">{hostProfile?.viewers || "0"}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 space-y-6">
        {hostProfile?.streamType === 'public' && hostProfile?.isLive && (
          <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center gap-3">
             <ShieldAlert className="size-5 text-red-500 animate-pulse" />
             <p className="text-[10px] font-black text-red-500 uppercase leading-tight">AI Active Monitoring: Public streams must remain SFW. Nudity will trigger auto-cut.</p>
          </div>
        )}

        <section className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-[2.5rem] p-6 flex items-center justify-between">
          <div className="space-y-1">
             <h3 className="text-sm font-black uppercase tracking-tight italic">Viral Engine</h3>
             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">A → B Lifetime Residual (1%)</p>
          </div>
          <Link href="/lifetime">
            <Button size="icon" className="rounded-full bg-primary shadow-lg shadow-primary/20">
              <Share2 className="size-5" />
            </Button>
          </Link>
        </section>

        {!hostProfile?.verified ? (
          <section className="bg-primary/20 border border-primary/30 rounded-[2.5rem] p-6 text-center space-y-4 shadow-xl">
            <h3 className="text-xl font-black uppercase tracking-tight">Identity Required</h3>
            <p className="text-xs text-slate-400 font-medium px-4">Verify your face to unlock global streaming privileges and start earning coins.</p>
            <Link href="/host-f" className="block">
              <Button className="w-full h-16 rounded-[1.5rem] bg-primary hover:bg-primary/90 font-black uppercase tracking-widest gap-2 text-white text-base shadow-lg shadow-primary/30">
                <Camera className="size-6" /> Start 1-Sec Face ID
              </Button>
            </Link>
          </section>
        ) : (
          <section className="space-y-4">
            <Button 
              onClick={toggleLiveStatus}
              disabled={isTogglingLive}
              className={cn(
                "w-full h-24 rounded-[2.5rem] font-black text-2xl uppercase tracking-widest gap-4 shadow-2xl transition-all active:scale-95 text-white",
                hostProfile?.isLive 
                  ? "bg-red-600 hover:bg-red-700 shadow-red-500/40" 
                  : "bg-green-500 hover:bg-green-600 shadow-green-500/40"
              )}
            >
              {isTogglingLive ? <Loader2 className="size-8 animate-spin" /> : <Power className="size-9" />}
              {hostProfile?.isLive ? "End Stream" : "Start Live Stream"}
            </Button>
            
            {hostProfile?.isLive && (
              <Link href={`/stream/${userId}`} className="block">
                <Button variant="outline" className="w-full h-16 rounded-2xl border-primary text-primary font-black uppercase tracking-widest gap-3 shadow-lg">
                  <Radio className="size-6" /> Preview Broadcast
                </Button>
              </Link>
            )}
          </section>
        )}

        {/* MEDIA UPLOAD SECTION (For Coins) */}
        <section className="bg-white/5 p-6 rounded-[2.5rem] border border-dashed border-white/10">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Paid Media Marketplace</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-28 rounded-2xl flex flex-col gap-1 border-white/5 bg-white/5 hover:bg-white/10 group transition-all">
              <ImagePlus className="size-7 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-tight">Add Photo</span>
              <span className="text-[9px] font-black text-primary uppercase">Price: 10 Coins</span>
            </Button>
            <Button variant="outline" className="h-28 rounded-2xl flex flex-col gap-1 border-white/5 bg-white/5 hover:bg-white/10 group transition-all">
              <Video className="size-7 text-secondary group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-tight">Add Video</span>
              <span className="text-[9px] font-black text-secondary uppercase">Price: 50 Coins</span>
            </Button>
          </div>
        </section>

        <section className="space-y-4 pb-12">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-2">AI Optimizer</h3>
          <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-[2.5rem] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Sparkles className="size-6 text-primary animate-pulse" />
              <h4 className="text-sm font-black uppercase tracking-tight">Profile Performance Tuner</h4>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed uppercase">
              Analyze your broadcast metadata to maximize engagement and diamond collection efficiency.
            </p>
            <Button 
              onClick={handleOptimization}
              disabled={isOptimizing}
              className="w-full h-12 rounded-xl bg-primary font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 text-white"
            >
              {isOptimizing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Zap className="size-4 mr-2" />}
              Generate Analysis
            </Button>
          </div>
        </section>

        {/* Adsterra Banner at the bottom of the Profile */}
        <AdBanner />
      </main>

      <BottomNav />
    </div>
  );
}

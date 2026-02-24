
'use client';

import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { BottomNav } from "@/components/BottomNav";
import { 
  ShieldCheck, Settings, Radio, 
  Power, ChevronRight, Save, Clock, Target, 
  Activity, Zap, ShieldAlert, AlertCircle, CheckCircle2, Loader2, Wallet
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
  DialogDescription,
  DialogFooter
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
  const userId = user?.uid;
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

  const { data: hostProfile, isLoading: isProfileLoading } = useDoc(hostRef);

  const startStreamProcess = () => {
    if (hostProfile?.isLive) {
      toggleLiveStatus();
    } else {
      setShowRulebook(true);
    }
  };

  const toggleLiveStatus = async () => {
    if (!hostRef || !firestore || !userId) return;
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

  if (isUserLoading || isProfileLoading || !areServicesAvailable) {
    return (
      <div className="min-h-screen bg-[#2D1B2D] flex flex-col items-center justify-center space-y-8 mesh-gradient">
        <div className="relative size-40 animate-pulse logo-glow">
           <Image src="/logo.png" alt="Loading" fill className="object-contain" onError={(e) => { (e.target as any).src = "https://placehold.co/400x400/E11D48/white?text=GL" }} />
        </div>
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Initializing Node...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white pb-32 max-w-lg mx-auto border-x border-white/5 mesh-gradient">
      <header className="p-8 pt-16 bg-gradient-to-b from-[#E11D48]/15 to-transparent rounded-b-[4rem]">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-black tracking-tighter uppercase italic flex items-center gap-2">
             OVERVIEW <ChevronRight className="size-6 text-primary" />
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
            <h2 className="text-3xl font-black tracking-tighter uppercase truncate text-white italic">@{hostProfile?.username || 'Host'}</h2>
            <div className="flex items-center gap-3 mt-3">
              <Badge className={cn("h-7 text-[10px] px-4 font-black tracking-widest border-none shadow-lg", hostProfile?.verified ? "bg-green-500 text-white" : "bg-white/10")}>
                {hostProfile?.verified ? "VERIFIED" : "PENDING"}
              </Badge>
              {hostProfile?.isLive && <Badge className="h-7 text-[10px] px-4 font-black bg-[#E11D48] animate-pulse shadow-[0_0_15px_#E11D48] border-none">LIVE NOW</Badge>}
            </div>
          </div>
        </div>

        <section className="grid grid-cols-2 gap-4">
            <div className="bg-[#3D263D]/80 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-xl">
                <p className="text-[10px] font-black text-[#FDA4AF]/60 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                    <Activity className="size-3 text-blue-400" /> Minutes
                </p>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black tracking-tighter text-white">{hostProfile?.totalStreamMinutes || 0}</span>
                </div>
            </div>
            <Link href="/host-p/payout" className="block">
              <div className="bg-[#3D263D]/80 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-xl hover:border-primary/40 transition-all">
                  <p className="text-[10px] font-black text-[#FDA4AF]/60 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                      <Zap className="size-3 text-amber-400 fill-current" /> Earnings
                  </p>
                  <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black tracking-tighter text-white">{Math.floor(hostProfile?.earnings || 0)}</span>
                      <span className="text-amber-400">💎</span>
                  </div>
              </div>
            </Link>
        </section>
      </header>

      <main className="px-8 space-y-10 pt-10">
        <section className="space-y-4">
          <Button 
            onClick={startStreamProcess} 
            disabled={isTogglingLive} 
            className={cn(
              "w-full h-28 rounded-[3.5rem] font-black text-3xl uppercase tracking-[0.1em] gap-5 shadow-2xl transition-all border-none text-white italic", 
              hostProfile?.isLive ? "bg-[#E11D48]" : "bg-green-500"
            )}
          >
            {isTogglingLive ? <Loader2 className="size-10 animate-spin" /> : <Power className="size-12" />}
            {hostProfile?.isLive ? "End Stream" : "Go Live Now"}
          </Button>

          <Dialog open={showRulebook} onOpenChange={setShowRulebook}>
            <DialogContent className="bg-[#2D1B2D] border-white/10 text-white rounded-[3rem] max-w-[90vw] mx-auto p-8 overflow-hidden">
              <DialogHeader className="items-center text-center">
                <div className="size-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <ShieldAlert className="size-8 text-primary" />
                </div>
                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Public Rulebook</DialogTitle>
                <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Compliance is mandatory for all hosts.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <div className="bg-white/5 rounded-2xl p-5 text-[10px] text-left space-y-4 border border-white/10">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="size-4 text-green-400 mt-0.5 shrink-0" />
                    <p className="leading-relaxed">Allowed: Bra, Panty, Bikini, Dance, and Chatting.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="size-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="leading-relaxed text-red-400 font-black">STRICTLY BANNED: Full nudity, private parts, or sexual acts in Public mode.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="size-4 text-amber-400 mt-0.5 shrink-0" />
                    <p className="leading-relaxed opacity-70 italic">3 User reports for nudity will automatically terminate your session.</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 pt-2">
                  <Button onClick={toggleLiveStatus} className="h-16 rounded-2xl romantic-gradient font-black uppercase tracking-widest text-white shadow-xl">
                    I Accept / Go Live
                  </Button>
                  <Button variant="ghost" onClick={() => setShowRulebook(false)} className="text-[10px] font-black text-slate-500 uppercase">
                    Decline / Exit
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {hostProfile?.isLive && (
            <Link href={`/stream/${userId}`} className="block">
              <Button variant="outline" className="w-full h-16 rounded-[2rem] border-primary text-primary font-black uppercase tracking-widest gap-3 shadow-xl bg-primary/5">
                <Radio className="size-6" /> Preview Stream
              </Button>
            </Link>
          )}
        </section>

        <section className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
            <Target className="size-4" /> Daily Tasks
          </h3>
          <div className="space-y-4">
            {[
              { id: 1, title: "Marathon Stream", desc: "Stream for 30 mins", target: 30, current: hostProfile?.totalStreamMinutes || 0, reward: "10 Coins", icon: Clock, color: "text-blue-400" },
              { id: 2, title: "Fan Favorite", desc: "Receive 5 Gifts", target: 5, current: hostProfile?.giftsReceived || 0, reward: "Premium Badge", icon: Zap, color: "text-pink-400" },
              { id: 3, title: "Network Architect", desc: "Invite 2 New Users", target: 2, current: hostProfile?.referralCount || 0, reward: "20% Extra Comm.", icon: Radio, color: "text-amber-400" }
            ].map((task) => {
              const progress = Math.min((task.current / task.target) * 100, 100);
              return (
                <div key={task.id} className="bg-[#3D263D]/60 border border-white/5 rounded-[2.5rem] p-6">
                  <div className="flex items-center gap-5">
                    <div className={cn("size-12 rounded-2xl flex items-center justify-center bg-white/5", task.color)}>
                      <task.icon className="size-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-black uppercase text-white italic">{task.title}</h4>
                        <span className="text-[10px] font-black text-primary uppercase">{task.reward}</span>
                      </div>
                      <div className="w-full h-1.5 bg-black/20 rounded-full mt-3 overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <AdBanner />
      </main>

      <BottomNav />
    </div>
  );
}

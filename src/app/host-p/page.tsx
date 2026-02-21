'use client';

import { useFirebase, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { BottomNav } from "@/components/BottomNav";
import { 
  ShieldCheck, Wallet, Settings, Radio, 
  Star, Lock, Globe, Users, Loader2, Zap, Sparkles, Camera, Power, TrendingUp, Gift as GiftIcon, Copy,
  ImagePlus, Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { doc, setDoc, serverTimestamp, query, where, orderBy, limit, collection } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { aiGuidedHostProfileOptimization } from "@/ai/flows/ai-guided-host-profile-optimization-flow";
import { useState } from "react";

export default function HostProfileDashboard() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const userId = user?.uid;
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isTogglingLive, setIsTogglingLive] = useState(false);

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

  const copyReferralLink = () => {
    const link = `stream.ai/ref/${userId?.slice(0, 8)}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link Copied", description: "Your unique referral link is ready to share." });
  };

  const updateStreamType = async (type: 'public' | 'private' | 'invite-only') => {
    if (!hostRef) return;
    if (!hostProfile?.verified) {
      toast({ 
        variant: 'destructive', 
        title: 'Verification Required', 
        description: 'Please complete face ID verification first.' 
      });
      return;
    }

    try {
      await setDoc(hostRef, { 
        streamType: type,
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast({ title: "Settings Updated", description: `Privacy set to ${type}` });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update settings.' });
    }
  };

  const toggleLiveStatus = async () => {
    if (!hostRef || !hostProfile?.verified) {
      toast({ variant: 'destructive', title: 'Error', description: 'Verify identity to go live.' });
      return;
    }
    
    setIsTogglingLive(true);
    const newStatus = !hostProfile?.isLive;
    
    try {
      await setDoc(hostRef, {
        isLive: newStatus,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      toast({ 
        title: newStatus ? "🚀 You are LIVE!" : "Stream Ended", 
        description: newStatus ? "Your stream is now visible globally." : "Stream has been closed." 
      });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to toggle status.' });
    } finally {
      setIsTogglingLive(false);
    }
  };

  const handleOptimization = async () => {
    if (!hostProfile) return;
    setIsOptimizing(true);
    try {
      await aiGuidedHostProfileOptimization({
        profileDescription: hostProfile.bio || "Passionate streamer looking to connect with the global community.",
        streamTitles: ["Daily Vibe Check", "Late Night Social Discovery"],
        contentStrategy: "Engaging with viewers through high-energy, real-time conversation and entertainment."
      });
      toast({
        title: "AI Optimizer Active",
        description: "Your content strategy has been updated with high-engagement suggestions.",
      });
    } catch (e) {
      toast({ variant: "destructive", title: "AI Busy", description: "System is busy. Please try again in 5 seconds." });
    } finally {
      setIsOptimizing(false);
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
    <div className="min-h-screen bg-black text-white pb-24 max-w-lg mx-auto border-x border-white/10">
      <header className="p-6 pt-12 bg-gradient-to-b from-primary/15 to-transparent">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black tracking-tighter uppercase italic">Profile</h1>
          <Button variant="ghost" size="icon" className="rounded-full bg-white/5 border border-white/10">
            <Settings className="size-5" />
          </Button>
        </div>
        
        {latestAdminMsg && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl ring-1 ring-red-500/30">
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldCheck className="size-4 text-red-500" />
              <span className="text-[10px] font-black uppercase text-red-500 tracking-widest">System Message</span>
            </div>
            <p className="text-xs text-slate-300 font-bold leading-relaxed">
              "{latestAdminMsg.content}"
            </p>
          </div>
        )}

        <div className="flex items-center gap-5 mb-8">
          <div className="relative size-24 rounded-[2.5rem] overflow-hidden border-4 border-primary/30 shadow-2xl bg-slate-900">
            <Image 
              src={hostProfile?.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`} 
              alt="Profile" 
              fill 
              className="object-cover" 
            />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black tracking-tighter">@{user?.displayName || `HOST_${userId?.slice(0, 4)}`}</h2>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={cn(
                "h-6 text-[9px] px-3 font-black tracking-widest border-none", 
                hostProfile?.verified ? "bg-green-500 text-white" : "bg-white/10 text-slate-500"
              )}>
                {hostProfile?.verified ? "IDENTITY VERIFIED" : "UNVERIFIED"}
              </Badge>
              {hostProfile?.isLive && (
                <Badge className="h-6 text-[9px] px-3 font-black bg-red-600 animate-pulse border-none">LIVE NOW</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-5 rounded-[1.8rem] border border-white/5 backdrop-blur-sm">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Diamonds</p>
            <div className="flex items-center gap-2">
              <Wallet className="size-5 text-amber-400" />
              <span className="text-2xl font-black tracking-tighter">{hostProfile?.earnings || "0"}</span>
            </div>
          </div>
          <div className="bg-white/5 p-5 rounded-[1.8rem] border border-white/5 backdrop-blur-sm">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Live Viewers</p>
            <div className="flex items-center gap-2">
              <Users className="size-5 text-primary" />
              <span className="text-2xl font-black tracking-tighter">{hostProfile?.viewers || "0"}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 space-y-6">
        {/* MEDIA UPLOAD SECTION (For Coins) */}
        <section className="bg-white/5 p-6 rounded-[2.5rem] border border-dashed border-white/10">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Paid Media Gallery</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-24 rounded-2xl flex flex-col gap-1 border-white/5 bg-white/5 hover:bg-white/10 group transition-all">
              <ImagePlus className="size-6 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-tight">Add Photo</span>
              <span className="text-[9px] font-bold text-primary">Price: 10 Coins</span>
            </Button>
            <Button variant="outline" className="h-24 rounded-2xl flex flex-col gap-1 border-white/5 bg-white/5 hover:bg-white/10 group transition-all">
              <Video className="size-6 text-secondary group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-tight">Add Video</span>
              <span className="text-[9px] font-bold text-secondary">Price: 50 Coins</span>
            </Button>
          </div>
        </section>

        {!hostProfile?.verified ? (
          <section className="bg-primary/20 border border-primary/30 rounded-[2.5rem] p-6 text-center space-y-4 shadow-[0_0_30px_rgba(137,92,246,0.1)]">
            <h3 className="text-xl font-black uppercase tracking-tight">Identity Required</h3>
            <p className="text-xs text-slate-400 font-medium">Verify your face to unlock global streaming privileges and start earning.</p>
            <Link href="/host-f" className="block">
              <Button className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 font-black uppercase tracking-widest gap-2 text-white">
                <Camera className="size-5" /> Start 1-Sec Selfie
              </Button>
            </Link>
          </section>
        ) : (
          <section className="space-y-4">
            <Button 
              onClick={toggleLiveStatus}
              disabled={isTogglingLive}
              className={cn(
                "w-full h-20 rounded-[2rem] font-black text-xl uppercase tracking-widest gap-3 shadow-2xl transition-all active:scale-95 text-white",
                hostProfile?.isLive 
                  ? "bg-red-600 hover:bg-red-700 shadow-red-500/20" 
                  : "bg-green-500 hover:bg-green-600 shadow-green-500/20"
              )}
            >
              {isTogglingLive ? <Loader2 className="size-6 animate-spin" /> : <Power className="size-7" />}
              {hostProfile?.isLive ? "End Stream" : "Start Live Stream"}
            </Button>
            
            {hostProfile?.isLive && (
              <Link href={`/stream/${userId}`} className="block">
                <Button variant="outline" className="w-full h-14 rounded-2xl border-primary text-primary font-black uppercase tracking-widest gap-2">
                  <Radio className="size-5" /> View My Stream
                </Button>
              </Link>
            )}
          </section>
        )}

        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-2">Privacy Settings</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'public', label: 'Public', icon: Globe },
              { id: 'private', label: 'Private', icon: Lock },
              { id: 'invite-only', label: 'Invite', icon: Star }
            ].map((mode) => (
              <Button
                key={mode.id}
                onClick={() => updateStreamType(mode.id as any)}
                variant={hostProfile?.streamType === mode.id ? 'default' : 'secondary'}
                className={cn(
                  "h-20 flex flex-col items-center justify-center gap-2 rounded-3xl border border-white/5",
                  hostProfile?.streamType === mode.id ? "bg-primary border-primary/50 shadow-lg shadow-primary/20 text-white" : "bg-white/5"
                )}
              >
                <mode.icon className="size-5" />
                <span className="text-[9px] font-black uppercase tracking-widest">{mode.label}</span>
              </Button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-2">AI Optimizer Hub</h3>
          <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-[2rem] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Sparkles className="size-6 text-primary animate-pulse" />
              <h4 className="text-sm font-black uppercase tracking-tight">Smart Profile Optimizer</h4>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed uppercase">
              Analyze your stream data to maximize viewer retention and diamond earnings.
            </p>
            <Button 
              onClick={handleOptimization}
              disabled={isOptimizing}
              className="w-full h-12 rounded-xl bg-primary font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 text-white"
            >
              {isOptimizing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Zap className="size-4 mr-2" />}
              Generate Optimization
            </Button>
          </div>
        </section>

        <section className="space-y-4 pb-10">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-2">Network Commission Dashboard</h3>
          <div className="bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/20 rounded-[2.5rem] p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GiftIcon className="size-6 text-secondary" />
                <h4 className="text-sm font-black uppercase tracking-tight">Referral Program</h4>
              </div>
              <Badge variant="secondary" className="bg-secondary/20 text-secondary border-none text-[9px] font-black uppercase px-3 py-1">1% LIFETIME</Badge>
            </div>

            <p className="text-[11px] text-slate-400 font-medium leading-relaxed uppercase">
              Earn 1% of every diamond your referred hosts collect. Start building your legacy by onboarding new talent.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                <p className="text-2xl font-black italic tracking-tighter text-white">4.8k</p>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total Invites</p>
              </div>
              <div className="bg-black/20 p-4 rounded-2xl border border-white/5 text-right">
                <p className="text-2xl font-black text-green-400">$2,140</p>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Earned Comm.</p>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Your Unique Invite Node</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 flex items-center h-12">
                   <span className="text-[10px] font-mono text-secondary truncate">stream.ai/ref/{userId?.slice(0, 8)}</span>
                </div>
                <Button onClick={copyReferralLink} size="icon" className="size-12 rounded-xl bg-secondary hover:bg-secondary/90 shrink-0 text-white">
                  <Copy className="size-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

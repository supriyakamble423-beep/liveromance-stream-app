'use client';

import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { BottomNav } from "@/components/BottomNav";
import { 
  Settings, Power, ChevronRight, Wallet, Loader2, Camera, Video, LogOut, ShieldCheck, Mail, Zap, RefreshCw, AlertCircle, UserCheck, LogIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { initiateGoogleSignIn } from "@/firebase/non-blocking-login";
import { signOut } from "firebase/auth";
import { ShareKit } from "@/components/ShareKit";

export default function HostProfileDashboard() {
  const { firestore, user, auth, areServicesAvailable, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  const userId = user?.uid || 'simulate_host';
  
  const [isTogglingLive, setIsTogglingLive] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [editName, setEditName] = useState("");
  const [loadTimeout, setLoadTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoadTimeout(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  const hostRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'hosts', userId);
  }, [firestore, userId]);

  const { data: hostProfile, isLoading: isProfileLoading } = useDoc(hostRef);

  useEffect(() => {
    if (hostProfile) {
      setEditName(hostProfile.username || "");
    }
  }, [hostProfile]);

  const toggleLiveStatus = async () => {
    if (!areServicesAvailable || !user) {
      toast({ title: "Simulation Node Active", description: "Firebase offline. Launching mock broadcast." });
      setIsTogglingLive(true);
      setTimeout(() => router.push(`/stream/simulate_host`), 1000);
      return;
    }

    if (!hostProfile?.verified && userId !== 'simulate_host') {
      toast({ variant: "destructive", title: "Identity Scan Required", description: "Complete Face Verification to stream." });
      router.push('/host-f');
      return;
    }

    setIsTogglingLive(true);
    try {
      await setDoc(hostRef!, {
        userId,
        isLive: true,
        updatedAt: serverTimestamp(),
        username: editName || hostProfile?.username || user.displayName || "New Host",
        previewImageUrl: hostProfile?.previewImageUrl || user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        streamType: 'public',
        verified: hostProfile?.verified || true 
      }, { merge: true });

      toast({ title: "Signal Active", description: "Establishing broadcast node..." });
      router.push(`/stream/${userId}`);
    } catch (err) {
      console.error("Grid broadcast error:", err);
      toast({ title: "Simulation Fallback", description: "Database busy. Entering simulation mode." });
      router.push(`/stream/simulate_host`);
    } finally {
      setIsTogglingLive(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) {
      toast({ variant: "destructive", title: "Service Unavailable", description: "Firebase not initialized." });
      return;
    }
    setIsAuthLoading(true);
    try {
      await initiateGoogleSignIn(auth);
      toast({ title: "Identity Tunnel Secured", description: "Successfully logged in with Google." });
    } catch (err: any) {
      console.error("Auth Error:", err);
      let msg = "Check your connection and try again.";
      if (err.code === 'auth/popup-blocked') msg = "Popup blocked! Please allow popups for this site.";
      if (err.code === 'auth/cancelled-popup-request') msg = "Login cancelled.";
      
      toast({ 
        variant: "destructive", 
        title: "Auth Failed", 
        description: msg 
      });
    } finally {
      setIsAuthLoading(false);
    }
  };

  if ((isProfileLoading || isUserLoading) && !loadTimeout) {
    return (
      <div className="min-h-screen bg-[#2D1B2D] flex flex-col items-center justify-center space-y-6">
        <div className="relative size-24 animate-pulse">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl" />
          <div className="relative size-full bg-primary/10 border-4 border-primary rounded-full flex items-center justify-center">
            <Loader2 className="size-10 text-primary animate-spin" />
          </div>
        </div>
        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Establishing Signal...</p>
      </div>
    );
  }

  const isAnonymous = user?.isAnonymous || !user;

  return (
    <div className="min-h-screen bg-background text-white pb-32 max-w-lg mx-auto border-x border-white/5 mesh-gradient screen-guard-active">
      {!areServicesAvailable && (
        <div className="mx-6 mt-6 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-center gap-3">
          <AlertCircle className="size-4 text-amber-500 shrink-0" />
          <p className="text-[9px] font-black uppercase text-amber-200 tracking-widest">Simulation Mode: Features available offline</p>
        </div>
      )}

      <header className="p-8 pt-10 bg-gradient-to-b from-primary/15 to-transparent rounded-b-[3.5rem]">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black tracking-tighter uppercase italic">CONTROL</h1>
          <div className="flex items-center gap-2">
            <Link href="/host-p/payout"><Button variant="ghost" size="icon" className="rounded-full bg-white/5 border border-white/10 size-11"><Wallet className="size-5 text-primary" /></Button></Link>
            <Dialog>
              <DialogTrigger asChild><Button variant="ghost" size="icon" className="rounded-full bg-white/5 border border-white/10 size-11"><Settings className="size-5 text-white/60" /></Button></DialogTrigger>
              <DialogContent className="bg-[#2D1B2D] border-white/10 text-white rounded-[2.5rem] p-8 max-w-[90vw] mx-auto shadow-2xl">
                <DialogHeader className="items-center mb-6">
                  <DialogTitle className="text-xl font-black uppercase italic tracking-widest text-primary">System Config</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {user && !user.isAnonymous && (
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
                      <div className="size-10 rounded-full overflow-hidden relative">
                        <Image src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="Avatar" fill />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black truncate">{user.email}</p>
                        <p className="text-[8px] text-primary font-black uppercase">Verified Signal</p>
                      </div>
                      <Button onClick={() => signOut(auth!)} variant="ghost" size="icon" className="text-red-400 hover:bg-red-500/10"><LogOut size={18} /></Button>
                    </div>
                  )}

                  {!areServicesAvailable && (
                    <p className="text-[10px] text-center font-black text-amber-500 uppercase tracking-widest">Connect to Wi-Fi for Auth</p>
                  )}

                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Profile Tuner</p>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Node Alias" className="bg-white/5 border-white/10 h-12 rounded-xl" />
                    <Button className="w-full h-12 romantic-gradient rounded-xl font-black uppercase">Save Configuration</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* --- IDENTITY TUNNEL SECTION --- */}
        {isAnonymous && areServicesAvailable && (
          <div className="mb-8 p-6 bg-primary/10 border border-primary/20 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
              <ShieldCheck className="size-16" />
            </div>
            <div className="relative z-10">
              <h3 className="text-sm font-black uppercase tracking-widest mb-1 italic">Identity Tunnel Open</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase mb-4 leading-relaxed">
                Connect your Google account to secure your earnings <br/>and unlock private broadcasting nodes.
              </p>
              <Button 
                onClick={handleGoogleLogin} 
                disabled={isAuthLoading}
                className="w-full h-12 bg-white text-black hover:bg-slate-100 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl border-none"
              >
                {isAuthLoading ? <Loader2 className="size-4 animate-spin" /> : <LogIn size={16} />}
                Connect with Google
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-5 mb-8">
          <div className="relative size-24 rounded-[2.5rem] overflow-hidden border-4 border-primary bg-slate-900 shadow-2xl">
            <Image src={hostProfile?.previewImageUrl || user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`} alt="Profile" fill className="object-cover" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black tracking-tighter uppercase italic truncate">@{hostProfile?.username || user?.displayName || (userId === 'simulate_host' ? 'SimNode' : 'New Node')}</h2>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={cn("h-6 text-[9px] font-black", (hostProfile?.verified || !areServicesAvailable) ? "bg-green-500 text-white" : "bg-white/10 text-white")}>{(hostProfile?.verified || !areServicesAvailable) ? "VERIFIED" : "PENDING"}</Badge>
              {hostProfile?.isLive && <Badge className="h-6 text-[9px] font-black bg-primary text-white animate-pulse">ON AIR</Badge>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <Link href="/host-f" className="flex-1">
              <Button variant="outline" className="w-full h-28 rounded-[2rem] bg-white/5 text-white flex flex-col items-center justify-center gap-2 border-none ring-1 ring-white/10 hover:ring-primary/40 transition-all">
                <Camera className="size-7 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest italic">Identity Scan</span>
              </Button>
            </Link>
            <Button variant="outline" className="flex-1 h-28 rounded-[2rem] bg-white/5 text-white flex flex-col items-center justify-center gap-2 border-none ring-1 ring-white/10">
              <Video className="size-7 text-secondary" />
              <span className="text-[10px] font-black uppercase tracking-widest italic">Node Logic</span>
            </Button>
        </div>
      </header>

      <main className="px-8 space-y-10 pt-8">
        <Button onClick={toggleLiveStatus} disabled={isTogglingLive} className={cn("w-full h-24 rounded-[3.5rem] font-black text-2xl uppercase italic text-white shadow-2xl transition-all active:scale-95", isTogglingLive ? "bg-slate-800" : "bg-primary shadow-primary/40")}>
          {isTogglingLive ? <Loader2 className="size-8 animate-spin" /> : <Power className="size-10" />}
          {isTogglingLive ? "Connecting..." : "BROADCAST"}
        </Button>

        <ShareKit hostId={userId} username={hostProfile?.username || user?.displayName || "HOST"} />
      </main>
      <BottomNav />
    </div>
  );
}

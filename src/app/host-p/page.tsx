'use client';

import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { BottomNav } from "@/components/BottomNav";
import { 
  Settings, Power, Wallet, Loader2, Camera, Video, LogOut, ShieldCheck, Zap, AlertCircle, LogIn, UserCheck
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

export default function HostProfileDashboard() {
  const { firestore, user, auth, areServicesAvailable, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  
  const [isTogglingLive, setIsTogglingLive] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [editName, setEditName] = useState("");

  const userId = user?.uid;
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

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setIsAuthLoading(true);
    try {
      await initiateGoogleSignIn(auth);
      toast({ title: "Signal Secured", description: "Identity tunnel opened successfully." });
    } catch (err) {
      toast({ variant: "destructive", title: "Auth Error", description: "Failed to connect identity." });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const toggleLiveStatus = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Login Required", description: "Hosts must secure identity to broadcast." });
      return;
    }

    if (!hostProfile?.verified) {
      toast({ variant: "destructive", title: "Identity Scan Needed", description: "Complete Face Verification to start signal." });
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
        verified: true 
      }, { merge: true });

      router.push(`/stream/${userId}`);
    } catch (err) {
      toast({ title: "System Busy", description: "Directing to backup node..." });
      router.push(`/stream/simulate_host`);
    } finally {
      setIsTogglingLive(false);
    }
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="h-screen bg-[#2D1B2D] flex flex-col items-center justify-center space-y-6">
        <Loader2 className="size-10 text-primary animate-spin" />
        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">Syncing Hub...</p>
      </div>
    );
  }

  // Gateway for Non-Logged In Users
  if (!user || user.isAnonymous) {
    return (
      <div className="min-h-screen bg-background text-white pb-32 max-w-lg mx-auto border-x border-white/5 flex flex-col items-center justify-center p-8 text-center space-y-8 mesh-gradient">
        <div className="size-24 rounded-[2.5rem] bg-primary/10 border border-primary/20 flex items-center justify-center romantic-glow mb-4">
          <ShieldCheck className="size-12 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">Become a <span className="text-primary">Host</span></h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
            Login to start broadcasting, earn diamonds, and unlock 1% lifetime commissions.
          </p>
        </div>
        <Button 
          onClick={handleGoogleLogin}
          disabled={isAuthLoading}
          className="w-full h-16 romantic-gradient rounded-2xl font-black uppercase tracking-widest shadow-2xl gap-3"
        >
          {isAuthLoading ? <Loader2 className="animate-spin" /> : <LogIn className="size-6" />}
          Continue with Google
        </Button>
        <p className="text-[9px] text-slate-600 font-bold uppercase">Viewers don't need to login to watch.</p>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white pb-32 max-w-lg mx-auto border-x border-white/5 mesh-gradient screen-guard-active">
      <header className="p-8 pt-10 bg-gradient-to-b from-primary/15 to-transparent rounded-b-[3.5rem]">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black tracking-tighter uppercase italic">CONTROL</h1>
          <div className="flex items-center gap-2">
            <Link href="/host-p/payout"><Button variant="ghost" size="icon" className="rounded-full bg-white/5 border border-white/10 size-11"><Wallet className="size-5 text-primary" /></Button></Link>
            <Dialog>
              <DialogTrigger asChild><Button variant="ghost" size="icon" className="rounded-full bg-white/5 border border-white/10 size-11"><Settings className="size-5 text-white/60" /></Button></DialogTrigger>
              <DialogContent className="bg-[#2D1B2D] border-white/10 text-white rounded-[2.5rem] p-8 max-w-[90vw] mx-auto">
                <DialogHeader className="items-center mb-6">
                  <DialogTitle className="text-xl font-black uppercase italic tracking-widest text-primary">System Config</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
                    <div className="size-10 rounded-full overflow-hidden relative">
                      <Image src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="Avatar" fill />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-black truncate">{user.email}</p>
                      <p className="text-[8px] text-primary font-black uppercase">Active Signature</p>
                    </div>
                    <Button onClick={() => signOut(auth!)} variant="ghost" size="icon" className="text-red-400"><LogOut size={18} /></Button>
                  </div>
                  <div className="space-y-3">
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Node Alias" className="bg-white/5 border-white/10 h-12 rounded-xl" />
                    <Button className="w-full h-12 romantic-gradient rounded-xl font-black uppercase">Save Configuration</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center gap-5 mb-8">
          <div className="relative size-24 rounded-[2.5rem] overflow-hidden border-4 border-primary bg-slate-900 shadow-2xl">
            <Image src={hostProfile?.previewImageUrl || user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`} alt="Profile" fill className="object-cover" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black tracking-tighter uppercase italic truncate">@{hostProfile?.username || user?.displayName || 'New Node'}</h2>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={cn("h-6 text-[9px] font-black", hostProfile?.verified ? "bg-green-500" : "bg-white/10")}>{hostProfile?.verified ? "VERIFIED" : "PENDING"}</Badge>
              {hostProfile?.isLive && <Badge className="h-6 text-[9px] font-black bg-primary animate-pulse">ON AIR</Badge>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <Link href="/host-f" className="flex-1">
              <Button variant="outline" className="w-full h-28 rounded-[2rem] bg-white/5 text-white flex flex-col items-center justify-center gap-2 border-none ring-1 ring-white/10">
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
        <Button onClick={toggleLiveStatus} disabled={isTogglingLive} className={cn("w-full h-24 rounded-[3.5rem] font-black text-2xl uppercase italic text-white shadow-2xl transition-all", isTogglingLive ? "bg-slate-800" : "bg-primary shadow-primary/40")}>
          {isTogglingLive ? <Loader2 className="size-8 animate-spin" /> : <Power className="size-10" />}
          {isTogglingLive ? "Connecting..." : "GO LIVE"}
        </Button>
      </main>
      <BottomNav />
    </div>
  );
}

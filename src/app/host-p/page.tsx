'use client';

import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { BottomNav } from "@/components/BottomNav";
import { 
  Settings, Power, ChevronRight, Wallet, Loader2, Camera, Video, LogOut, UserPlus, LogIn, ShieldCheck, Mail
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
import { initiateEmailSignIn, initiateEmailSignUp, initiateGoogleSignIn } from "@/firebase/non-blocking-login";
import { signOut } from "firebase/auth";

export default function HostProfileDashboard() {
  const { firestore, user, auth, areServicesAvailable } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  const userId = user?.uid || 'simulate_host';
  
  const [isTogglingLive, setIsTogglingLive] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");

  const hostRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'hosts', userId);
  }, [firestore, userId]);

  const { data: hostProfile } = useDoc(hostRef);

  useEffect(() => {
    if (hostProfile) {
      setEditName(hostProfile.username || "");
      setEditBio(hostProfile.bio || "");
    }
  }, [hostProfile]);

  const toggleLiveStatus = async () => {
    if (!hostProfile?.verified && areServicesAvailable) {
      toast({ variant: "destructive", title: "Identity Scan Required", description: "Complete Face Verification to stream." });
      router.push('/host-f');
      return;
    }

    setIsTogglingLive(true);
    const newStatus = !hostProfile?.isLive;
    try {
      await setDoc(hostRef!, {
        userId,
        isLive: newStatus,
        updatedAt: serverTimestamp(),
        username: editName || hostProfile?.username || "New Host",
        previewImageUrl: hostProfile?.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        streamType: hostProfile?.streamType || 'public',
        verified: hostProfile?.verified || false
      }, { merge: true });

      if (newStatus) {
        toast({ title: "Signal Active" });
        router.push(`/stream/${userId}`);
      } else {
        toast({ title: "Signal Cut" });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Grid Error' });
    } finally {
      setIsTogglingLive(false);
    }
  };

  const handleGoogleLogin = () => {
    if (!auth) return;
    setIsAuthLoading(true);
    initiateGoogleSignIn(auth)
      .then(() => toast({ title: "Access Granted" }))
      .catch((err: any) => toast({ variant: "destructive", title: "Auth Failed" }))
      .finally(() => setIsAuthLoading(false));
  };

  return (
    <div className="min-h-screen bg-background text-white pb-32 max-w-lg mx-auto border-x border-white/5 mesh-gradient">
      <header className="p-8 pt-10 bg-gradient-to-b from-primary/15 to-transparent rounded-b-[3.5rem]">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black tracking-tighter uppercase italic">CONTROL</h1>
          <div className="flex items-center gap-2">
            <Link href="/host-p/payout"><Button variant="ghost" size="icon" className="rounded-full bg-white/5 border border-white/10 size-11"><Wallet className="size-5 text-primary" /></Button></Link>
            <Dialog>
              <DialogTrigger asChild><Button variant="ghost" size="icon" className="rounded-full bg-white/5 border border-white/10 size-11"><Settings className="size-5 text-white/60" /></Button></DialogTrigger>
              <DialogContent className="bg-[#2D1B2D] border-white/10 text-white rounded-[2.5rem] p-8 max-w-[90vw] mx-auto shadow-2xl">
                <DialogHeader className="items-center mb-6">
                  <div className="relative h-20 w-full mb-4 drop-shadow-[0_0_25px_rgba(225,29,72,0.5)]">
                    <Image 
                      src="/logo.png?v=2" 
                      alt="Logo" 
                      fill 
                      className="object-contain logo-glow" 
                      onError={(e) => { (e.target as any).src = "https://placehold.co/400x120/E11D48/white?text=GLOBAL+LOVE" }}
                    />
                  </div>
                  <DialogTitle className="text-xl font-black uppercase italic tracking-widest text-primary">Identity Tunnel</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  <Button 
                    onClick={handleGoogleLogin} 
                    disabled={isAuthLoading} 
                    className="w-full h-14 bg-white text-black hover:bg-slate-100 rounded-2xl font-black uppercase tracking-widest gap-3 shadow-[0_10px_30px_rgba(225,29,72,0.3)] border-none ring-4 ring-primary/20 transition-all active:scale-95"
                  >
                    {isAuthLoading ? <Loader2 className="animate-spin" /> : <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="size-5" />}
                    Connect Google
                  </Button>
                  
                  {user && !user.isAnonymous && (
                    <Button onClick={() => signOut(auth!)} variant="destructive" className="w-full h-12 rounded-xl gap-2 font-black uppercase"><LogOut className="size-4" /> Disconnect</Button>
                  )}

                  <div className="h-px bg-white/5" />
                  
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Profile Tuner</p>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Node Alias" className="bg-white/5 border-white/10 h-12 rounded-xl" />
                    <Button disabled={isUpdatingProfile} className="w-full h-12 romantic-gradient rounded-xl font-black uppercase">Save Sig</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center gap-5 mb-8">
          <div className="relative size-24 rounded-[2.5rem] overflow-hidden border-4 border-primary bg-slate-900 shadow-2xl">
            <Image src={hostProfile?.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`} alt="Profile" fill className="object-cover" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black tracking-tighter uppercase italic truncate">@{hostProfile?.username || 'New Node'}</h2>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={cn("h-6 text-[9px] font-black", hostProfile?.verified ? "bg-green-500" : "bg-white/10")}>{hostProfile?.verified ? "VERIFIED" : "PENDING"}</Badge>
              {hostProfile?.isLive && <Badge className="h-6 text-[9px] font-black bg-primary animate-pulse">ON AIR</Badge>}
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

      <main className="px-8 space-y-8 pt-8">
        <Button onClick={toggleLiveStatus} disabled={isTogglingLive} className={cn("w-full h-24 rounded-[3.5rem] font-black text-2xl uppercase italic text-white shadow-2xl transition-all active:scale-95", hostProfile?.isLive ? "bg-primary shadow-primary/40" : "bg-green-600 shadow-green-600/40")}>
          {isTogglingLive ? <Loader2 className="size-8 animate-spin" /> : <Power className="size-10" />}
          {hostProfile?.isLive ? "Cut Signal" : "Broadcast"}
        </Button>
      </main>
      <BottomNav />
    </div>
  );
}

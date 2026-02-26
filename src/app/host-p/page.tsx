'use client';

import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { BottomNav } from "@/components/BottomNav";
import { 
  Settings, Power, ChevronRight, Wallet, Loader2, Camera, Video, LogOut, UserPlus, LogIn, ShieldCheck
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
import { initiateEmailSignIn, initiateEmailSignUp } from "@/firebase/non-blocking-login";
import { signOut } from "firebase/auth";

export default function HostProfileDashboard() {
  const { firestore, user, auth, areServicesAvailable } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  const userId = user?.uid || 'simulate_host';
  const [isTogglingLive, setIsTogglingLive] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const toggleLiveStatus = async () => {
    if (!hostProfile?.verified && areServicesAvailable) {
      toast({ variant: "destructive", title: "Verification Required", description: "Complete Face Verification to stream." });
      router.push('/host-f');
      return;
    }

    if (!hostRef || !firestore || !userId) {
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
        username: editName || hostProfile?.username || "New Host",
        previewImageUrl: hostProfile?.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        streamType: hostProfile?.streamType || 'public',
        verified: hostProfile?.verified || false
      }, { merge: true });

      if (newStatus) {
        toast({ title: "Broadcast Started" });
        router.push(`/stream/${userId}`);
      } else {
        toast({ title: "Signal Cut" });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Signal Error' });
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
      toast({ title: "Details Saved" });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    toast({ title: "Signed Out" });
  };

  const handleLogin = () => {
    if (!auth || !email || !password) return;
    initiateEmailSignIn(auth, email, password);
    toast({ title: "Accessing Grid..." });
  };

  const handleSignup = () => {
    if (!auth || !email || !password) return;
    initiateEmailSignUp(auth, email, password);
    toast({ title: "Creating Account..." });
  };

  return (
    <div className="min-h-screen bg-background text-white pb-32 max-w-lg mx-auto border-x border-white/5 mesh-gradient">
      <header className="p-8 pt-10 bg-gradient-to-b from-primary/15 to-transparent rounded-b-[3.5rem]">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black tracking-tighter uppercase italic">DASHBOARD</h1>
          <div className="flex items-center gap-2">
            <Link href="/host-p/payout"><Button variant="ghost" size="icon" className="rounded-full bg-white/5 border border-white/10 size-11"><Wallet className="size-5 text-primary" /></Button></Link>
            <Dialog>
              <DialogTrigger asChild><Button variant="ghost" size="icon" className="rounded-full bg-white/5 border border-white/10 size-11"><Settings className="size-5 text-white/60" /></Button></DialogTrigger>
              <DialogContent className="bg-[#2D1B2D] border-white/10 text-white rounded-[2.5rem] p-6 max-w-[90vw] mx-auto shadow-2xl">
                <DialogHeader><DialogTitle className="text-xl font-black uppercase italic">Grid Settings</DialogTitle></DialogHeader>
                <div className="space-y-6 pt-4">
                  <div className="space-y-3">
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Display Name" className="bg-white/5 border-white/10 rounded-xl" />
                    <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Bio" className="bg-white/5 border-white/10 rounded-xl" />
                    <Button onClick={handleProfileUpdate} disabled={isUpdatingProfile} className="w-full h-12 romantic-gradient rounded-xl font-black uppercase">Save Details</Button>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Node Access</p>
                    {user && !user.isAnonymous ? (
                      <Button onClick={handleLogout} variant="destructive" className="w-full rounded-xl gap-2 font-black uppercase"><LogOut className="size-4" /> Sign Out</Button>
                    ) : (
                      <>
                        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border-white/10 h-12 rounded-xl" />
                        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border-white/10 h-12 rounded-xl" />
                        <div className="grid grid-cols-2 gap-3">
                          <Button onClick={handleLogin} variant="outline" className="h-12 rounded-xl font-black uppercase border-white/10">Login</Button>
                          <Button onClick={handleSignup} className="h-12 rounded-xl font-black uppercase bg-primary">Signup</Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center gap-5 mb-8">
          <div className="relative size-24 rounded-[2.5rem] overflow-hidden border-4 border-primary bg-slate-900">
            <Image src={hostProfile?.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`} alt="Profile" fill className="object-cover" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black tracking-tighter uppercase italic truncate">@{hostProfile?.username || 'New Host'}</h2>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={cn("h-6 text-[9px] font-black", hostProfile?.verified ? "bg-green-500" : "bg-white/10")}>{hostProfile?.verified ? "VERIFIED" : "UNVERIFIED"}</Badge>
              {hostProfile?.isLive && <Badge className="h-6 text-[9px] font-black bg-primary animate-pulse">LIVE</Badge>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <Link href="/host-f" className="flex-1">
              <Button variant="outline" className="w-full h-28 rounded-[2rem] bg-white/5 text-white flex flex-col items-center justify-center gap-2 hover:bg-primary/20 transition-all border-none">
                <Camera className="size-7 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest italic">Face Verification</span>
              </Button>
            </Link>
            <Button variant="outline" className="flex-1 h-28 rounded-[2rem] bg-white/5 text-white flex flex-col items-center justify-center gap-2 border-none">
              <Video className="size-7 text-secondary" />
              <span className="text-[10px] font-black uppercase tracking-widest italic">Video Upload</span>
            </Button>
        </div>
      </header>

      <main className="px-8 space-y-8 pt-8">
        <Button onClick={toggleLiveStatus} disabled={isTogglingLive} className={cn("w-full h-24 rounded-[3.5rem] font-black text-2xl uppercase italic text-white shadow-2xl", hostProfile?.isLive ? "bg-primary" : "bg-green-600")}>
          {isTogglingLive ? <Loader2 className="size-8 animate-spin" /> : <Power className="size-10" />}
          {hostProfile?.isLive ? "Disconnect" : "Go Live"}
        </Button>
      </main>
      <BottomNav />
    </div>
  );
}

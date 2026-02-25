
"use client"

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { 
  X, Eye, Heart, Send, 
  Lock, Zap, UserPlus, ShieldOff, ShieldCheck, Check, Ban
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFirebase, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, setDoc, serverTimestamp, query, orderBy, limit, where, updateDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import LiveEarningTimer from "@/components/Stream/LiveEarningTimer";
import { Badge } from "@/components/ui/badge";

export default function StreamPage() {
  const { id } = useParams();
  const router = useRouter();
  const { firestore, user, areServicesAvailable } = useFirebase();
  const { toast } = useToast();
  
  const [inputText, setInputText] = useState("");
  const [streamMinutes, setStreamMinutes] = useState(0);
  const [requestPopup, setRequestPopup] = useState<{ id: string, name: string } | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  // Logic to determine if the user is the host
  const isHost = user?.uid === id || id === 'simulate_host' || id === 'host_node' || id === 'host_node_active';

  // Memoized Host Reference
  const hostRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    const hostId = (id === 'simulate_host' || id === 'host_node' || id === 'host_node_active') ? (user?.uid || 'fake_host') : id;
    return doc(firestore, 'hosts', hostId as string);
  }, [firestore, id, user?.uid]);

  const { data: host, isLoading } = useDoc(hostRef);

  // Monitor Private Call Requests
  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !isHost) return null;
    const hostId = (id === 'simulate_host' || id === 'host_node' || id === 'host_node_active') ? (user?.uid || 'fake_host') : id;
    return query(
      collection(firestore, 'streamRequests'),
      where('hostId', '==', hostId),
      where('status', '==', 'pending'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
  }, [firestore, isHost, id, user?.uid]);

  const { data: latestRequests } = useCollection(requestsQuery);

  // Handle Request Popup Timer (5 Seconds)
  useEffect(() => {
    if (latestRequests && latestRequests.length > 0) {
      const req = latestRequests[0];
      const isFresh = req.timestamp && (Date.now() - req.timestamp.toMillis() < 5000);
      
      if (isFresh) {
        setRequestPopup({ id: req.id, name: req.userName || 'Unknown User' });
        const timer = setTimeout(() => setRequestPopup(null), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [latestRequests]);

  // Stream Duration Tracking
  useEffect(() => {
    if (!isHost) return;
    const interval = setInterval(() => {
      setStreamMinutes(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, [isHost]);

  // Camera Initialization
  useEffect(() => {
    const getCameraPermission = async () => {
      if (!isHost) return;
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, 
          audio: true
        });
        setCameraStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (error) {
        toast({ variant: 'destructive', title: 'Camera Blocked', description: 'Face node requires camera access.' });
      }
    };
    getCameraPermission();
    return () => cameraStream?.getTracks().forEach(track => track.stop());
  }, [isHost]);

  // True One-Click Mode Toggle (Firestore Update)
  const toggleStreamMode = async () => {
    if (!isHost || !hostRef) {
      toast({ title: "Simulation: Mode Toggled" });
      return;
    }
    const currentMode = host?.streamType || 'public';
    const nextMode = currentMode === 'public' ? 'private' : 'public';

    try {
      await setDoc(hostRef, { 
        streamType: nextMode,
        updatedAt: serverTimestamp() 
      }, { merge: true });
      toast({ title: `SIGNAL: ${nextMode.toUpperCase()} ACTIVE` });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    }
  };

  // Manual Privacy Mask (Blur) Toggle
  const toggleManualBlur = async () => {
    if (!isHost || !hostRef) return;
    const currentBlur = host?.manualBlur || false;
    try {
      await setDoc(hostRef, { 
        manualBlur: !currentBlur,
        updatedAt: serverTimestamp() 
      }, { merge: true });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const handleRequestAction = async (requestId: string, action: 'approved' | 'rejected') => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'streamRequests', requestId), { status: action });
      setRequestPopup(null);
      toast({ title: action === 'approved' ? "Call Accepted" : "Call Rejected" });
    } catch (e) {
      console.error(e);
    }
  };

  const endStream = async () => {
    if (isHost && hostRef) {
      await setDoc(hostRef, { isLive: false, updatedAt: serverTimestamp() }, { merge: true });
    }
    router.push('/host-p');
  };

  if (isLoading && areServicesAvailable) {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center mesh-gradient">
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayHost = host || {
    username: isHost ? (user?.displayName || 'My Signal') : 'Live Node',
    previewImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id || 'default'}`,
    viewers: 0,
    streamType: 'public',
    manualBlur: false
  };

  const isPrivate = displayHost.streamType === 'private';
  const shouldBlurVideo = (isPrivate || displayHost.manualBlur) && !isHost;
  const hostPreviewBlur = isHost && (isPrivate || displayHost.manualBlur);

  return (
    <div className="relative h-screen w-full flex flex-col overflow-hidden bg-black mx-auto max-w-lg border-x border-white/10 screen-guard-active">
      {/* Background Feed */}
      <div className="absolute inset-0 z-0 bg-black">
        {isHost ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={cn("w-full h-full object-cover scale-x-[-1]", hostPreviewBlur && "blur-3xl opacity-60")} 
          />
        ) : (
          <div className="relative w-full h-full">
            <Image 
              src={displayHost.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`} 
              alt="Stream" 
              fill 
              className={cn("object-cover", shouldBlurVideo ? "blur-3xl opacity-40" : "opacity-90")} 
            />
            {isPrivate && !isHost && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-xl flex flex-col items-center justify-center space-y-6 px-10 text-center">
                <Lock className="size-12 text-primary animate-pulse" />
                <Button className="h-16 rounded-[2rem] bg-primary px-10 text-white font-black uppercase tracking-widest gap-2 shadow-2xl shadow-primary/40 text-sm border-none">
                  <Zap className="size-5 fill-current" /> Unlock for 50 Coins
                </Button>
              </div>
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
      </div>

      {/* TOP CONTROLS: True Mode Toggle & Blur Button (Conditional) */}
      <div className="absolute top-8 left-0 right-0 z-[60] flex justify-center px-6 pointer-events-none">
         <div className="flex gap-3 pointer-events-auto items-center">
            {isHost && (
              <>
                <Button 
                  onClick={toggleStreamMode}
                  className={cn(
                    "h-12 px-8 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-none shadow-2xl transition-all active:scale-95",
                    isPrivate ? "bg-red-600 text-white animate-pulse" : "bg-green-500 text-white"
                  )}
                >
                  {isPrivate ? <Lock className="size-4 mr-2" /> : <Zap className="size-4 mr-2 fill-current text-amber-300" />}
                  {isPrivate ? "MODE: PRIVATE" : "MODE: PUBLIC"}
                </Button>
                
                {/* Blur button ONLY visible in Private Mode */}
                {isPrivate && (
                  <Button 
                    onClick={toggleManualBlur}
                    size="icon"
                    className={cn(
                      "h-12 w-12 rounded-full border-none shadow-2xl transition-all active:scale-95",
                      displayHost.manualBlur ? "bg-primary text-white" : "bg-white/10 text-white/60 backdrop-blur-md border border-white/10"
                    )}
                  >
                    {displayHost.manualBlur ? <ShieldOff className="size-5" /> : <ShieldCheck className="size-5" />}
                  </Button>
                )}
              </>
            )}
            {!isHost && (
              <Badge className="h-10 px-6 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-white">
                <Eye className="size-3 mr-2 text-primary" /> {displayHost.viewers || 0}
              </Badge>
            )}
         </div>
      </div>

      {/* Bonus Earning Timer HUD */}
      {isHost && <LiveEarningTimer minutes={streamMinutes} />}

      {/* PRIVATE REQUEST POPUP: 5-Second Automatic UI */}
      {isHost && requestPopup && (
        <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 z-[100] animate-in zoom-in fade-in duration-500">
           <div className="romantic-gradient p-8 rounded-[3rem] shadow-[0_20px_60px_rgba(225,29,72,0.5)] flex flex-col items-center text-center space-y-6 border border-white/20 romantic-glow">
              <div className="size-20 rounded-[2rem] bg-white/20 flex items-center justify-center relative overflow-hidden">
                 <UserPlus className="size-10 text-white" />
                 <div className="absolute inset-0 bg-white/10 animate-pulse" />
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">Private Call Request</p>
                 <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-tight">
                   @{requestPopup.name} wants a Private Call
                 </h3>
              </div>
              <div className="flex gap-3 w-full">
                <Button 
                  onClick={() => handleRequestAction(requestPopup.id, 'approved')}
                  className="flex-1 h-14 rounded-2xl bg-white text-primary font-black uppercase text-[10px] tracking-widest border-none shadow-xl hover:scale-105"
                >
                  <Check className="size-4 mr-2" /> Accept
                </Button>
                <Button 
                  onClick={() => handleRequestAction(requestPopup.id, 'rejected')}
                  variant="outline"
                  className="flex-1 h-14 rounded-2xl border-white/20 bg-black/20 text-white font-black uppercase text-[10px] tracking-widest hover:bg-black/40"
                >
                  <Ban className="size-4 mr-2" /> Reject
                </Button>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-white animate-[progress_5s_linear_forwards]" />
              </div>
           </div>
        </div>
      )}

      {/* HEADER: Clean UI */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-24 pb-4 mt-20">
        <div className="flex items-center gap-4 glass-effect rounded-full p-1.5 pr-6 bg-black/40 backdrop-blur-xl border border-white/10 shadow-lg">
          <div className="relative size-14 rounded-full border-2 border-primary overflow-hidden bg-slate-900 shadow-inner">
            <Image 
              src={displayHost.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayHost.username}`} 
              alt="Profile" 
              fill 
              className="object-cover" 
            />
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-tighter italic">@{displayHost.username}</h3>
        </div>
        
        <div className="flex gap-3">
          {isHost ? (
            <Button variant="destructive" size="sm" onClick={endStream} className="rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] h-14 px-8 border-none shadow-2xl shadow-red-600/30 italic">
              End Stream
            </Button>
          ) : (
            <Button variant="secondary" size="icon" onClick={() => router.back()} className="glass-effect size-14 rounded-full text-white border-none bg-white/10 backdrop-blur-3xl">
              <X className="size-7" />
            </Button>
          )}
        </div>
      </header>

      {/* BOTTOM AREA: Chat & Interaction */}
      <div className="flex-1 relative z-10 flex flex-col justify-end px-6 pb-12">
        <div className="w-full max-w-[85%] flex flex-col gap-3 overflow-y-auto max-h-[25vh] mb-8 no-scrollbar">
            <div className="px-5 py-3.5 rounded-[1.5rem] max-w-fit bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl">
              <p className="text-[11px] text-white font-medium leading-relaxed uppercase tracking-tight">
                <span className="font-black mr-2 text-primary">Sentinel:</span>
                <span className="opacity-80">{isPrivate ? "Encryption Active. Private Mode Engaged." : "Broadcast is Public. Stay Safe."}</span>
              </p>
            </div>
          <div ref={chatEndRef} />
        </div>

        {!isPrivate && (
          <footer className="flex items-center gap-4 w-full animate-in slide-in-from-bottom-6 duration-500">
            <div className="flex-1 flex items-center glass-effect rounded-[2.5rem] px-8 h-16 bg-white/5 border-white/10 backdrop-blur-2xl">
              <Input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="bg-transparent border-none focus-visible:ring-0 text-white placeholder-white/20 font-black text-xs uppercase tracking-widest" 
                placeholder="Send a message..." 
              />
              <button onClick={() => setInputText("")} className="ml-3 text-primary hover:scale-125 transition-transform active:scale-95">
                <Send className="size-7" />
              </button>
            </div>
            <Button className="size-16 rounded-full romantic-gradient border-none shadow-2xl flex items-center justify-center group active:scale-90 transition-all">
               <Heart className="size-8 text-white fill-current group-hover:scale-110 transition-transform" />
            </Button>
          </footer>
        )}
      </div>
      
      {/* Decorative Scanline Overlay (Host Only) */}
      {isHost && (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden opacity-5">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_15px_#E11D48] animate-scan" />
        </div>
      )}

      <style jsx global>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

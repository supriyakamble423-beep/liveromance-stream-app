
"use client"

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { 
  X, Eye, Heart, Send, 
  Lock, Zap, UserPlus, ShieldOff, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFirebase, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, setDoc, serverTimestamp, query, orderBy, limit, where } from "firebase/firestore";
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
  const [activeNotification, setActiveNotification] = useState<{name: string, type: string} | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  const isHost = user?.uid === id || id === 'simulate_host' || id === 'host_node';

  const hostRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    const hostId = (id === 'simulate_host' || id === 'host_node') ? (user?.uid || 'fake_host') : id;
    return doc(firestore, 'hosts', hostId as string);
  }, [firestore, id, user?.uid]);

  const { data: host, isLoading } = useDoc(hostRef);

  // Monitor Private Entry/Requests for Host
  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !isHost) return null;
    const hostId = (id === 'simulate_host' || id === 'host_node') ? (user?.uid || 'fake_host') : id;
    return query(
      collection(firestore, 'streamRequests'),
      where('hostId', '==', hostId),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
  }, [firestore, isHost, id, user?.uid]);

  const { data: latestRequests } = useCollection(requestsQuery);

  useEffect(() => {
    if (latestRequests && latestRequests.length > 0) {
      const req = latestRequests[0];
      const isFresh = req.timestamp && (Date.now() - req.timestamp.toMillis() < 10000);
      if (isFresh) {
        setActiveNotification({ name: req.userName || 'User', type: req.type || 'Requested Access' });
        const timer = setTimeout(() => setActiveNotification(null), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [latestRequests]);

  useEffect(() => {
    if (!isHost) return;
    const interval = setInterval(() => {
      setStreamMinutes(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, [isHost]);

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
        toast({ variant: 'destructive', title: 'Camera Blocked' });
      }
    };
    getCameraPermission();
    return () => cameraStream?.getTracks().forEach(track => track.stop());
  }, [isHost]);

  const toggleStreamMode = async () => {
    if (!isHost) return;
    const currentMode = host?.streamType || 'public';
    const nextMode = currentMode === 'public' ? 'private' : 'public';

    if (!areServicesAvailable || !hostRef) {
      toast({ title: `Simulation: Mode set to ${nextMode.toUpperCase()}` });
      return;
    }

    try {
      await setDoc(hostRef, { 
        streamType: nextMode,
        updatedAt: serverTimestamp() 
      }, { merge: true });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const toggleManualBlur = async () => {
    if (!isHost || !hostRef) return;
    const currentBlur = host?.manualBlur || false;
    try {
      await setDoc(hostRef, { 
        manualBlur: !currentBlur,
        updatedAt: serverTimestamp() 
      }, { merge: true });
      toast({ title: !currentBlur ? "Blur On" : "Blur Off" });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const endStream = async () => {
    if (isHost && hostRef && areServicesAvailable) {
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
    username: isHost ? (user?.displayName || 'My Stream') : 'Live Host',
    previewImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id || 'default'}`,
    viewers: 1250,
    streamType: 'public',
    rating: 4.9,
    manualBlur: false
  };

  const isPrivate = displayHost.streamType === 'private';
  const shouldBlur = (isPrivate || displayHost.manualBlur) && !isHost;
  const hostVideoBlur = isHost && (isPrivate || displayHost.manualBlur);

  return (
    <div className="relative h-screen w-full flex flex-col overflow-hidden bg-black mx-auto max-w-lg border-x border-white/10 screen-guard-active">
      <div className="absolute inset-0 z-0 bg-black">
        {isHost ? (
          <div className="relative w-full h-full">
             <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={cn("w-full h-full object-cover scale-x-[-1]", hostVideoBlur && "blur-2xl opacity-60")} 
            />
          </div>
        ) : (
          <div className="relative w-full h-full">
            <Image 
              src={displayHost.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`} 
              alt="Stream" 
              fill 
              className={cn("object-cover", shouldBlur ? "blur-3xl opacity-40" : "opacity-90")} 
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none" />
      </div>

      <div className="absolute top-6 left-0 right-0 z-[60] flex justify-center px-6 pointer-events-none">
         <div className="flex gap-2 pointer-events-auto items-center">
            {isHost && (
              <>
                <Button 
                  onClick={toggleStreamMode}
                  className={cn(
                    "h-10 px-6 rounded-full text-[10px] font-black uppercase tracking-widest border-none shadow-xl transition-all active:scale-95",
                    isPrivate ? "bg-red-600 text-white animate-pulse" : "bg-green-500 text-white"
                  )}
                >
                  {isPrivate ? <Lock className="size-3 mr-2" /> : <Zap className="size-3 mr-2 fill-current" />}
                  {isPrivate ? "MODE: PRIVATE" : "MODE: PUBLIC"}
                </Button>
                
                {isPrivate && (
                  <Button 
                    onClick={toggleManualBlur}
                    size="icon"
                    className={cn(
                      "h-10 w-10 rounded-full border-none shadow-xl transition-all active:scale-95",
                      displayHost.manualBlur ? "bg-primary text-white" : "bg-white/10 text-white/60 backdrop-blur-md"
                    )}
                  >
                    {displayHost.manualBlur ? <ShieldOff className="size-4" /> : <ShieldCheck className="size-4" />}
                  </Button>
                )}
              </>
            )}
            <Badge className="h-10 px-6 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-white">
              <Eye className="size-3 mr-2 text-primary" /> {displayHost.viewers || 0}
            </Badge>
         </div>
      </div>

      {isHost && <LiveEarningTimer minutes={streamMinutes} />}

      {isHost && activeNotification && (
        <div className="absolute top-48 left-6 right-6 z-[100] animate-in slide-in-from-top-10 duration-500">
           <div className="romantic-gradient p-5 rounded-3xl shadow-2xl flex items-center gap-4 border border-white/20 romantic-glow">
              <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center">
                 <UserPlus className="size-6 text-white" />
              </div>
              <div className="flex-1">
                 <p className="text-[10px] font-black uppercase text-white/70">Activity Alert</p>
                 <p className="text-sm font-black text-white italic truncate">@{activeNotification.name} {activeNotification.type}</p>
              </div>
              <div className="size-2 rounded-full bg-white animate-ping" />
           </div>
        </div>
      )}

      <header className="relative z-10 flex items-center justify-between px-4 pt-20 pb-4 mt-24">
        <div className="flex items-center gap-3 glass-effect rounded-full p-1 pr-5 bg-black/30 backdrop-blur-md border border-white/10">
          <div className="relative size-12 rounded-full border-2 border-primary overflow-hidden bg-slate-800">
            <Image 
              src={displayHost.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayHost.username}`} 
              alt="Host" 
              fill 
              className="object-cover" 
            />
          </div>
          <div>
            <h3 className="text-xs font-black leading-none text-white uppercase tracking-tighter italic">@{displayHost.username}</h3>
          </div>
        </div>
        <div className="flex gap-2">
          {isHost ? (
            <Button variant="destructive" size="sm" onClick={endStream} className="rounded-2xl font-black uppercase text-[10px] tracking-widest h-12 px-8 border-none shadow-xl shadow-red-500/20">
              End Stream
            </Button>
          ) : (
            <Button variant="secondary" size="icon" onClick={() => router.back()} className="glass-effect size-12 rounded-full text-white border-none bg-white/10 backdrop-blur-xl">
              <X className="size-6" />
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 relative z-10 flex flex-col justify-end px-6 pb-10">
        <div className="w-full max-w-[85%] flex flex-col gap-3 overflow-y-auto max-h-[30vh] mb-8 no-scrollbar">
            <div className="px-4 py-3 rounded-2xl max-w-fit bg-black/60 backdrop-blur-lg border border-white/10 shadow-xl">
              <p className="text-[11px] text-white font-medium leading-relaxed">
                <span className="font-black mr-2 text-primary text-[10px] uppercase italic">System:</span>
                <span className="opacity-90">{isPrivate ? "Encryption Active. Private Room Open." : "Broadcast is Public. Enjoy."}</span>
              </p>
            </div>
          <div ref={chatEndRef} />
        </div>

        {!isPrivate && (
          <footer className="flex items-center gap-3 w-full animate-in slide-in-from-bottom-4">
            <div className="flex-1 flex items-center glass-effect rounded-[2rem] px-6 h-16 bg-white/5 border-white/10 backdrop-blur-xl">
              <Input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="bg-transparent border-none focus-visible:ring-0 text-white placeholder-white/30 font-bold text-sm" 
                placeholder="Say something nice..." 
              />
              <button onClick={() => setInputText("")} className="ml-2 text-primary hover:scale-110 transition-transform">
                <Send className="size-6" />
              </button>
            </div>
            <Button className="size-16 rounded-full romantic-gradient border-none shadow-2xl flex items-center justify-center group">
               <Heart className="size-8 text-white fill-current group-hover:scale-110 transition-transform" />
            </Button>
          </footer>
        )}
      </div>
      
      {isHost && (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden opacity-5">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_15px_#E11D48] animate-scan" />
        </div>
      )}
    </div>
  );
}

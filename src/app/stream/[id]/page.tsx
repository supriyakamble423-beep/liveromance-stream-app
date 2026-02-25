
"use client"

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { 
  X, Eye, Heart, Send, 
  Lock, Zap, UserPlus, ShieldOff, ShieldCheck, Check, Ban, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection, setDoc, serverTimestamp, query, orderBy, limit, where, updateDoc, onSnapshot } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import LiveEarningTimer from "@/components/Stream/LiveEarningTimer";
import { Badge } from "@/components/ui/badge";

/**
 * World-Class Host Stream Page
 * Features: True One-Click Toggle, Conditional Blur, Private Request Popups.
 */
export default function StreamPage() {
  const { id } = useParams();
  const router = useRouter();
  const { firestore, user, areServicesAvailable } = useFirebase();
  const { toast } = useToast();
  
  const [inputText, setInputText] = useState("");
  const [streamMinutes, setStreamMinutes] = useState(0);
  const [requestPopup, setRequestPopup] = useState<{ id: string, name: string } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  // Logic to determine if user is the host
  const isHost = user?.uid === id || id === 'simulate_host' || id === 'host_node_active';
  const effectiveId = (id === 'simulate_host' || id === 'host_node_active') ? (user?.uid || 'simulate_host') : id;

  const hostRef = useMemoFirebase(() => {
    if (!firestore || !effectiveId) return null;
    return doc(firestore, 'hosts', effectiveId as string);
  }, [firestore, effectiveId]);

  const { data: host, isLoading } = useDoc(hostRef);

  // REAL-TIME PRIVATE REQUEST LISTENER (A -> B)
  useEffect(() => {
    if (!firestore || !isHost || !effectiveId) return;

    try {
      const q = query(
        collection(firestore, 'streamRequests'),
        where('hostId', '==', effectiveId),
        where('status', '==', 'pending'),
        orderBy('timestamp', 'desc'),
        limit(1)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data();
          const docId = snapshot.docs[0].id;
          
          // Show popup if request is fresh
          const requestTime = docData.timestamp?.toMillis() || Date.now();
          if (Date.now() - requestTime < 10000) {
            setRequestPopup({ id: docId, name: docData.userName || 'Anonymous User' });
            // Auto-dismiss in 5 seconds
            setTimeout(() => setRequestPopup(null), 5000);
          }
        }
      }, (err) => console.error("Request listener failed:", err));

      return () => unsubscribe();
    } catch (e) {
      console.error("Popup setup error:", e);
    }
  }, [firestore, isHost, effectiveId]);

  // Track stream duration
  useEffect(() => {
    if (!isHost) return;
    const interval = setInterval(() => {
      setStreamMinutes(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, [isHost]);

  // Camera initialization
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
        console.error("Camera access failed:", error);
        toast({ 
          variant: 'destructive', 
          title: 'Camera Access Denied', 
          description: 'Please enable camera permissions to stream.' 
        });
      }
    };
    getCameraPermission();
    return () => {
      cameraStream?.getTracks().forEach(track => track.stop());
    };
  }, [isHost]);

  // TRUE ONE-CLICK TOGGLE: Public <-> Private
  const toggleStreamMode = async () => {
    if (!isHost || !hostRef) {
      toast({ title: "Simulation: Local Mode Toggled" });
      return;
    }

    setIsUpdating(true);
    const currentMode = host?.streamType || 'public';
    const nextMode = currentMode === 'public' ? 'private' : 'public';

    try {
      await setDoc(hostRef, { 
        streamType: nextMode,
        updatedAt: serverTimestamp() 
      }, { merge: true });
      
      toast({ 
        title: `MODE: ${nextMode.toUpperCase()}`,
        description: nextMode === 'private' ? "Encryption Active." : "Now Live to Everyone."
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed", description: "Retry connection." });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'approved' | 'rejected') => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'streamRequests', requestId), { status: action });
      setRequestPopup(null);
      toast({ 
        title: action === 'approved' ? "Call Accepted" : "Call Rejected",
        variant: action === 'approved' ? 'default' : 'destructive'
      });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Action failed.' });
    }
  };

  const endStream = async () => {
    if (confirm("End broadcast?")) {
      if (isHost && hostRef) {
        try {
          await updateDoc(hostRef, { isLive: false, updatedAt: serverTimestamp() });
        } catch (e) { console.error(e); }
      }
      router.push('/host-p');
    }
  };

  if (isLoading && areServicesAvailable) {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="size-12 animate-spin text-primary" />
      </div>
    );
  }

  const isPrivateMode = host?.streamType === 'private';
  const displayUsername = host?.username || (isHost ? (user?.displayName || 'My Stream') : 'Host');
  const displayImage = host?.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayUsername}`;

  return (
    <div className="relative h-screen w-full flex flex-col overflow-hidden bg-black mx-auto max-w-lg border-x border-white/10 screen-guard-active">
      
      {/* 1. BACKGROUND FEED (CLEAR / BLURRED) */}
      <div className="absolute inset-0 z-0 bg-black">
        {isHost ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={cn(
              "w-full h-full object-cover scale-x-[-1] transition-all duration-700", 
              (isPrivateMode || host?.manualBlur) && "blur-3xl opacity-60"
            )} 
          />
        ) : (
          <div className="relative w-full h-full">
            <Image 
              src={displayImage} 
              alt="Feed" 
              fill 
              className={cn("object-cover transition-all duration-700", (isPrivateMode || host?.manualBlur) ? "blur-3xl opacity-40" : "opacity-90")} 
            />
            {isPrivateMode && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-xl flex flex-col items-center justify-center space-y-6 px-10 text-center">
                <Lock className="size-12 text-primary animate-pulse" />
                <Button className="h-16 rounded-[2rem] bg-primary px-10 text-white font-black uppercase tracking-widest gap-2 shadow-2xl">
                  <Zap className="size-5 fill-current" /> Unlock Room
                </Button>
              </div>
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
      </div>

      {/* 2. TOP CONTROLS: MODE TOGGLE & SMART BLUR */}
      <div className="absolute top-10 left-0 right-0 z-[60] flex justify-center px-6">
         <div className="flex gap-3 items-center">
            {isHost && (
              <>
                <Button 
                  onClick={toggleStreamMode}
                  disabled={isUpdating}
                  className={cn(
                    "h-12 px-8 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-none shadow-2xl transition-all active:scale-95",
                    isPrivateMode ? "bg-red-600 text-white" : "bg-green-500 text-white"
                  )}
                >
                  {isUpdating ? <Loader2 className="size-4 mr-2 animate-spin" /> : isPrivateMode ? <Lock className="size-4 mr-2" /> : <Zap className="size-4 mr-2" />}
                  {isPrivateMode ? "MODE: PRIVATE" : "MODE: PUBLIC"}
                </Button>
                
                {/* CONDITIONAL BLUR BUTTON (Only Private Mode) */}
                {isPrivateMode && (
                  <Button 
                    onClick={async () => {
                      if (!hostRef) return;
                      await updateDoc(hostRef, { manualBlur: !host?.manualBlur });
                    }}
                    size="icon"
                    className={cn(
                      "h-12 w-12 rounded-full border-none shadow-2xl transition-all active:scale-95",
                      host?.manualBlur ? "bg-primary text-white" : "bg-white/10 text-white/60 backdrop-blur-md"
                    )}
                  >
                    {host?.manualBlur ? <ShieldOff className="size-5" /> : <ShieldCheck className="size-5" />}
                  </Button>
                )}
              </>
            )}
            {!isHost && (
              <Badge className="h-10 px-6 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest">
                <Eye className="size-3 mr-2 text-primary" /> {host?.viewers || 0} Viewers
              </Badge>
            )}
         </div>
      </div>

      {isHost && <LiveEarningTimer minutes={streamMinutes} />}

      {/* 3. PRIVATE REQUEST POPUP (CENTERED, 5-SECOND) */}
      {isHost && requestPopup && (
        <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 z-[100] animate-in zoom-in fade-in duration-500">
           <div className="romantic-gradient p-8 rounded-[3rem] shadow-[0_20px_60px_rgba(225,29,72,0.5)] flex flex-col items-center text-center space-y-6 border border-white/20">
              <div className="size-20 rounded-[2rem] bg-white/20 flex items-center justify-center">
                 <UserPlus className="size-10 text-white" />
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">Incoming Request</p>
                 <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">
                   @{requestPopup.name} wants a Private Call
                 </h3>
              </div>
              <div className="flex gap-3 w-full pt-2">
                <Button 
                  onClick={() => handleRequestAction(requestPopup.id, 'approved')}
                  className="flex-1 h-14 rounded-2xl bg-white text-primary font-black uppercase text-[10px] border-none shadow-xl"
                >
                  <Check className="size-4 mr-2" /> Accept
                </Button>
                <Button 
                  onClick={() => handleRequestAction(requestPopup.id, 'rejected')}
                  variant="outline"
                  className="flex-1 h-14 rounded-2xl border-white/20 bg-black/20 text-white font-black uppercase text-[10px]"
                >
                  <Ban className="size-4 mr-2" /> Reject
                </Button>
              </div>
              {/* Progress Bar for the 5s timer */}
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-4">
                <div className="h-full bg-white animate-[progress_5s_linear_forwards]" />
              </div>
           </div>
        </div>
      )}

      {/* 4. HEADER: CLEAN & MINIMAL */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-24 pb-4">
        <div className="flex items-center gap-4 glass-effect rounded-full p-1.5 pr-6 bg-black/40 backdrop-blur-xl border border-white/10">
          <div className="relative size-12 rounded-full border-2 border-primary overflow-hidden shadow-inner">
            <Image 
              src={displayImage} 
              alt="User" 
              fill 
              className="object-cover" 
            />
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-tighter italic">@{displayUsername}</h3>
        </div>
        
        <div className="flex gap-3">
          {isHost ? (
            <Button variant="destructive" size="sm" onClick={endStream} className="rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] h-12 px-6 border-none shadow-2xl shadow-red-600/30">
              End Session
            </Button>
          ) : (
            <Button variant="secondary" size="icon" onClick={() => router.back()} className="glass-effect size-12 rounded-full text-white border-none bg-white/10 backdrop-blur-3xl">
              <X className="size-6" />
            </Button>
          )}
        </div>
      </header>

      {/* 5. CHAT & INTERACTION */}
      <div className="flex-1 relative z-10 flex flex-col justify-end px-6 pb-12">
        <div className="w-full max-w-[85%] flex flex-col gap-3 overflow-y-auto max-h-[25vh] mb-8 no-scrollbar">
            <div className="px-5 py-3.5 rounded-[1.5rem] max-w-fit bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl">
              <p className="text-[11px] text-white font-medium leading-relaxed uppercase">
                <span className="font-black mr-2 text-primary">System:</span>
                <span className="opacity-80">
                  {isPrivateMode ? "Encrypted Signal Active. Only invited guests can join." : "Public Signal Active. World marketplace discovery enabled."}
                </span>
              </p>
            </div>
        </div>

        {(!isPrivateMode || isHost) && (
          <footer className="flex items-center gap-4 w-full animate-in slide-in-from-bottom-6 duration-500">
            <div className="flex-1 flex items-center glass-effect rounded-[2.5rem] px-8 h-16 bg-white/5 border-white/10 backdrop-blur-2xl">
              <Input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="bg-transparent border-none focus-visible:ring-0 text-white placeholder-white/20 font-black text-xs uppercase tracking-widest" 
                placeholder="Secure message..." 
              />
              <button onClick={() => setInputText("")} className="ml-3 text-primary hover:scale-125 transition-transform">
                <Send className="size-7" />
              </button>
            </div>
            <Button className="size-16 rounded-full romantic-gradient border-none shadow-2xl flex items-center justify-center active:scale-90 transition-all">
               <Heart className="size-8 text-white fill-current" />
            </Button>
          </footer>
        )}
      </div>
      
      <style jsx global>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

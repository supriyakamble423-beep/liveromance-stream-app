'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Heart, Send, Lock, Zap, ShieldOff, ShieldCheck, Loader2, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import LiveEarningTimer from "@/components/Stream/LiveEarningTimer";
import { PrivateRequestPopup } from "@/components/Stream/PrivateRequestPopup";

interface StreamClientProps {
  id: string;
}

export function StreamClient({ id }: StreamClientProps) {
  const router = useRouter();
  const { firestore, user, areServicesAvailable, isUserLoading } = useFirebase();
  const { toast } = useToast();

  const [inputText, setInputText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Safety logic for Host Identification
  const isHost = user?.uid === id || id === 'simulate_host';
  const effectiveId = isHost ? (user?.uid || 'simulate_host') : id;

  const hostRef = useMemoFirebase(() => {
    if (!firestore || !effectiveId) return null;
    return doc(firestore, 'hosts', effectiveId as string);
  }, [firestore, effectiveId]);

  const { data: host, isLoading: isHostLoading } = useDoc(hostRef);

  // CAMERA LOGIC
  useEffect(() => {
    if (!isHost || cameraStream) return;
    
    async function getCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "user" }, 
          audio: true 
        });
        setCameraStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err) {
        console.error("Camera failed:", err);
        toast({ variant: "destructive", title: "Camera Error", description: "Could not access hardware." });
      }
    }
    
    getCamera();
    
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isHost, toast, cameraStream]);

  // MODE TOGGLE logic
  const toggleMode = async () => {
    if (!isHost || !hostRef || isUpdating) return;
    
    setIsUpdating(true);
    const currentType = host?.streamType || 'public';
    const nextType = currentType === 'public' ? 'private' : 'public';
    
    try {
      await updateDoc(hostRef, { 
        streamType: nextType, 
        updatedAt: serverTimestamp() 
      });
      toast({ 
        title: `MODE: ${nextType.toUpperCase()}`, 
        className: nextType === 'private' ? "bg-red-600 border-none text-white" : "bg-green-600 border-none text-white" 
      });
    } catch (error) {
      console.error("Toggle error:", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Database connection lost." });
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleBlur = async () => {
    if (!hostRef || !host) return;
    try {
      await updateDoc(hostRef, { manualBlur: !host.manualBlur });
    } catch (e) {
      toast({ variant: "destructive", title: "Blur Error" });
    }
  };

  const endStream = async () => {
    if (!confirm("Are you sure you want to cut the signal?")) return;
    
    try {
      if (isHost && hostRef) {
        await updateDoc(hostRef, { isLive: false, updatedAt: serverTimestamp() });
      }
      cameraStream?.getTracks().forEach(t => t.stop());
      router.push('/host-p');
    } catch (e) {
      router.push('/host-p');
    }
  };

  // SAFETY LOADING SCREEN
  if (isUserLoading || isHostLoading || (!host && areServicesAvailable && id !== 'simulate_host')) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4">
        <Loader2 className="size-10 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Establishing Grid</p>
      </div>
    );
  }

  // Fallback for simulate_host if firestore is not available
  const displayHost = host || {
    username: id === 'simulate_host' ? 'Simulate_Host' : 'Anonymous',
    streamType: 'public',
    manualBlur: false,
    previewImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`
  };

  const isPrivate = displayHost.streamType === 'private';
  const isBlur = isPrivate || displayHost.manualBlur;

  return (
    <div className="relative h-screen w-full flex flex-col overflow-hidden bg-black max-w-lg mx-auto border-x border-white/10">
      
      {/* FULL VIDEO VIEW */}
      <div className="absolute inset-0">
        {isHost ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn("w-full h-full object-cover scale-x-[-1] transition-all duration-700", isBlur && "blur-2xl opacity-60")}
          />
        ) : (
          <div className="relative w-full h-full">
             <Image 
              src={displayHost.previewImageUrl || "https://picsum.photos/seed/host/600/800"} 
              alt="Stream" 
              fill 
              className={cn("object-cover transition-all duration-700", isBlur && "blur-2xl opacity-40")} 
             />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
      </div>

      {/* TOP NAVIGATION & CONTROLS */}
      <div className="absolute top-6 inset-x-0 z-50 flex items-start justify-between px-6">
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md rounded-full p-2 pr-6 border border-white/10 shadow-2xl">
          <div className="relative size-10 rounded-full overflow-hidden border-2 border-primary">
            <Image src={displayHost.previewImageUrl || ""} alt="User" fill className="object-cover" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-tight italic text-white">@{displayHost.username}</h3>
        </div>

        <div className="flex flex-col items-end gap-3">
          {isHost && (
            <div className="flex gap-2 bg-black/40 backdrop-blur-xl rounded-2xl p-1.5 border border-white/10 shadow-2xl">
              <Button
                onClick={toggleMode}
                disabled={isUpdating}
                className={cn(
                  "h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  isPrivate ? "bg-red-600 hover:bg-red-700 shadow-[0_0_15px_rgba(220,38,38,0.5)]" : "bg-green-600 hover:bg-green-700"
                )}
              >
                {isUpdating ? <Loader2 className="size-4 animate-spin" /> : isPrivate ? <Lock className="size-4 mr-2" /> : <Zap className="size-4 mr-2" />}
                {isPrivate ? "Private" : "Public"}
              </Button>
              
              {isPrivate && (
                <Button 
                  onClick={toggleBlur} 
                  variant="ghost" 
                  size="icon" 
                  className="size-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
                >
                  {displayHost.manualBlur ? <ShieldOff className="size-5 text-red-500" /> : <ShieldCheck className="size-5 text-green-500" />}
                </Button>
              )}
            </div>
          )}
          
          {/* REVENUE TIMER (FACE BLOCKING FIXED) */}
          {isHost && <LiveEarningTimer minutes={2} />}
        </div>
      </div>

      {/* PRIVATE REQUEST POPUP (AUTOMATED) */}
      {isHost && <PrivateRequestPopup firestore={firestore} hostId={effectiveId} />}

      {/* BOTTOM ACTION CENTER */}
      <div className="flex-1 z-10 flex flex-col justify-end p-6 pb-12 space-y-6">
        
        {/* MODE INDICATOR BANNER */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
           <div className={cn(
             "rounded-2xl p-4 border flex items-center justify-between shadow-2xl backdrop-blur-md",
             isPrivate ? "bg-red-600/10 border-red-600/20" : "bg-green-600/10 border-green-600/20"
           )}>
             <div className="flex items-center gap-3">
               <div className={cn("size-2 rounded-full animate-pulse", isPrivate ? "bg-red-500" : "bg-green-500")} />
               <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
                 {isPrivate ? "Secure Connection Active" : "Global Feed Node Active"}
               </span>
             </div>
             {isHost && (
               <Button onClick={endStream} variant="ghost" size="icon" className="size-8 rounded-full bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white transition-all">
                 <Power className="size-4" />
               </Button>
             )}
           </div>
        </div>

        {/* CHAT INPUT */}
        <div className="flex gap-3">
          <div className="flex-1 flex bg-black/40 backdrop-blur-xl rounded-[2rem] px-6 py-4 border border-white/10 shadow-2xl">
            <Input 
              value={inputText} 
              onChange={e => setInputText(e.target.value)} 
              placeholder="Broadcast a thought..." 
              className="bg-transparent border-none text-white placeholder-white/30 text-sm font-medium focus-visible:ring-0" 
            />
            <button className="text-primary hover:scale-110 transition-transform"><Send className="size-6" /></button>
          </div>
          <Button className="size-14 rounded-full bg-primary shadow-[0_10px_25px_rgba(225,29,72,0.4)] hover:scale-110 transition-transform">
            <Heart className="size-7 fill-white text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
}
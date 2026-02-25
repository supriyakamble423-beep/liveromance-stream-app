'use client';

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  X, Eye, Heart, Send,
  Lock, Zap, ShieldOff, ShieldCheck, Loader2, Power
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import LiveEarningTimer from "@/components/Stream/LiveEarningTimer";
import { PrivateRequestPopup } from "@/components/Stream/PrivateRequestPopup";

/**
 * Optimized Stream Page
 * Manual Fixes: Clean Header (@username only), Instant Toggle, Conditional Blur.
 */
export default function StreamPage() {
  const params = useParams();
  const router = useRouter();
  const { firestore, user, areServicesAvailable } = useFirebase();
  const { toast } = useToast();

  const [inputText, setInputText] = useState("");
  const [streamMinutes, setStreamMinutes] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const id = params?.id as string;
  const isHost = user?.uid === id || id === 'simulate_host';
  const effectiveId = (id === 'simulate_host') ? (user?.uid || 'simulate_host') : id;

  const hostRef = useMemoFirebase(() => {
    if (!firestore || !effectiveId) return null;
    return doc(firestore, 'hosts', effectiveId);
  }, [firestore, effectiveId]);

  const { data: host, isLoading } = useDoc(hostRef);

  useEffect(() => {
    if (!isHost) return;
    const interval = setInterval(() => setStreamMinutes((prev) => prev + 1), 60000);
    return () => clearInterval(interval);
  }, [isHost]);

  useEffect(() => {
    if (!isHost) return;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setCameraStream(stream);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera Error:", err);
      }
    };
    startCamera();
    return () => cameraStream?.getTracks().forEach(t => t.stop());
  }, [isHost]);

  const toggleMode = async () => {
    if (!isHost || !hostRef) return;
    setIsUpdating(true);
    const nextMode = host?.streamType === 'public' ? 'private' : 'public';
    try {
      await setDoc(hostRef, { 
        streamType: nextMode, 
        isLive: true, 
        updatedAt: serverTimestamp() 
      }, { merge: true });
      toast({ title: `Signal: ${nextMode.toUpperCase()}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleBlur = async () => {
    if (!hostRef || !host) return;
    try {
      await updateDoc(hostRef, { manualBlur: !host.manualBlur });
    } catch (e) {
      toast({ variant: "destructive", title: "Blur Toggle Failed" });
    }
  };

  const endStream = async () => {
    if (!confirm("Confirm Signal Cut?")) return;
    if (isHost && hostRef) {
      try {
        await updateDoc(hostRef, { isLive: false, streamType: 'public' });
      } catch (e) {
        console.error(e);
      }
    }
    cameraStream?.getTracks().forEach(t => t.stop());
    router.push('/host-p');
  };

  if (isLoading && areServicesAvailable) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center space-y-4">
        <Loader2 className="size-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Establishing Grid...</p>
      </div>
    );
  }

  const isPrivate = host?.streamType === 'private';
  const isBlur = isPrivate || host?.manualBlur;
  const username = host?.username || 'Host';
  const img = host?.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${effectiveId}`;

  return (
    <div className="relative h-screen w-full flex flex-col overflow-hidden bg-black max-w-lg mx-auto border-x border-white/10 screen-guard-active">
      <div className="absolute inset-0 z-0">
        {isHost ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={cn("w-full h-full object-cover scale-x-[-1] transition-all duration-700", isBlur && "blur-2xl opacity-60")} 
          />
        ) : (
          <Image 
            src={img} 
            alt="Feed" 
            fill 
            className={cn("object-cover transition-all duration-700", isBlur && "blur-2xl opacity-60")} 
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
      </div>

      <div className="absolute top-12 left-0 right-0 z-50 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={toggleMode}
            disabled={isUpdating}
            className={cn(
              "h-12 px-8 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all italic border-none",
              isPrivate ? "bg-red-600 text-white" : "bg-green-600 text-white"
            )}
          >
            {isUpdating ? <Loader2 className="size-4 mr-2 animate-spin" /> : isPrivate ? <Lock className="size-4 mr-2" /> : <Zap className="size-4 mr-2" />}
            MODE: {isPrivate ? "PRIVATE" : "PUBLIC"}
          </Button>

          {isPrivate && (
            <Button 
              onClick={toggleBlur} 
              size="icon" 
              className={cn(
                "h-12 w-12 rounded-full shadow-2xl transition-all border-none",
                host?.manualBlur ? "bg-red-600 text-white" : "bg-white/10 text-white"
              )}
            >
              {host?.manualBlur ? <ShieldOff className="size-6" /> : <ShieldCheck className="size-6" />}
            </Button>
          )}
        </div>
      </div>

      {isHost && <PrivateRequestPopup firestore={firestore} hostId={effectiveId} />}

      {isHost && (
        <div className="absolute top-28 right-6 z-50">
          <LiveEarningTimer minutes={streamMinutes} />
        </div>
      )}

      <header className="relative z-10 flex items-center justify-between px-6 mt-44">
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md rounded-full p-2 pr-6 border border-white/10 shadow-xl">
          <div className="relative size-10 rounded-full overflow-hidden border-2 border-primary">
            <Image src={img} alt={username} fill className="object-cover" />
          </div>
          <h3 className="text-xs font-black uppercase italic tracking-tighter text-white">@{username}</h3>
        </div>
        <Button 
          variant="destructive" 
          onClick={endStream} 
          className="h-10 px-5 rounded-full text-[9px] font-black uppercase italic tracking-widest bg-red-600"
        >
          <Power className="size-3 mr-2" /> End
        </Button>
      </header>

      <div className="flex-1 relative z-10 flex flex-col justify-end px-6 pb-12">
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 mb-4 border border-white/10 shadow-2xl">
          <p className="text-[10px] font-bold text-white/80 uppercase leading-relaxed italic">
            <span className="text-primary">SIGNAL:</span> {isPrivate ? "Private Encryption Active. Room Secured." : "Public Node Discovery Active."}
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 flex items-center bg-black/40 backdrop-blur-md rounded-[1.5rem] px-5 py-3 border border-white/10 shadow-2xl">
            <Input 
              value={inputText} 
              onChange={(e) => setInputText(e.target.value)} 
              className="bg-transparent border-none text-white text-xs font-bold placeholder-white/30 h-8" 
              placeholder="Send romantic pulse..." 
            />
            <button className="text-primary hover:text-white transition-colors"><Send className="size-5" /></button>
          </div>
          <Button className="size-14 rounded-2xl bg-primary shadow-2xl shadow-primary/40"><Heart className="size-6 text-white fill-current" /></Button>
        </div>
      </div>
    </div>
  );
}

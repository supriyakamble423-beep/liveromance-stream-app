"use client"

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { 
  X, Eye, Heart, MessageCircle, Send, 
  Lock, Loader2, Zap, ShieldAlert, CheckCircle2, AlertTriangle, Flag, EyeOff, Ghost
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFirebase, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp, query, orderBy, limit, updateDoc, increment, setDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { nsfwModeration } from "@/ai/flows/nsfw-moderation-flow";
import LiveEarningTimer from "@/components/Stream/LiveEarningTimer";

export default function StreamPage() {
  const { id } = useParams();
  const router = useRouter();
  const { firestore, user, areServicesAvailable } = useFirebase();
  const { toast } = useToast();
  
  const [inputText, setInputText] = useState("");
  const [showPrivateWarning, setShowPrivateWarning] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [streamMinutes, setStreamMinutes] = useState(0);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const isHost = user?.uid === id;

  const hostRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'hosts', id as string);
  }, [firestore, id]);

  const { data: host, isLoading } = useDoc(hostRef);

  // Stream Duration Timer for Host
  useEffect(() => {
    if (!isHost || !host?.isLive) return;
    const interval = setInterval(() => {
      setStreamMinutes(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, [isHost, host?.isLive]);

  // NSFW AI Monitoring for Hosts
  useEffect(() => {
    if (!isHost || !host?.isLive || host?.streamType !== 'public' || !areServicesAvailable) return;

    const captureFrame = () => {
      if (videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = 400; 
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.5);
      }
      return null;
    };

    const scanInterval = setInterval(async () => {
      const frame = captureFrame();
      if (frame) {
        try {
          const result = await nsfwModeration({ 
            photoDataUri: frame, 
            streamType: 'public' 
          });

          if (!result.isSafe) {
            toast({ 
              variant: "destructive", 
              title: "AI SAFETY ALERT", 
              description: `Stream terminated: ${result.reason}` 
            });
            
            if (hostRef) {
              updateDoc(hostRef, { 
                isLive: false, 
                violationReason: result.reason,
                reportsCount: increment(5) 
              });
            }
            router.push('/host-p');
          }
        } catch (e) {
          console.error("AI Scan failed", e);
        }
      }
    }, 20000); 

    return () => clearInterval(scanInterval);
  }, [isHost, host?.isLive, host?.streamType, hostRef, router, toast, areServicesAvailable]);

  // Handle Camera for Host
  useEffect(() => {
    const getCameraPermission = async () => {
      if (!isHost) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
        setHasCameraPermission(true);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (error) {
        setHasCameraPermission(false);
        toast({ variant: 'destructive', title: 'Camera Error', description: 'Enable camera to stream.' });
      }
    };
    if (isHost) getCameraPermission();
  }, [isHost]);

  const endStream = async () => {
    if (!isHost || !hostRef) return;
    try {
      await updateDoc(hostRef, { isLive: false, updatedAt: serverTimestamp() });
      router.push('/host-p');
    } catch (e) { console.error(e); }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-[#2D1B2D] flex flex-col items-center justify-center space-y-8 mesh-gradient">
        <div className="relative size-40 animate-pulse logo-glow">
          <Image src="/logo.png" alt="Logo" fill className="object-contain" onError={(e) => { (e.target as any).src = "https://placehold.co/400x400/E11D48/white?text=GL" }} />
        </div>
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isPrivate = host?.streamType === 'private' || host?.streamType === 'invite-only';
  const isBlurred = host?.manualBlur === true;

  // Mock data for simulation
  const displayHost = host || {
    username: 'Demo_Host',
    previewImageUrl: 'https://picsum.photos/seed/demo/600/800',
    viewers: 1250,
    streamType: 'public'
  };

  return (
    <div className="relative h-screen w-full flex flex-col overflow-hidden bg-black mx-auto max-w-lg border-x border-white/10 screen-guard-active">
      <div className="absolute inset-0 z-0 bg-black">
        <div className="relative w-full h-full">
          {isHost ? (
            <video ref={videoRef} autoPlay playsInline muted className={cn("w-full h-full object-cover scale-x-[-1]", isBlurred && "blur-3xl")} />
          ) : (
            <div className="relative w-full h-full">
              <Image src={displayHost.previewImageUrl || "https://picsum.photos/seed/stream/800/1200"} alt="Stream" fill className={cn("object-cover", (isPrivate || isBlurred) ? "blur-3xl opacity-40" : "opacity-90")} />
              {isPrivate && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-xl flex flex-col items-center justify-center space-y-6 px-10 text-center">
                  <div className="size-20 bg-primary/20 rounded-full flex items-center justify-center romantic-glow mb-2">
                    <Lock className="size-10 text-primary animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black uppercase italic text-white tracking-tighter">Private Hub</h2>
                    <p className="text-[10px] font-black text-[#FDA4AF] uppercase tracking-widest">Premium Content</p>
                  </div>
                  <Button onClick={() => setShowPrivateWarning(true)} className="h-16 rounded-2xl bg-primary px-10 text-white font-black uppercase tracking-widest gap-2 shadow-2xl shadow-primary/40 text-sm border-none">
                    <Zap className="size-5 fill-current" /> Pay 50 Coins
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
      </div>

      {isHost && host?.isLive && <LiveEarningTimer minutes={streamMinutes} />}

      <header className="relative z-10 flex items-center justify-between px-4 pt-16 pb-4">
        <div className="flex items-center gap-3 glass-effect rounded-full p-1 pr-4 bg-black/30 backdrop-blur-md border border-white/10">
          <div className="relative size-10 rounded-full border-2 border-primary overflow-hidden">
            <Image src={displayHost.previewImageUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=host"} alt="Host" fill className="object-cover" />
          </div>
          <div>
            <h3 className="text-[11px] font-black leading-none text-white uppercase tracking-tighter italic">@{displayHost.username}</h3>
            <div className="flex items-center gap-1 mt-1">
              <Eye className="size-3 text-primary" />
              <span className="text-[8px] font-black text-white/50 uppercase">{displayHost.viewers || 0} Nodes</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {isHost ? (
            <Button variant="destructive" size="sm" onClick={endStream} className="rounded-full font-black uppercase text-[10px] tracking-widest h-10 px-6 border-none">End Signal</Button>
          ) : (
            <Button variant="secondary" size="icon" onClick={() => router.back()} className="glass-effect size-10 rounded-full text-white border-none bg-white/10"><X className="size-5" /></Button>
          )}
        </div>
      </header>

      <div className="flex-1 relative z-10 flex flex-col justify-end px-4 pb-6">
        <div className="w-full max-w-[85%] flex flex-col gap-2 overflow-y-auto max-h-[35vh] mb-6 no-scrollbar">
            <div className="px-3 py-2 rounded-2xl max-w-fit bg-black/40 backdrop-blur-md border border-white/5">
              <p className="text-xs text-white">
                <span className="font-black mr-2 text-secondary text-[10px] uppercase italic">System:</span>
                <span className="opacity-90">Secure signal established. Welcome.</span>
              </p>
            </div>
          <div ref={chatEndRef} />
        </div>

        {!isPrivate && (
          <footer className="flex items-center gap-3 w-full pb-safe">
            <div className="flex-1 flex items-center glass-effect rounded-[2rem] px-6 h-14 bg-white/10 border-white/10 backdrop-blur-md">
              <Input className="bg-transparent border-none focus-visible:ring-0 text-white placeholder-white/30 font-bold text-sm" placeholder="Send a message..." />
              <button className="ml-2 text-primary"><Send className="size-5" /></button>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
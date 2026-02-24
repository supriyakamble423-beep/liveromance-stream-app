
"use client"

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { 
  X, Eye, Heart, MessageCircle, Send, 
  Lock, Loader2, Zap, ShieldAlert, CheckCircle2, AlertTriangle, Flag, EyeOff, Ghost, Camera, Video, ShieldCheck, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFirebase, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp, query, orderBy, limit, updateDoc, increment, setDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { nsfwModeration } from "@/ai/flows/nsfw-moderation-flow";
import LiveEarningTimer from "@/components/Stream/LiveEarningTimer";
import { Badge } from "@/components/ui/badge";

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
  const [stream, setCameraStream] = useState<MediaStream | null>(null);
  
  // Logic for testing: If ID is simulate_host, treat as host
  const isHost = user?.uid === id || id === 'simulate_host';

  const hostRef = useMemoFirebase(() => {
    if (!firestore || !id || id === 'simulate_host') return null;
    return doc(firestore, 'hosts', id as string);
  }, [firestore, id]);

  const { data: host, isLoading } = useDoc(hostRef);

  // Stream Duration Timer for Host
  useEffect(() => {
    if (!isHost) return;
    const interval = setInterval(() => {
      setStreamMinutes(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, [isHost]);

  // Handle Camera for Host
  useEffect(() => {
    const getCameraPermission = async () => {
      if (!isHost) return;
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }, 
          audio: true
        });
        setHasCameraPermission(true);
        setCameraStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (error) {
        console.error("Camera access denied:", error);
        setHasCameraPermission(false);
        toast({ 
          variant: 'destructive', 
          title: 'Camera Access Denied', 
          description: 'Please enable camera permissions in your browser settings to stream.' 
        });
      }
    };
    
    getCameraPermission();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isHost]);

  const endStream = async () => {
    if (isHost && hostRef) {
      try {
        await updateDoc(hostRef, { isLive: false, updatedAt: serverTimestamp() });
      } catch (e) { console.error(e); }
    }
    router.push('/host-p');
  };

  // NSFW AI Monitoring for Hosts (Simulated if no AI)
  useEffect(() => {
    if (!isHost || !areServicesAvailable) return;

    const scanInterval = setInterval(async () => {
      // AI Scanning Logic placeholder
    }, 20000); 

    return () => clearInterval(scanInterval);
  }, [isHost, areServicesAvailable]);

  if (isLoading && areServicesAvailable) {
    return (
      <div className="h-screen bg-[#2D1B2D] flex flex-col items-center justify-center space-y-8 mesh-gradient">
        <div className="relative size-40 animate-pulse logo-glow">
          <Image src="/logo.png" alt="Logo" fill className="object-contain" onError={(e) => { (e.target as any).src = "https://placehold.co/400x400/E11D48/white?text=GL" }} />
        </div>
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Use real data or fallback simulation data
  const displayHost = host || {
    username: id === 'simulate_host' ? 'Simulated_Host' : 'Anonymous_Node',
    previewImageUrl: 'https://picsum.photos/seed/demo/600/800',
    viewers: 1250,
    streamType: id === 'simulate_host' ? 'public' : 'private',
    rating: 4.9
  };

  const isPrivate = displayHost.streamType === 'private' || displayHost.streamType === 'invite-only';

  return (
    <div className="relative h-screen w-full flex flex-col overflow-hidden bg-black mx-auto max-w-lg border-x border-white/10 screen-guard-active">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 bg-black">
        {isHost ? (
          <div className="relative w-full h-full">
             <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={cn("w-full h-full object-cover scale-x-[-1]", isPrivate && "blur-2xl opacity-60")} 
            />
            {!(hasCameraPermission) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 p-10 text-center">
                <ShieldAlert className="size-16 text-primary mb-4" />
                <h2 className="text-xl font-black uppercase italic mb-2">Camera Blocked</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Enable camera permission in browser to start node broadcast.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="relative w-full h-full">
            <Image 
              src={displayHost.previewImageUrl || "https://picsum.photos/seed/stream/800/1200"} 
              alt="Stream" 
              fill 
              className={cn("object-cover", isPrivate ? "blur-3xl opacity-40" : "opacity-90")} 
            />
            {isPrivate && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-xl flex flex-col items-center justify-center space-y-6 px-10 text-center">
                <div className="size-24 bg-primary/20 rounded-full flex items-center justify-center romantic-glow mb-2">
                  <Lock className="size-12 text-primary animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-4xl font-black uppercase italic text-white tracking-tighter">Private Room</h2>
                  <p className="text-xs font-black text-[#FDA4AF] uppercase tracking-[0.3em]">Premium Access Only</p>
                </div>
                <Button className="h-16 rounded-[2rem] bg-primary px-10 text-white font-black uppercase tracking-widest gap-2 shadow-2xl shadow-primary/40 text-sm border-none">
                  <Zap className="size-5 fill-current" /> Unlock for 50 Coins
                </Button>
              </div>
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none" />
      </div>

      {/* Live Status Overlay */}
      <div className="absolute top-6 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none">
         <div className="flex gap-2">
            <Badge className={cn(
              "h-8 px-4 rounded-full text-[10px] font-black uppercase tracking-widest border-none shadow-xl",
              isPrivate ? "bg-red-600 text-white animate-pulse" : "bg-green-500 text-white"
            )}>
              {isPrivate ? <Lock className="size-3 mr-2" /> : <Zap className="size-3 mr-2 fill-current" />}
              {isPrivate ? "Private Mode" : "Public Mode"}
            </Badge>
            <Badge className="h-8 px-4 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-white">
              <Eye className="size-3 mr-2 text-primary" /> {displayHost.viewers || 0}
            </Badge>
         </div>
      </div>

      {isHost && <LiveEarningTimer minutes={streamMinutes} />}

      {/* Header Info */}
      <header className="relative z-10 flex items-center justify-between px-4 pt-20 pb-4">
        <div className="flex items-center gap-3 glass-effect rounded-full p-1 pr-5 bg-black/30 backdrop-blur-md border border-white/10">
          <div className="relative size-12 rounded-full border-2 border-primary overflow-hidden">
            <Image src={displayHost.previewImageUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=host"} alt="Host" fill className="object-cover" />
          </div>
          <div>
            <h3 className="text-xs font-black leading-none text-white uppercase tracking-tighter italic">@{displayHost.username}</h3>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Host Node</p>
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

      {/* Interaction Area */}
      <div className="flex-1 relative z-10 flex flex-col justify-end px-6 pb-10">
        <div className="w-full max-w-[85%] flex flex-col gap-3 overflow-y-auto max-h-[30vh] mb-8 no-scrollbar">
            <div className="px-4 py-3 rounded-2xl max-w-fit bg-black/60 backdrop-blur-lg border border-white/10 shadow-xl">
              <p className="text-[11px] text-white font-medium leading-relaxed">
                <span className="font-black mr-2 text-primary text-[10px] uppercase italic">System:</span>
                <span className="opacity-90">Secure signal established. {isPrivate ? "Encryption Active." : "Broadcast is Public."}</span>
              </p>
            </div>
            
            {/* Simulated Chat */}
            {[1, 2].map(i => (
              <div key={i} className="px-4 py-2 rounded-2xl max-w-fit bg-white/5 backdrop-blur-md border border-white/5 animate-in slide-in-from-left-4">
                <p className="text-[10px] text-white">
                  <span className="font-black mr-2 text-secondary italic">User_{i*421}:</span>
                  <span className="opacity-70">Looking good! Keep it up.</span>
                </p>
              </div>
            ))}
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
      
      {/* Decorative Scanline for Host */}
      {isHost && (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden opacity-20">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_15px_#E11D48] animate-scan" />
        </div>
      )}
    </div>
  );
}

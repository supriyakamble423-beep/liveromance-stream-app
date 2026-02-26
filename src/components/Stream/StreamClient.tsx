'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  X, Heart, Send, Lock, Zap, UserPlus, Star, Mail, Music, 
  Share2, MoreVertical, Loader2, Power, ShieldOff, ShieldCheck 
} from "lucide-react";
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

  // States
  const [isGiftOpen, setIsGiftOpen] = useState(false);
  const [bonusTargetReached, setBonusTargetReached] = useState(false);
  const [streamMinutes, setStreamMinutes] = useState(0);
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

  // 1. Logic: Bonus Target Pop-up (Every 30 mins)
  useEffect(() => {
    if (streamMinutes > 0 && streamMinutes % 30 === 0) {
      setBonusTargetReached(true);
      const timer = setTimeout(() => setBonusTargetReached(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [streamMinutes]);

  // 2. Logic: Minute Tracker
  useEffect(() => {
    const interval = setInterval(() => setStreamMinutes(p => p + 1), 60000);
    return () => clearInterval(interval);
  }, []);

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
      }
    }
    getCamera();
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isHost, cameraStream]);

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
        title: nextType === 'private' ? "PRIVATE MODE ON" : "PUBLIC MODE ON",
        variant: nextType === 'private' ? "destructive" : "default" 
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsUpdating(false);
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

  if (isUserLoading || isHostLoading || (!host && areServicesAvailable && id !== 'simulate_host')) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4">
        <Loader2 className="size-10 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Establishing Grid</p>
      </div>
    );
  }

  const displayHost = host || {
    username: id === 'simulate_host' ? 'Simulate_Host' : 'Anonymous',
    streamType: 'public',
    manualBlur: false,
    previewImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`
  };

  const isPrivate = displayHost.streamType === 'private';
  const isBlur = isPrivate || displayHost.manualBlur;

  return (
    <div className="relative h-[100dvh] w-full max-w-[430px] mx-auto bg-black overflow-hidden font-sans border-x border-white/10">
      
      {/* VIDEO BACKGROUND */}
      <div className="absolute inset-0 z-0">
        {isHost ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn("w-full h-full object-cover scale-x-[-1] transition-all duration-700", isBlur && "blur-3xl opacity-50")}
          />
        ) : (
          <div className="relative w-full h-full">
             <Image 
              src={displayHost.previewImageUrl || "https://picsum.photos/seed/host/600/800"} 
              alt="Stream" 
              fill 
              className={cn("object-cover transition-all duration-700", isBlur && "blur-3xl opacity-50")} 
             />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
      </div>

      {/* TOP HEADER */}
      <div className="absolute top-0 left-0 right-0 p-6 pt-12 flex justify-between items-start z-50">
        <div className="flex items-center gap-3">
          {/* REVENUE & TARGET BOX (Replaced Image Box) */}
          <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-1.5 px-4 shadow-2xl flex flex-col items-start min-w-[120px]">
             {isHost ? (
               <LiveEarningTimer minutes={streamMinutes} minimal={true} />
             ) : (
               <div className="py-1">
                 <h3 className="text-white text-xs font-bold tracking-tight italic">@{displayHost.username}</h3>
                 <p className="text-white/60 text-[9px] flex items-center gap-1 mt-0.5">
                   <Zap size={8} className="text-yellow-400" /> {displayHost.viewers || '1.2k'} Live
                 </p>
               </div>
             )}
          </div>
          
          {/* USERNAME (Only if Host to keep it clean) */}
          {isHost && (
            <div className="hidden sm:block">
              <h3 className="text-white text-sm font-bold tracking-tight italic">@{displayHost.username}</h3>
              <p className="text-white/60 text-[9px] flex items-center gap-1"><Zap size={10} className="text-yellow-400" /> {displayHost.viewers || '1.2k'} Live</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 items-end">
          {isHost && (
            <button 
              onClick={toggleMode}
              disabled={isUpdating}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-xl",
                isPrivate ? "bg-red-600 text-white" : "bg-green-500 text-white"
              )}
            >
              {isUpdating ? <Loader2 size={12} className="animate-spin" /> : isPrivate ? <Lock size={12} /> : <Zap size={12} />}
              {isPrivate ? "MODE: PRIVATE" : "MODE: PUBLIC"}
            </button>
          )}
          <div className="flex gap-2">
            {isHost && (
               <button onClick={endStream} className="p-2 bg-red-600/20 backdrop-blur-md rounded-full text-red-500 border border-red-500/20"><Power size={20}/></button>
            )}
            <button onClick={() => router.back()} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/10"><X size={20}/></button>
          </div>
        </div>
      </div>

      {/* BONUS TARGET POPUP (30 MINS) */}
      {bonusTargetReached && (
        <div className="absolute inset-0 flex items-center justify-center z-[100] animate-in zoom-in duration-300 pointer-events-none">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-600 p-8 rounded-[3rem] text-center shadow-[0_0_50px_rgba(251,191,36,0.5)] romantic-glow">
             <div className="text-5xl mb-4">🏆</div>
             <h2 className="text-2xl font-black text-white italic uppercase">30 Min Target!</h2>
             <p className="text-white/90 font-bold text-sm">Bonus Diamonds Unlocked!</p>
          </div>
        </div>
      )}

      {/* PRIVATE REQUEST POPUP */}
      {isHost && <PrivateRequestPopup firestore={firestore} hostId={effectiveId} />}

      {/* SIDE ACTIONS */}
      <div className="absolute right-4 bottom-48 flex flex-col gap-4 z-40">
        {[Heart, Share2, MoreVertical].map((Icon, i) => (
          <button key={i} className="size-12 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/10 shadow-2xl hover:scale-110 transition-transform">
            <Icon size={24} />
          </button>
        ))}
      </div>

      {/* CHAT & CONTROLS */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-10 z-40 space-y-4">
        
        {/* Tip Badges */}
        <div className="flex flex-col gap-2 w-40">
           <div className="flex items-center justify-between bg-black/40 backdrop-blur-md border border-white/10 p-2 rounded-xl">
              <div className="flex items-center gap-2 text-white text-[10px] font-bold uppercase"><Mail size={12} className="text-primary"/> DM</div>
              <span className="text-yellow-400 text-[10px] font-black uppercase">10 TK</span>
           </div>
           <div className="flex items-center justify-between bg-black/40 backdrop-blur-md border border-white/10 p-2 rounded-xl">
              <div className="flex items-center gap-2 text-white text-[10px] font-bold uppercase"><Music size={12} className="text-primary"/> SONG</div>
              <span className="text-yellow-400 text-[10px] font-black uppercase">50 TK</span>
           </div>
        </div>

        {/* Input & Gift */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white/10 backdrop-blur-2xl border border-white/10 h-14 rounded-full flex items-center px-6">
            <input 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-white text-sm w-full placeholder:text-white/30" 
              placeholder="Say something..." 
            />
            <button className="text-primary"><Send size={20}/></button>
          </div>
          <button 
            onClick={() => setIsGiftOpen(true)}
            className="size-14 bg-yellow-400 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.4)] animate-bounce"
          >
            <Star size={28} className="text-black fill-current" />
          </button>
        </div>
      </div>

      {/* GIFT DRAWER */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-3xl rounded-t-[40px] border-t border-white/10 z-[150] transition-transform duration-500 ease-out p-8 pt-4",
        isGiftOpen ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" onClick={() => setIsGiftOpen(false)} />
        <div className="flex justify-between items-center mb-8">
          <h4 className="text-xl font-black text-white italic uppercase">Send a Gift</h4>
          <div className="bg-white/10 px-4 py-2 rounded-full text-yellow-400 font-bold text-sm uppercase">💰 1,250</div>
        </div>
        <div className="grid grid-cols-4 gap-6 mb-10">
          {['🌹', '🍦', '💎', '🚀'].map((emoji, i) => (
            <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="size-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl group-active:scale-90 transition-all border border-white/5">
                {emoji}
              </div>
              <span className="text-yellow-400 text-[10px] font-black italic uppercase">{(i + 1) * 10} TK</span>
            </div>
          ))}
        </div>
        <Button onClick={() => setIsGiftOpen(false)} className="w-full h-16 bg-primary rounded-2xl font-black text-white italic uppercase shadow-2xl border-none">Send Now</Button>
      </div>

    </div>
  );
}

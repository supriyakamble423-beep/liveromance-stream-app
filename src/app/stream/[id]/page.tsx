"use client"

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { 
  X, Eye, Heart, Gift, MessageCircle, Send, Sparkles, 
  Lock, Loader2, Repeat, UserCheck, UserX, Ghost, Zap,
  Trophy, Medal, Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFirebase, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp, query, orderBy, limit, setDoc, updateDoc, increment } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { nsfwModeration } from "@/ai/flows/nsfw-moderation-flow";
import LiveEarningTimer from "@/components/Stream/LiveEarningTimer";

export default function StreamPage() {
  const { id } = useParams();
  const router = useRouter();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [inputText, setInputText] = useState("");
  const [cameraMode, setCameraMode] = useState<"user" | "environment">("user");
  const [isModerating, setIsModerating] = useState(false);
  const [isUpdatingMode, setIsUpdatingMode] = useState(false);
  const [isMaskOn, setIsMaskOn] = useState(false);
  const [secondsLive, setSecondsLive] = useState(0);
  const [achievedMilestones, setAchievedMilestones] = useState<number[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const isHost = user?.uid === id;

  const hostRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'hosts', id as string);
  }, [firestore, id]);

  const { data: host, isLoading } = useDoc(hostRef);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(
      collection(firestore, 'streams', id as string, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );
  }, [firestore, id]);

  const { data: messages } = useCollection(messagesQuery);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // LIVE TIMER LOGIC
  useEffect(() => {
    if (!isHost || !host?.isLive || !host?.streamStartTime) {
      setSecondsLive(0);
      return;
    }
    
    // Check if it's a Firestore Timestamp or a string
    const startTime = host.streamStartTime?.toDate?.()?.getTime() || new Date(host.streamStartTime).getTime();
    
    const updateTimer = () => {
      const now = Date.now();
      setSecondsLive(Math.floor((now - startTime) / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isHost, host?.isLive, host?.streamStartTime]);

  const minutesLive = Math.floor(secondsLive / 60);

  // MILESTONE ALERTS & EARNINGS LOGIC
  useEffect(() => {
    if (!isHost || minutesLive === 0) return;

    if (minutesLive >= 15 && !achievedMilestones.includes(15)) {
      setAchievedMilestones(prev => [...prev, 15]);
      toast({ 
        title: "🥉 Bronze Bonus!", 
        description: "15 minutes live! You are now a Rising Star.",
        className: "bg-[#CD7F32] text-white border-none shadow-[0_0_20px_#CD7F32]"
      });
    }
    if (minutesLive >= 30 && !achievedMilestones.includes(30)) {
      setAchievedMilestones(prev => [...prev, 30]);
      toast({ 
        title: "🥈 Silver Bonus!", 
        description: "30 minutes live! 1.5x Multiplier UNLOCKED.",
        className: "bg-cyan-500 text-white border-none shadow-[0_0_20px_#22d3ee]"
      });
    }
    if (minutesLive >= 60 && !achievedMilestones.includes(60)) {
      setAchievedMilestones(prev => [...prev, 60]);
      toast({ 
        title: "🥇 Gold Jackpot!", 
        description: "1 Hour Live! 2x Multiplier ACTIVE.",
        className: "bg-yellow-500 text-black border-none shadow-[0_0_25px_#eab308]"
      });
    }
  }, [minutesLive, achievedMilestones, isHost, toast]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const getCameraPermission = async () => {
      if (!isHost) return;
      try {
        if (videoRef.current?.srcObject) {
          const prevStream = videoRef.current.srcObject as MediaStream;
          prevStream.getTracks().forEach(t => t.stop());
        }

        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: cameraMode }, 
          audio: true 
        });
        
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };

    if (isHost) getCameraPermission();

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [isHost, cameraMode]);

  useEffect(() => {
    if (!isHost || host?.streamType !== 'public' || !host?.isLive) return;

    const moderationInterval = setInterval(async () => {
      if (!videoRef.current || isModerating) return;

      setIsModerating(true);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 400; 
        canvas.height = 300;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const photoData = canvas.toDataURL("image/jpeg", 0.6);
          
          const result = await nsfwModeration({ 
            photoDataUri: photoData, 
            streamType: 'public' 
          });

          if (!result.isSafe) {
            toast({ 
              variant: "destructive", 
              title: "AI AUTO-CUT ACTIVE", 
              description: "Safety Bot detected prohibited content. Terminating broadcast." 
            });
            
            if (hostRef) {
              await updateDoc(hostRef, { 
                isLive: false, 
                nsfwReason: result.reason,
                updatedAt: serverTimestamp() 
              });
              router.push('/host-p');
            }
          }
        }
      } catch (e) {
        console.error("Moderation error:", e);
      } finally {
        setIsModerating(false);
      }
    }, 10000); 

    return () => clearInterval(moderationInterval);
  }, [isHost, host?.streamType, host?.isLive, hostRef, isModerating, router, toast]);

  const toggleStreamMode = async () => {
    if (!isHost || !hostRef || isUpdatingMode) return;
    setIsUpdatingMode(true);
    const newType = host?.streamType === 'public' ? 'private' : 'public';
    try {
      await updateDoc(hostRef, { 
        streamType: newType,
        updatedAt: serverTimestamp()
      });
      toast({ 
        title: `Switched to ${newType.toUpperCase()}`, 
        description: newType === 'public' ? "Stream-X Safety Bot: Active Monitoring ON" : "Private Mode: Monitoring OFF"
      });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to switch mode.' });
    } finally {
      setIsUpdatingMode(false);
    }
  };

  const endStream = async () => {
    if (!isHost || !hostRef) return;
    try {
      // Calculate bonus based on duration
      let bonus = 0;
      if (minutesLive >= 60) bonus = 500;
      else if (minutesLive >= 30) bonus = 150;
      else if (minutesLive >= 15) bonus = 50;

      await updateDoc(hostRef, {
        isLive: false,
        earnings: increment(bonus),
        updatedAt: serverTimestamp()
      });

      if (bonus > 0) {
        toast({ title: "Session Bonus!", description: `You earned ${bonus} bonus coins!` });
      }
      router.push('/host-p');
    } catch (e) {
      toast({ variant: "destructive", title: "Error ending stream" });
    }
  }

  const sendMessage = () => {
    if (!inputText.trim() || !user || !firestore || !id) return;
    
    const msgData = {
      text: inputText,
      senderId: user.uid,
      senderName: user.displayName || `Guest_${user.uid.slice(0, 4)}`,
      timestamp: serverTimestamp(),
    };

    addDoc(collection(firestore, 'streams', id as string, 'messages'), msgData)
      .catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `streams/${id}/messages`,
          operation: 'create',
          requestResourceData: msgData
        }));
      });
    setInputText("");
  };

  const sendTip = (label: string, cost: number) => {
    if (!user || !firestore || !id) {
      toast({ variant: "destructive", title: "Error", description: "Sign in to send tips." });
      return;
    }

    const tipData = {
      text: `🎁 Tipped ${cost} Coins for [${label}]`,
      senderId: user.uid,
      senderName: user.displayName || `Guest_${user.uid.slice(0, 4)}`,
      timestamp: serverTimestamp(),
      type: 'tip',
      amount: cost
    };

    addDoc(collection(firestore, 'streams', id as string, 'messages'), tipData)
      .then(() => {
        toast({ title: "Tip Sent!", description: `${cost} Coins sent to host.` });
      })
      .catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `streams/${id}/messages`,
          operation: 'create',
          requestResourceData: tipData
        }));
      });
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-[#2D1B2D] flex flex-col items-center justify-center space-y-8 mesh-gradient">
        <div className="relative size-40 animate-pulse drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">
          <Image 
            src="/logo.png" 
            alt="Loading Signal..." 
            fill 
            className="object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "https://placehold.co/400x400/E11D48/white?text=GL";
            }}
          />
        </div>
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isPrivate = host?.streamType === 'private' || host?.streamType === 'invite-only';

  return (
    <div className="relative h-screen w-full flex flex-col overflow-hidden bg-black mx-auto max-w-lg border-x border-white/10">
      {/* Video layer */}
      <div className="absolute inset-0 z-0 bg-black">
        {isHost ? (
          <div className="relative w-full h-full">
            <video ref={videoRef} autoPlay playsInline muted className={cn("w-full h-full object-cover scale-x-[-1]")} />
            {isMaskOn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in fade-in duration-300">
                <div className="relative romantic-glow">
                  <Heart className="size-48 text-primary fill-current opacity-90 animate-pulse shadow-[0_0_50px_rgba(225,29,72,0.8)]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Ghost className="size-16 text-white opacity-40" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative w-full h-full">
            <Image 
              src={host?.previewImageUrl || "https://picsum.photos/seed/stream/800/1200"} 
              alt="Stream" 
              fill 
              className={cn("object-cover", isPrivate ? "blur-3xl opacity-40" : "opacity-90")} 
            />
            {isPrivate && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-xl" />
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80" />
      </div>

      {/* STAY-TO-EARN TIMER COMPONENT */}
      {isHost && host?.isLive && <LiveEarningTimer minutes={minutesLive} />}

      {/* Stream-X Bot Status Bar */}
      <div className={cn(
        "absolute left-0 right-0 z-40 flex justify-center px-4 transition-all duration-500",
        isHost ? "top-4" : "top-4"
      )}>
        <div className="flex items-center gap-3 glass-effect bg-black/40 backdrop-blur-xl rounded-full px-4 py-2 border border-white/10 shadow-2xl">
          <div className={cn(
            "size-2 rounded-full shadow-[0_0_10px]",
            isModerating ? "bg-amber-500 shadow-amber-500 animate-pulse" : "bg-green-500 shadow-green-500"
          )} />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
            {host?.streamType === 'public' ? 'Stream-X AI: Scanning' : 'Private Hub: Secure'}
          </span>
          <div className="h-3 w-px bg-white/20" />
          <div className="flex items-center gap-1">
            <Eye className="size-3 text-white/60" />
            <span className="text-[10px] font-black text-white/60">{host?.viewers || 0}</span>
          </div>
        </div>
      </div>

      {isHost && (
        <div className="absolute top-[165px] left-0 right-0 z-40 flex flex-col items-center gap-3">
          <div className="flex gap-2">
            <Button 
              onClick={toggleStreamMode} 
              disabled={isUpdatingMode}
              className={cn(
                "rounded-full h-10 px-6 gap-2 text-[10px] font-black uppercase tracking-widest shadow-2xl backdrop-blur-md border-2 transition-all",
                host?.streamType === 'public' 
                  ? "bg-green-500/20 border-green-500 text-green-500 hover:bg-green-500/30" 
                  : "bg-primary/20 border-primary text-primary hover:bg-primary/30"
              )}
            >
              {isUpdatingMode ? <Loader2 className="size-3 animate-spin" /> : <Repeat className="size-3" />}
              {host?.streamType === 'public' ? 'SFW Mode' : 'Adult Mode'}
            </Button>

            <Button 
              onClick={() => setIsMaskOn(!isMaskOn)} 
              className={cn(
                "rounded-full h-10 px-6 gap-2 text-[10px] font-black uppercase tracking-widest shadow-2xl backdrop-blur-md border-2 transition-all",
                isMaskOn 
                  ? "bg-red-600 border-white text-white shadow-[0_0_20px_#ffffff]" 
                  : "bg-white/10 border-pink-500 text-pink-500 hover:bg-pink-500/10 shadow-[0_0_20px_rgba(255,105,180,0.3)]"
              )}
            >
              {isMaskOn ? <UserCheck className="size-3" /> : <UserX className="size-3" />}
              {isMaskOn ? 'Mask On' : 'Show Face'}
            </Button>
          </div>
        </div>
      )}

      <header className="relative z-10 flex items-center justify-between px-4 pt-16 pb-4">
        <div className="flex items-center gap-3 glass-effect rounded-full p-1 pr-4 bg-black/30 backdrop-blur-md border border-white/10">
          <div className="relative size-10 rounded-full border-2 border-primary overflow-hidden">
            <Image src={host?.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`} alt="Host" fill className="object-cover" />
          </div>
          <div>
            <h3 className="text-[11px] font-black leading-none text-white uppercase tracking-tighter truncate max-w-[80px]">@{host?.username || 'Host'}</h3>
            <div className="flex items-center gap-1 mt-1">
              <Sparkles className="size-3 text-amber-500" />
              <span className="text-[8px] font-black text-white/50 uppercase">Verified</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {isHost ? (
            <Button variant="destructive" size="sm" onClick={endStream} className="rounded-full font-black uppercase text-[10px] tracking-widest h-10 px-6">
              End Stream
            </Button>
          ) : (
            <Button variant="secondary" size="icon" onClick={() => router.back()} className="glass-effect size-10 rounded-full text-white border-none bg-white/10 hover:bg-white/20">
              <X className="size-5" />
            </Button>
          )}
        </div>
      </header>

      {isPrivate && !isHost && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 bg-black/60 backdrop-blur-md text-center space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="size-24 rounded-[3rem] bg-primary/20 flex items-center justify-center shadow-[0_0_50px_rgba(225,29,72,0.4)]">
            <Lock className="size-12 text-primary animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black uppercase italic text-white tracking-tighter">Private Hub</h2>
            <p className="text-xs text-slate-300 font-bold uppercase tracking-[0.2em]">Unlock this session for 50 Coins</p>
          </div>
          <Button className="h-16 w-full max-w-[280px] rounded-3xl bg-primary hover:bg-primary/90 text-sm font-black uppercase tracking-widest gap-2 text-white shadow-2xl shadow-primary/40">
            <Zap className="size-5 fill-current" /> Send 50 Coins Zap
          </Button>
        </div>
      )}

      <div className="flex-1 relative z-10 flex flex-col justify-end px-4 pb-6">
        <div className="w-full max-w-[85%] flex flex-col gap-2 overflow-y-auto max-h-[35vh] mb-6 no-scrollbar mask-gradient-top">
          {messages?.map((m) => (
            <div key={m.id} className={cn(
              "px-3 py-2 rounded-2xl max-w-fit bg-black/40 backdrop-blur-md border border-white/5 animate-in slide-in-from-left-2", 
              m.type === 'tip' && "border-amber-500/50 bg-amber-500/10 romantic-glow"
            )}>
              <p className="text-xs text-white">
                <span className="font-black mr-2 text-secondary text-[10px] uppercase">{m.senderName}:</span>
                <span className="opacity-90 font-medium">{m.text}</span>
              </p>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="absolute right-4 bottom-28 flex flex-col gap-4">
          <button className="size-14 glass-effect rounded-full flex items-center justify-center text-white bg-white/10 hover:bg-primary/20 transition-all active:scale-90"><Heart className="size-7" /></button>
          <button className="size-14 bg-secondary/80 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-all"><Gift className="size-7" /></button>
        </div>

        {(!isPrivate || isHost) && (
          <footer className="flex items-center gap-3 w-full">
            <div className="flex-1 flex items-center glass-effect rounded-[2rem] px-6 py-3 h-14 bg-white/10 border-white/10 backdrop-blur-md">
              <Input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="bg-transparent border-none focus-visible:ring-0 text-white placeholder-white/30 font-bold text-sm" 
                placeholder="Talk to host..." 
              />
              <button onClick={sendMessage} className="ml-2 text-primary hover:scale-110 transition-transform"><Send className="size-5" /></button>
            </div>
          </footer>
        )}
      </div>

      {!isHost && (
        <div className="absolute top-32 right-4 z-10 w-48">
          <div className="glass-effect rounded-[2.5rem] p-5 flex flex-col gap-3 shadow-2xl border-white/10 bg-black/40 backdrop-blur-xl animate-in slide-in-from-right-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="size-3 text-amber-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Premium Menu</span>
            </div>
            {[
              { label: "Direct Message", cost: 50 },
              { label: "Bite Lips", cost: 100 },
              { label: "Full View", cost: 500 }
            ].map((tip) => (
              <div 
                key={tip.label} 
                onClick={() => sendTip(tip.label, tip.cost)}
                className="flex items-center justify-between text-[10px] hover:bg-white/10 p-2.5 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-white/5"
              >
                <span className="text-slate-100 font-bold uppercase tracking-tight">{tip.label}</span>
                <span className="bg-primary/20 text-primary font-black px-2.5 py-1 rounded-xl">{tip.cost}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

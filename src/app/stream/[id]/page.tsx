
"use client"

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { 
  X, Eye, Heart, Gift, MessageCircle, Send, Sparkles, 
  Lock, Loader2, Repeat, UserCheck, UserX, Ghost, Zap,
  Trophy, Medal, Crown, Camera
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

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

  useEffect(() => {
    if (!isHost || !host?.isLive || !host?.streamStartTime) {
      setSecondsLive(0);
      return;
    }
    
    const startTime = host.streamStartTime?.toDate?.()?.getTime() || new Date(host.streamStartTime).getTime();
    
    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.floor((now - startTime) / 1000);
      setSecondsLive(diff > 0 ? diff : 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isHost, host?.isLive, host?.streamStartTime]);

  const minutesLive = Math.floor(secondsLive / 60);

  useEffect(() => {
    if (!isHost || minutesLive === 0) return;

    if (minutesLive >= 15 && !achievedMilestones.includes(15)) {
      setAchievedMilestones(prev => [...prev, 15]);
      toast({ 
        title: "🥉 BRONZE BONUS UNLOCKED!", 
        description: "15 minutes live! +50 Coins pending."
      });
    }
    if (minutesLive >= 30 && !achievedMilestones.includes(30)) {
      setAchievedMilestones(prev => [...prev, 30]);
      toast({ 
        title: "🥈 SILVER MULTIPLIER ACTIVE!", 
        description: "30 mins live! 1.5x Multiplier UNLOCKED."
      });
    }
  }, [minutesLive, achievedMilestones, isHost, toast]);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!isHost) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    };

    if (isHost) getCameraPermission();
  }, [isHost]);

  const toggleStreamMode = async () => {
    if (!isHost || !hostRef || isUpdatingMode) return;
    setIsUpdatingMode(true);
    const newType = host?.streamType === 'public' ? 'private' : 'public';
    try {
      await updateDoc(hostRef, { 
        streamType: newType,
        updatedAt: serverTimestamp()
      });
      toast({ title: `Switched to ${newType.toUpperCase()}` });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to switch mode.' });
    } finally {
      setIsUpdatingMode(false);
    }
  };

  const endStream = async () => {
    if (!isHost || !hostRef) return;
    try {
      await updateDoc(hostRef, {
        isLive: false,
        updatedAt: serverTimestamp()
      });
      router.push('/host-p');
    } catch (e) {
      toast({ variant: "destructive", title: "Sync failed" });
    }
  };

  const sendMessage = () => {
    if (!inputText.trim() || !user || !firestore || !id) return;
    
    const msgData = {
      text: inputText,
      senderId: user.uid,
      senderName: user.displayName || `Guest_${user.uid.slice(0, 4)}`,
      timestamp: serverTimestamp(),
    };

    addDoc(collection(firestore, 'streams', id as string, 'messages'), msgData);
    setInputText("");
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-[#2D1B2D] flex flex-col items-center justify-center space-y-8 mesh-gradient">
        <div className="relative size-40 animate-pulse drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">
          <Image src="/logo.png" alt="Loading..." fill className="object-contain" />
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
            {!(hasCameraPermission) && isHost && (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                   <Alert variant="destructive" className="bg-black/60 backdrop-blur-md">
                      <AlertTitle>Camera Access Required</AlertTitle>
                      <AlertDescription>Please allow camera access to use this feature.</AlertDescription>
                   </Alert>
                </div>
            )}
            {isMaskOn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/40 backdrop-blur-md">
                <Heart className="size-48 text-primary fill-current opacity-60 animate-pulse" />
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
              <div className="absolute inset-0 bg-black/40 backdrop-blur-xl flex flex-col items-center justify-center space-y-6">
                 <Lock className="size-16 text-primary animate-pulse" />
                 <h2 className="text-3xl font-black uppercase italic text-white tracking-tighter">Private Room</h2>
                 <Button className="h-14 rounded-2xl bg-primary px-8 text-white font-black uppercase tracking-widest gap-2">
                    <Zap className="size-5 fill-current" /> Pay 50 Coins
                 </Button>
              </div>
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
      </div>

      {isHost && host?.isLive && <LiveEarningTimer minutes={minutesLive} />}

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
            <Button variant="destructive" size="sm" onClick={endStream} className="rounded-full font-black uppercase text-[10px] tracking-widest h-10 px-6 shadow-2xl">
              End Stream
            </Button>
          ) : (
            <Button variant="secondary" size="icon" onClick={() => router.back()} className="glass-effect size-10 rounded-full text-white border-none bg-white/10">
              <X className="size-5" />
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 relative z-10 flex flex-col justify-end px-4 pb-6">
        <div className="w-full max-w-[85%] flex flex-col gap-2 overflow-y-auto max-h-[35vh] mb-6 no-scrollbar">
          {messages?.map((m) => (
            <div key={m.id} className="px-3 py-2 rounded-2xl max-w-fit bg-black/40 backdrop-blur-md border border-white/5 animate-in slide-in-from-left-2">
              <p className="text-xs text-white">
                <span className="font-black mr-2 text-secondary text-[10px] uppercase">{m.senderName}:</span>
                <span className="opacity-90">{m.text}</span>
              </p>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {isHost && (
          <div className="flex gap-2 mb-4">
             <Button onClick={toggleStreamMode} variant="outline" className="rounded-full bg-black/40 text-xs font-black uppercase border-white/10 h-10 px-6">
                {host?.streamType === 'public' ? 'Go Private' : 'Go Public'}
             </Button>
             <Button onClick={() => setIsMaskOn(!isMaskOn)} variant="outline" className="rounded-full bg-black/40 text-xs font-black uppercase border-white/10 h-10 px-6">
                {isMaskOn ? 'Show Face' : 'Mask On'}
             </Button>
          </div>
        )}

        {(!isPrivate || isHost) && (
          <footer className="flex items-center gap-3 w-full">
            <div className="flex-1 flex items-center glass-effect rounded-[2rem] px-6 h-14 bg-white/10 border-white/10 backdrop-blur-md">
              <Input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="bg-transparent border-none focus-visible:ring-0 text-white placeholder-white/30 font-bold text-sm" 
                placeholder="Type message..." 
              />
              <button onClick={sendMessage} className="ml-2 text-primary"><Send className="size-5" /></button>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

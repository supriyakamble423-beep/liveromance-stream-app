"use client"

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { 
  X, Eye, Heart, MessageCircle, Send, 
  Lock, Loader2, Zap, ShieldAlert, CheckCircle2, AlertTriangle, Flag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFirebase, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp, query, orderBy, limit, updateDoc, increment } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import LiveEarningTimer from "@/components/Stream/LiveEarningTimer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { processPayment } from "@/lib/payments";

export default function StreamPage() {
  const { id } = useParams();
  const router = useRouter();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  
  const [inputText, setInputText] = useState("");
  const [secondsLive, setSecondsLive] = useState(0);
  const [achievedMilestones, setAchievedMilestones] = useState<number[]>([]);
  const [showPrivateWarning, setShowPrivateWarning] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const isHost = user?.uid === id;

  const hostRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'hosts', id as string);
  }, [firestore, id]);

  const { data: host, isLoading } = useDoc(hostRef);

  // Auto-terminate logic for public streams if reports >= 3
  useEffect(() => {
    if (host?.isLive && host?.streamType === 'public' && (host?.reportsCount || 0) >= 3) {
      if (isHost) {
        toast({ 
          variant: "destructive", 
          title: "Session Terminated", 
          description: "Multiple nudity reports received. Account flagged." 
        });
        endStream();
      } else {
        router.push('/global');
        toast({ title: "Stream Offline", description: "Node terminated due to policy violation." });
      }
    }
  }, [host?.reportsCount, host?.isLive, host?.streamType, isHost]);

  const sessionRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !id) return null;
    return doc(firestore, 'streamSessions', `${user.uid}_${id}`);
  }, [firestore, user?.uid, id]);

  const { data: sessionData } = useDoc(sessionRef);
  const isSessionActive = sessionData && new Date(sessionData.expiresAt.toDate()) > new Date();

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
      toast({ title: "🥉 BRONZE BONUS UNLOCKED!", description: "15 minutes live! +50 Coins pending." });
    }
    if (minutesLive >= 30 && !achievedMilestones.includes(30)) {
      setAchievedMilestones(prev => [...prev, 30]);
      toast({ title: "🥈 SILVER MULTIPLIER ACTIVE!", description: "30 mins live! 1.5x Multiplier UNLOCKED." });
    }
  }, [minutesLive, achievedMilestones, isHost, toast]);

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

  const handleJoinPrivate = async () => {
    if (!user || !firestore || !host) return;
    setIsProcessingPayment(true);
    try {
      const res = await processPayment(firestore, 'private_session', 50, user.uid, host.id);
      if (res.success) {
        setShowPrivateWarning(false);
        toast({ title: "Access Granted!", description: "30-min session started. Reconnect free if dropped." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Payment Failed", description: "Insufficient coins." });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const reportNudity = async () => {
    if (!hostRef || isHost) return;
    try {
      await updateDoc(hostRef, { reportsCount: increment(1) });
      toast({ title: "Report Submitted", description: "System safety scan initiated." });
    } catch (e) {
      console.error(e);
    }
  };

  const endStream = async () => {
    if (!isHost || !hostRef) return;
    try {
      await updateDoc(hostRef, { isLive: false, updatedAt: serverTimestamp() });
      router.push('/host-p');
    } catch (e) { console.error(e); }
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
        <div className="relative size-40 animate-pulse"><Image src="/logo.png" alt="Logo" fill className="object-contain" /></div>
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isPrivate = host?.streamType === 'private' || host?.streamType === 'invite-only';
  const canAccessStream = !isPrivate || isHost || isSessionActive;

  return (
    <div className="relative h-screen w-full flex flex-col overflow-hidden bg-black mx-auto max-w-lg border-x border-white/10 screen-guard-active">
      {/* Video layer */}
      <div className="absolute inset-0 z-0 bg-black">
        <div className="relative w-full h-full">
          {isHost ? (
            <video ref={videoRef} autoPlay playsInline muted className={cn("w-full h-full object-cover scale-x-[-1]")} />
          ) : (
            <div className="relative w-full h-full">
              <Image 
                src={host?.previewImageUrl || "https://picsum.photos/seed/stream/800/1200"} 
                alt="Stream" 
                fill 
                className={cn("object-cover", !canAccessStream ? "blur-3xl opacity-40" : "opacity-90")} 
              />
              {!canAccessStream && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-xl flex flex-col items-center justify-center space-y-6 px-10 text-center">
                  <div className="size-20 bg-primary/20 rounded-full flex items-center justify-center romantic-glow mb-2">
                    <Lock className="size-10 text-primary animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black uppercase italic text-white tracking-tighter">Private Hub</h2>
                    <p className="text-[10px] font-black text-[#FDA4AF] uppercase tracking-widest">Adult Content Possible • End-to-End Secure</p>
                  </div>
                  <Button onClick={() => setShowPrivateWarning(true)} className="h-16 rounded-2xl bg-primary px-10 text-white font-black uppercase tracking-widest gap-2 shadow-2xl shadow-primary/40 text-sm">
                    <Zap className="size-5 fill-current" /> Pay 50 Coins
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Watermark for Private Room */}
          {isPrivate && canAccessStream && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20 rotate-45">
              <p className="text-5xl font-black uppercase tracking-[0.5em] text-white whitespace-nowrap">Strictly 18+ Private Room</p>
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
      </div>

      <Dialog open={showPrivateWarning} onOpenChange={setShowPrivateWarning}>
        <DialogContent className="bg-[#2D1B2D] border-white/10 text-white rounded-[3rem] max-w-[90vw] mx-auto p-8 overflow-hidden">
          <DialogHeader className="items-center text-center">
            <div className="size-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert className="size-8 text-red-500" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Private Directive</DialogTitle>
            <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Nudity & Adult Content permitted here.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4 text-center">
            <div className="bg-white/5 rounded-2xl p-4 text-[10px] text-left space-y-3 border border-white/10">
              <p className="flex items-start gap-2 leading-relaxed"><CheckCircle2 className="size-3 text-primary mt-0.5" /> Full freedom for Host and User.</p>
              <p className="flex items-start gap-2 leading-relaxed"><CheckCircle2 className="size-3 text-primary mt-0.5" /> Screenshots strictly prohibited.</p>
              <p className="flex items-start gap-2 leading-relaxed"><CheckCircle2 className="size-3 text-primary mt-0.5" /> End-to-End Encryption Active.</p>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={handleJoinPrivate} disabled={isProcessingPayment} className="h-16 rounded-2xl romantic-gradient font-black uppercase tracking-widest text-white shadow-xl">
                {isProcessingPayment ? <Loader2 className="animate-spin mr-2" /> : "Confirm & Pay 50💎"}
              </Button>
              <Button variant="ghost" onClick={() => setShowPrivateWarning(false)} className="text-[10px] font-black text-slate-500 uppercase">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isHost && host?.isLive && <LiveEarningTimer minutes={minutesLive} />}

      <header className="relative z-10 flex items-center justify-between px-4 pt-16 pb-4">
        <div className="flex items-center gap-3 glass-effect rounded-full p-1 pr-4 bg-black/30 backdrop-blur-md border border-white/10">
          <div className="relative size-10 rounded-full border-2 border-primary overflow-hidden">
            <Image src={host?.previewImageUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=host"} alt="Host" fill className="object-cover" />
          </div>
          <div>
            <h3 className="text-[11px] font-black leading-none text-white uppercase tracking-tighter">@{host?.username || 'Host'}</h3>
            <div className="flex items-center gap-1 mt-1">
              <Eye className="size-3 text-primary" />
              <span className="text-[8px] font-black text-white/50 uppercase">{host?.viewers || 0} Nodes</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!isHost && host?.streamType === 'public' && (
            <Button onClick={reportNudity} variant="ghost" size="icon" className="glass-effect size-10 rounded-full text-red-500 border-none bg-red-500/10">
              <Flag className="size-5" />
            </Button>
          )}
          {isHost ? (
            <Button variant="destructive" size="sm" onClick={endStream} className="rounded-full font-black uppercase text-[10px] tracking-widest h-10 px-6 shadow-2xl">
              End Signal
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
                <span className="font-black mr-2 text-secondary text-[10px] uppercase italic">{m.senderName}:</span>
                <span className="opacity-90">{m.text}</span>
              </p>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {canAccessStream && (
          <footer className="flex items-center gap-3 w-full">
            <div className="flex-1 flex items-center glass-effect rounded-[2rem] px-6 h-14 bg-white/10 border-white/10 backdrop-blur-md">
              <Input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="bg-transparent border-none focus-visible:ring-0 text-white placeholder-white/30 font-bold text-sm" 
                placeholder="Secure signal..." 
              />
              <button onClick={sendMessage} className="ml-2 text-primary"><Send className="size-5" /></button>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

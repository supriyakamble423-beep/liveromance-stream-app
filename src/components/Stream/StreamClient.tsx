'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  X, Heart, Send, Lock, Zap, ShieldCheck, 
  Eye, Gift, Music, Share2, MoreVertical, Loader2, Power, Mail, Trophy, AlertTriangle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { 
  doc, updateDoc, serverTimestamp, collection, 
  addDoc, onSnapshot, query, orderBy, limit, increment, setDoc, getDoc 
} from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import LiveEarningTimer from "@/components/Stream/LiveEarningTimer";

export default function StreamClient({ id }: { id: string }) {
  const router = useRouter();
  const { firestore, user, areServicesAvailable, isUserLoading } = useFirebase();
  const { toast } = useToast();

  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [giftOpen, setGiftOpen] = useState(false);
  const [minutes, setMinutes] = useState(0);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [loadTimeout, setLoadTimeout] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const isHost = user?.uid === id || id === 'simulate_host';
  const effectiveId = id === 'simulate_host' ? (user?.uid || 'simulate_host') : id;

  // SAFE FIRESTORE REFERENCES
  const hostRef = useMemoFirebase(() => {
    if (!firestore || !effectiveId || !areServicesAvailable) return null;
    return doc(firestore, 'hosts', effectiveId);
  }, [firestore, effectiveId, areServicesAvailable]);

  const { data: host, isLoading: isHostLoading } = useDoc(hostRef);

  // REAL-TIME CHAT SYNC (ULTRA-DEFENSIVE)
  useEffect(() => {
    if (!firestore || !areServicesAvailable) return;

    try {
      const colRef = collection(firestore, 'streamMessages');
      const msgsQuery = query(
        colRef, 
        orderBy('timestamp', 'desc'), 
        limit(50)
      );

      const unsubscribe = onSnapshot(msgsQuery, (snapshot) => {
        const msgs = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        setMessages(msgs.reverse());
      }, (err) => {
        console.error("Chat sync error:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Chat listener initialization deferred.");
    }
  }, [firestore, areServicesAvailable]);

  // CAMERA PERMISSION & BROADCAST LOGIC (SIMPLIFIED FOR APK)
  const startBroadcast = async () => {
    if (!areServicesAvailable || !firestore) {
      toast({ variant: "destructive", title: "Wait!", description: "Grid is connecting..." });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" }, 
        audio: true 
      });
      
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Simulation/Live Host Support
      if (isHost && hostRef) {
        const hostSnap = await getDoc(hostRef);
        if (!hostSnap.exists()) {
          await setDoc(hostRef, {
            username: user?.displayName || "Global Host",
            isLive: true,
            streamType: 'public',
            viewers: 1250,
            verified: true,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp()
          });
        } else {
          await updateDoc(hostRef, {
            isLive: true,
            updatedAt: serverTimestamp(),
            viewers: increment(Math.floor(Math.random() * 10))
          });
        }
      }

      setIsLive(true);
      setCameraError(null);
      toast({ title: "Signal Active!", description: "Broadcasting worldwide." });
    } catch (err: any) {
      console.error("Camera error:", err);
      setCameraError(err.message || "Permission denied");
      toast({ 
        variant: "destructive", 
        title: "Permission Required", 
        description: "Bhai, Camera access dena padega stream ke liye. Settings check kijiye." 
      });
    }
  };

  // BROADCAST TIMER
  useEffect(() => {
    if (!isLive) return;
    const intervalId = setInterval(() => {
      setMinutes(prev => prev + 1);
    }, 60000);
    return () => clearInterval(intervalId);
  }, [isLive]);

  const sendMsg = async () => {
    if (!inputText.trim() || !firestore || !user || !areServicesAvailable) return;
    try {
      await addDoc(collection(firestore, 'streamMessages'), {
        text: inputText,
        user: user.displayName || 'User',
        uid: user.uid,
        timestamp: serverTimestamp(),
        hostId: effectiveId
      });
      setInputText("");
    } catch (e) {
      console.error("Msg failed");
    }
  };

  const endStream = () => {
    cameraStream?.getTracks().forEach(track => track.stop());
    router.push('/host-p');
  };

  if (cameraError) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-8 text-center space-y-8">
        <div className="size-20 bg-red-500/20 rounded-full flex items-center justify-center romantic-glow animate-pulse">
          <AlertTriangle className="size-10 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter">Signal Blocked</h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] leading-relaxed">
            Camera access is required for node entry. <br/>Check browser or app permissions.
          </p>
        </div>
        <Button onClick={() => window.location.reload()} className="w-full h-16 rounded-2xl bg-primary font-black uppercase text-lg shadow-2xl">Re-attempt Access</Button>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden max-w-lg mx-auto border-x border-white/10 mesh-gradient">
      {/* Background Video Layer */}
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        playsInline 
        className={cn(
          "absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-all duration-700", 
          (host?.streamType === 'private' || host?.manualBlur) && !isHost && "blur-3xl opacity-40",
          !isLive && "opacity-0"
        )} 
      />
      
      {/* Luxury Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none" />

      {/* Connection State Overlay */}
      {!isLive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-[60] bg-black/80 backdrop-blur-md space-y-10">
          <div className="relative size-32">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="size-10 text-primary fill-current romantic-glow" />
            </div>
          </div>
          
          <div className="text-center space-y-2 px-10">
            <h2 className="text-2xl font-black uppercase italic tracking-widest">
              {isHostLoading ? "Syncing Grid..." : "Signal Ready"}
            </h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">
              {isHost ? "Connect your signature to the global network" : "Connecting to host private tunnel"}
            </p>
          </div>

          <Button 
            onClick={startBroadcast} 
            disabled={!areServicesAvailable || isHostLoading}
            className="h-24 px-16 rounded-[3rem] bg-red-600 hover:bg-red-700 text-white font-black text-2xl uppercase italic shadow-[0_0_80px_rgba(220,38,38,0.6)] animate-in zoom-in duration-500"
          >
            {areServicesAvailable ? "🔴 GO LIVE" : "INITIALIZING..."}
          </Button>
        </div>
      )}

      {/* Header Info */}
      <div className="absolute top-12 left-4 right-4 z-50 flex justify-between items-start">
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 shadow-2xl">
          <div className="relative size-11 rounded-full overflow-hidden border-2 border-primary shadow-lg">
            <Image src={host?.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${effectiveId}`} alt="Host" fill className="object-cover" />
          </div>
          <div>
            <p className="text-white text-xs font-black uppercase italic tracking-tight">@{host?.username || "HOST_NODE"}</p>
            <p className="text-white/70 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <span className="size-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]" />
              {host?.viewers || 1250} Watching
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {isHost && hostRef && (
            <Button 
              variant="outline" 
              onClick={() => updateDoc(hostRef, { streamType: host?.streamType === 'private' ? 'public' : 'private' })}
              className={cn(
                "rounded-full h-11 px-5 text-[10px] font-black uppercase border-none shadow-xl transition-all", 
                host?.streamType === 'private' ? "bg-red-600 text-white" : "bg-green-600 text-white"
              )}
            >
              {host?.streamType === 'private' ? <Lock className="size-3 mr-2" /> : <Zap className="size-3 mr-2" />}
              {host?.streamType === 'private' ? 'Private' : 'Public'}
            </Button>
          )}
          <Button variant="destructive" size="icon" className="rounded-full h-11 w-11 shadow-2xl" onClick={endStream}>
            <X size={20} />
          </Button>
        </div>
      </div>

      {/* Milestone Tracker (Minimal) */}
      {isLive && (
        <div className="absolute top-28 right-4 z-50">
          <LiveEarningTimer minutes={minutes} hostId={effectiveId} minimal />
        </div>
      )}

      {/* Chat Messages */}
      <div className="absolute bottom-36 left-4 right-12 max-h-52 overflow-y-auto no-scrollbar flex flex-col gap-2 z-40">
        {messages.map((msg) => (
          <div key={msg.id} className="bg-black/30 backdrop-blur-md px-4 py-2 rounded-2xl w-fit max-w-[90%] border border-white/5 animate-in slide-in-from-left-2">
            <p className="text-[11px] leading-tight">
              <span className="text-primary font-black uppercase tracking-tighter mr-2">{msg.user}:</span>
              <span className="text-white/90 font-medium tracking-tight">{msg.text}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Action Controls */}
      <div className="absolute bottom-6 left-4 right-4 flex items-center gap-4 z-50">
        <div className="flex-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center px-6 h-16 shadow-2xl">
          <Input 
            placeholder="Send signal..." 
            value={inputText} 
            onChange={e => setInputText(e.target.value)} 
            onKeyPress={e => e.key === 'Enter' && sendMsg()} 
            className="bg-transparent border-none text-white text-sm font-bold focus-visible:ring-0 h-full placeholder:text-white/30" 
          />
          <button onClick={sendMsg} className="text-primary p-2 hover:scale-110 transition-transform"><Send size={24} /></button>
        </div>
        <button 
          onClick={() => setGiftOpen(true)} 
          className="w-16 h-16 bg-gradient-to-tr from-yellow-400 via-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(245,158,11,0.4)] active:scale-90 transition-transform"
        >
          <Gift size={32} className="text-black" />
        </button>
      </div>
    </div>
  );
}

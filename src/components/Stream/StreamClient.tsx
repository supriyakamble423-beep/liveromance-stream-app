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
  addDoc, onSnapshot, query, orderBy, limit, increment, setDoc 
} from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import LiveEarningTimer from "@/components/Stream/LiveEarningTimer";

export default function StreamClient({ id }: { id: string }) {
  const router = useRouter();
  const { firestore, user, areServicesAvailable } = useFirebase();
  const { toast } = useToast();

  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [minutes, setMinutes] = useState(0);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Guard: Determine effective host ID
  const effectiveId = id === 'simulate_host' ? (user?.uid || 'simulate_host') : id;
  const isHost = user?.uid === effectiveId || id === 'simulate_host';

  // 1. SAFE Firestore Reference (No Grid Error)
  const hostRef = useMemoFirebase(() => {
    if (!firestore || !areServicesAvailable || !effectiveId) return null;
    try {
      return doc(firestore, 'hosts', effectiveId);
    } catch (e) {
      return null;
    }
  }, [firestore, areServicesAvailable, effectiveId]);

  const { data: host, isLoading: isHostLoading } = useDoc(hostRef);

  // 2. Real-time Chat (Guarded)
  useEffect(() => {
    if (!firestore || !areServicesAvailable) return;

    try {
      const q = query(
        collection(firestore, 'streamMessages'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMessages(msgs.reverse());
      }, (err) => {
        console.warn("Chat listener error:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Chat setup failed:", e);
    }
  }, [firestore, areServicesAvailable]);

  // 3. Optimized Broadcast Starter
  const startBroadcast = async () => {
    if (!areServicesAvailable || !firestore || !user) {
      toast({ 
        variant: "destructive", 
        title: "Grid Offline", 
        description: "Bhai, connection ready nahi hai. 2 second ruko." 
      });
      return;
    }

    setIsStarting(true);

    try {
      // Hardware Request
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" }, 
        audio: true 
      });
      
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Sync Firestore
      if (isHost && hostRef) {
        await setDoc(hostRef, {
          username: user.displayName || `Host_${user.uid.slice(0,4)}`,
          isLive: true,
          updatedAt: serverTimestamp(),
          viewers: Math.floor(Math.random() * 500) + 1200,
          streamType: 'public',
          verified: true
        }, { merge: true });
      }

      setIsLive(true);
      setCameraError(null);
      toast({ title: "Signal Active!", description: "Aap live hain!" });
    } catch (err: any) {
      console.error("Camera Hardware Error:", err);
      setCameraError(err.message || "Permission Denied");
      toast({ 
        variant: "destructive", 
        title: "Permission Required", 
        description: "Bhai, Camera access ke bina stream start nahi hogi. Settings check karo." 
      });
    } finally {
      setIsStarting(false);
    }
  };

  // Timer Logic
  useEffect(() => {
    if (!isLive) return;
    const intervalId = setInterval(() => setMinutes(prev => prev + 1), 60000);
    return () => clearInterval(intervalId);
  }, [isLive]);

  // Cleanup
  useEffect(() => {
    return () => {
      cameraStream?.getTracks().forEach(track => track.stop());
    };
  }, [cameraStream]);

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
    } catch (e) { console.error("Message failed:", e); }
  };

  // FULL SCREEN INITIALIZATION GUARD
  if (!areServicesAvailable || !firestore) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-8 space-y-6">
        <div className="relative size-20">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-white/40 font-black uppercase tracking-[0.3em] text-[10px]">Connecting to Romantic Grid...</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden max-w-lg mx-auto border-x border-white/10 mesh-gradient">
      {/* Background Video */}
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        playsInline 
        className={cn(
          "absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-1000", 
          !isLive && "opacity-0"
        )} 
      />
      
      {/* Luxury Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none" />

      {/* Start UI */}
      {!isLive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-[60] bg-black/80 backdrop-blur-md space-y-10">
          <div className="text-center space-y-4 px-10">
            <div className="size-20 bg-primary/20 rounded-[2rem] flex items-center justify-center mx-auto romantic-glow">
              <Zap className="size-10 text-primary fill-current" />
            </div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter">Signal Ready</h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] leading-relaxed">
              Host signature: <span className="text-primary">@{effectiveId.slice(0, 8)}</span><br/>
              Encrypted peer-to-peer tunnel active.
            </p>
          </div>

          <Button 
            onClick={startBroadcast} 
            disabled={isStarting}
            className="h-24 px-16 rounded-[3rem] bg-red-600 hover:bg-red-700 text-white font-black text-2xl uppercase italic shadow-[0_0_80px_rgba(220,38,38,0.6)] transition-all active:scale-95"
          >
            {isStarting ? <Loader2 className="animate-spin size-10" /> : "🔴 GO LIVE"}
          </Button>
        </div>
      )}

      {/* Live Header */}
      <div className="absolute top-12 left-4 right-4 z-50 flex justify-between items-start">
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 shadow-2xl">
          <div className="relative size-11 rounded-full overflow-hidden border-2 border-primary shadow-lg bg-slate-900">
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
        
        <Button variant="destructive" size="icon" className="rounded-full h-11 w-11 shadow-2xl" onClick={() => router.push('/host-p')}>
          <X size={20} />
        </Button>
      </div>

      {/* Milestone Tracker */}
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

      {/* Action Input */}
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
          className="w-16 h-16 bg-gradient-to-tr from-yellow-400 via-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(245,158,11,0.4)] active:scale-90 transition-transform"
        >
          <Gift size={32} className="text-black" />
        </button>
      </div>
    </div>
  );
}

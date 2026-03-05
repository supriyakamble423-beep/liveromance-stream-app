
'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  X, Heart, Send, Lock, Zap, ShieldCheck, 
  Eye, Gift, Music, Share2, MoreVertical, Loader2, Power, Mail, Trophy 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { 
  doc, updateDoc, serverTimestamp, collection, 
  addDoc, onSnapshot, query, orderBy, limit, increment 
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
  const [giftOpen, setGiftOpen] = useState(false);
  const [minutes, setMinutes] = useState(0);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const isHost = user?.uid === id || id === 'simulate_host';
  const effectiveId = id === 'simulate_host' ? (user?.uid || 'simulate_host') : id;

  const hostRef = useMemoFirebase(() => {
    if (!firestore || !effectiveId) return null;
    return doc(firestore, 'hosts', effectiveId);
  }, [firestore, effectiveId]);

  const { data: host } = useDoc(hostRef);

  const startBroadcast = async () => {
    if (!areServicesAvailable) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: { ideal: 1280 } }, 
        audio: true 
      });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;

      if (firestore && isHost && hostRef) {
        await updateDoc(hostRef, {
          isLive: true,
          updatedAt: serverTimestamp()
        });
      }

      setIsLive(true);
      setCameraError(null);
      toast({ title: "Signal Active", description: "You are broadcasting live!" });
    } catch (err: any) {
      setCameraError(err.message || "Permission denied");
      toast({ 
        variant: "destructive", 
        title: "Permission Required", 
        description: "Bhai, Camera/Mic ke bina stream nahi ho payegi. Settings mein allow karo." 
      });
    }
  };

  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, 'streamMessages'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      setMessages(msgs.reverse());
    });
    return () => unsubscribe();
  }, [firestore]);

  useEffect(() => {
    if (!isLive) return;
    const intervalId = setInterval(() => {
      setMinutes(prev => prev + 1);
    }, 60000);
    return () => clearInterval(intervalId);
  }, [isLive]);

  const sendMsg = async () => {
    if (!inputText.trim() || !firestore || !user) return;
    try {
      await addDoc(collection(firestore, 'streamMessages'), {
        text: inputText,
        user: user.displayName || 'Guest',
        uid: user.uid,
        timestamp: serverTimestamp(),
        hostId: id
      });
      setInputText("");
    } catch (e) {
      toast({ variant: "destructive", title: "Message Failed" });
    }
  };

  const endStream = () => {
    cameraStream?.getTracks().forEach(track => track.stop());
    router.push('/host-p');
  };

  if (cameraError) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-8 text-center space-y-6">
        <ShieldCheck className="size-16 text-red-500 opacity-20" />
        <h2 className="text-2xl font-black uppercase italic">Access Denied</h2>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
          Camera permission is required to broadcast. Please enable it in browser settings.
        </p>
        <Button onClick={() => window.location.reload()} className="w-full h-14 rounded-2xl bg-primary font-black uppercase">Retry Access</Button>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden max-w-lg mx-auto border-x border-white/10">
      <video ref={videoRef} autoPlay muted playsInline className={cn("absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-all", (host?.streamType === 'private' || host?.manualBlur) && "blur-2xl opacity-60")} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

      {!isLive && (
        <div className="absolute inset-0 flex items-center justify-center z-[60] bg-black/60 backdrop-blur-sm">
          <Button 
            onClick={startBroadcast} 
            disabled={!areServicesAvailable}
            className="h-24 px-16 rounded-[2.5rem] bg-red-600 hover:bg-red-700 text-white font-black text-2xl uppercase italic shadow-[0_0_60px_rgba(220,38,38,0.6)]"
          >
            {areServicesAvailable ? "🔴 GO LIVE" : "Syncing..."}
          </Button>
        </div>
      )}

      {/* Header UI */}
      <div className="absolute top-10 left-4 right-4 z-50 flex justify-between items-start">
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          <div className="relative size-11 rounded-full overflow-hidden border-2 border-primary">
            <Image src={host?.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${effectiveId}`} alt="Host" fill className="object-cover" />
          </div>
          <div>
            <p className="text-white text-xs font-black uppercase italic truncate max-w-[100px]">@{host?.username || "Host"}</p>
            <p className="text-white/70 text-[10px] font-bold flex items-center gap-1">
              <span className="size-1.5 bg-red-500 rounded-full animate-pulse mr-1" />
              {host?.viewers || 1250} Watching
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isHost && (
            <Button 
              variant="outline" 
              onClick={() => updateDoc(hostRef!, { streamType: host?.streamType === 'private' ? 'public' : 'private' })}
              className={cn("rounded-full h-10 px-4 text-[10px] font-black uppercase border-white/10", host?.streamType === 'private' ? "bg-red-600" : "bg-green-600")}
            >
              {host?.streamType === 'private' ? <Lock className="size-3 mr-1" /> : <Zap className="size-3 mr-1" />}
              {host?.streamType === 'private' ? 'Private' : 'Public'}
            </Button>
          )}
          <Button variant="destructive" size="icon" className="rounded-full h-10 w-10" onClick={endStream}><X size={18} /></Button>
        </div>
      </div>

      <div className="absolute top-24 right-4 z-50">
        <LiveEarningTimer minutes={minutes} hostId={effectiveId} minimal />
      </div>

      {/* Chat messages overlay */}
      <div className="absolute bottom-32 left-4 right-12 max-h-48 overflow-y-auto no-scrollbar flex flex-col gap-2 z-40">
        {messages.map((msg) => (
          <div key={msg.id} className="bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-xl w-fit max-w-full">
            <p className="text-[10px] leading-tight">
              <span className="text-primary font-black uppercase tracking-tighter mr-1">{msg.user}:</span>
              <span className="text-white/90 font-medium">{msg.text}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Interaction Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 z-50">
        <div className="flex-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center px-5 h-14">
          <Input 
            placeholder="Signal message..." 
            value={inputText} 
            onChange={e => setInputText(e.target.value)} 
            onKeyPress={e => e.key === 'Enter' && sendMsg()} 
            className="bg-transparent border-none text-white text-xs font-bold focus-visible:ring-0 h-full" 
          />
          <button onClick={sendMsg} className="text-primary p-2"><Send size={20} /></button>
        </div>
        <button onClick={() => setGiftOpen(true)} className="w-14 h-14 bg-gradient-to-tr from-yellow-400 to-amber-600 rounded-full flex items-center justify-center shadow-2xl">
          <Gift size={28} className="text-black" />
        </button>
      </div>
    </div>
  );
}

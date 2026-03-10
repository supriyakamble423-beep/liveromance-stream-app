'use client';

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, Heart, Send, Lock, Zap, Eye, Gift, Share2, MoreVertical, Power, Grid3X3, Loader2, AlertCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFirebase, useDoc } from "@/firebase";
import { doc, updateDoc, serverTimestamp, collection, addDoc, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function StreamClient({ id }: { id: string }) {
  const router = useRouter();
  const { firestore, user, areServicesAvailable } = useFirebase();
  const { toast } = useToast();

  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [giftOpen, setGiftOpen] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [hostData, setHostData] = useState<any>(null);
  const [isGridLoading, setIsGridLoading] = useState(true);
  const [isSimulated, setIsSimulated] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const isHost = user?.uid === id || id === 'simulate_host';

  const hostRef = useMemo(() => {
    if (!firestore || !id || id === 'simulate_host') return null;
    return doc(firestore, 'hosts', id);
  }, [firestore, id]);

  const { data: host } = useDoc(hostRef);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isGridLoading) {
        setIsSimulated(true);
        setHostData({
          username: id === 'simulate_host' ? 'SimNode' : 'GuestHost',
          streamType: 'public',
          viewers: Math.floor(Math.random() * 500),
          photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`
        });
        setIsGridLoading(false);
      }
    }, 5000);

    if (areServicesAvailable && host) {
      setHostData(host);
      setIsGridLoading(false);
      clearTimeout(timer);
    }

    return () => clearTimeout(timer);
  }, [host, id, areServicesAvailable, isGridLoading]);

  const requestPermissions = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => console.log('📍 Node Position locked'),
          (err) => console.warn('⚠️ Location optional')
        );
      }
      return mediaStream;
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Permissions Denied",
        description: "Camera & Mic access is required for streaming."
      });
      throw err;
    }
  };

  const startBroadcast = async () => {
    try {
      const mediaStream = await requestPermissions();
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      if (hostRef && isHost && areServicesAvailable) {
        await updateDoc(hostRef, {
          isLive: true,
          lastLive: serverTimestamp()
        });
      }
      
      setIsLive(true);
      toast({ title: "🔴 LIVE", description: "Broadcast signal established." });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!firestore || !areServicesAvailable) return;
    const q = query(collection(firestore, 'streamMessages'), orderBy('timestamp', 'desc'), limit(30));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse());
    });
    return () => unsub();
  }, [firestore, areServicesAvailable]);

  const sendMsg = async () => {
    if (!inputText.trim() || !user) return;
    if (!firestore || !areServicesAvailable) {
      setMessages(prev => [...prev, { id: Date.now().toString(), user: 'You', text: inputText }]);
      setInputText("");
      return;
    }
    try {
      await addDoc(collection(firestore, 'streamMessages'), {
        text: inputText,
        user: user.displayName || 'Guest',
        uid: user.uid,
        hostId: id,
        timestamp: serverTimestamp()
      });
      setInputText("");
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [stream]);

  if (isGridLoading) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-6 space-y-6">
        <Grid3X3 className="size-20 text-primary animate-pulse" />
        <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">Syncing Grid Node...</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden max-w-[430px] mx-auto screen-guard-active">
      <video ref={videoRef} autoPlay muted playsInline className={cn("absolute inset-0 w-full h-full object-cover transition-opacity duration-1000", isLive ? "opacity-100" : "opacity-30")} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90 pointer-events-none" />

      <div className="absolute top-4 left-4 right-4 z-50 flex flex-col gap-2">
        {isSimulated && (
          <div className="bg-amber-500/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-amber-500/30 flex items-center justify-center gap-2">
            <AlertCircle className="size-3 text-amber-500" />
            <span className="text-[8px] font-black uppercase tracking-widest text-amber-200">Simulation Node Active</span>
          </div>
        )}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
            <div className="relative size-10 rounded-full overflow-hidden border-2 border-primary">
              <Image src={hostData?.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`} alt="Host" fill className="object-cover" />
            </div>
            <div>
              <p className="text-white font-black text-xs uppercase italic">@{hostData?.username || "Host"}</p>
              <p className="text-primary text-[9px] font-black uppercase flex items-center gap-1"><Eye size={10} /> {hostData?.viewers || 0} Watchers</p>
            </div>
          </div>
          {isHost && (
            <Button variant="destructive" size="icon" className="rounded-full size-10 shadow-lg" onClick={() => router.push('/host-p')}>
              <Power size={16} />
            </Button>
          )}
        </div>
      </div>

      <div className="absolute bottom-28 left-4 right-4 max-h-48 overflow-y-auto space-y-2 z-40 no-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5 inline-block max-w-[85%]">
            <p className="text-[10px]"><span className="text-secondary font-black uppercase italic mr-2">{msg.user}:</span><span className="text-white/90">{msg.text}</span></p>
          </div>
        ))}
      </div>

      <div className="absolute bottom-6 left-4 right-4 flex items-center gap-3 z-50">
        <div className="flex-1 bg-black/60 backdrop-blur-xl border border-white/10 rounded-[2rem] flex items-center px-5 py-3">
          <Input placeholder="Send love..." value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMsg()} className="bg-transparent border-none text-white focus:ring-0 text-xs font-bold" />
          <button onClick={sendMsg} className="text-primary hover:scale-110 transition"><Send size={20} /></button>
        </div>
        <button onClick={() => setGiftOpen(true)} className="size-14 bg-gradient-to-tr from-yellow-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg"><Gift size={26} className="text-black" /></button>
      </div>

      {!isLive && isHost && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-[60] bg-black/40 backdrop-blur-sm">
          <Button onClick={startBroadcast} className="w-64 h-20 bg-primary text-white rounded-[2.5rem] font-black text-2xl uppercase italic tracking-tighter shadow-2xl">🔴 GO LIVE</Button>
        </div>
      )}
    </div>
  );
}
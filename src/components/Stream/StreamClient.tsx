'use client';

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, Heart, Send, Lock, Zap, Eye, Gift, Share2, MoreVertical, Power, Grid3X3, Loader2, AlertCircle, MapPin, Camera, ShieldCheck, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFirebase, useDoc } from "@/firebase";
import { doc, updateDoc, serverTimestamp, collection, addDoc, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import AdBanner from "@/components/Ads/AdBanner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

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
    setPermissionError(null);
    try {
      // Relaxed constraints for better compatibility
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          // Lower initial requirement to prevent failure on weak hardware
          width: { min: 640, ideal: 1280 },
          height: { min: 480, ideal: 720 }
        },
        audio: true
      });
      return mediaStream;
    } catch (err: any) {
      console.error("Media Error:", err);
      let errorMsg = "Camera & Mic access denied.";
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = "Aapne camera access mana kar diya hai. Browser settings mein jaakar ise 'Allow' karein.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = "Aapke device mein camera nahi mila.";
      }
      
      setPermissionError(errorMsg);
      toast({
        variant: "destructive",
        title: "Permissions Failed",
        description: errorMsg
      });
      throw err;
    }
  };

  const startBroadcast = async () => {
    try {
      const mediaStream = await requestPermissions();
      setStream(mediaStream);
      setShowPermissionModal(false);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Explicitly play after setting source
        try {
          await videoRef.current.play();
        } catch (e) {
          console.error("Video play failed:", e);
        }
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
      // Error is already handled in requestPermissions
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
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
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
      {/* Video Layer */}
      <div className="absolute inset-0 pt-16 pb-24 bg-slate-900/20">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline 
          className={cn(
            "w-full h-full object-cover transition-opacity duration-1000", 
            isLive ? "opacity-100" : "opacity-20"
          )} 
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90 pointer-events-none" />

      {/* Permission Modal */}
      <Dialog open={showPermissionModal} onOpenChange={setShowPermissionModal}>
        <DialogContent className="bg-[#2D1B2D] border-white/10 text-white rounded-[3rem] p-8 max-w-[90vw] mx-auto shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="size-20 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary animate-pulse">
              <Camera className="size-10 text-primary" />
            </div>
            
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Identity Access</DialogTitle>
              <p className="text-sm text-slate-400 font-bold uppercase leading-relaxed">
                Duniya se judne ke liye <br/><span className="text-white">Camera aur Mic</span> allow karein.
              </p>
            </div>

            {permissionError && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-200 rounded-2xl py-3">
                <AlertCircle className="size-4" />
                <AlertDescription className="text-[10px] font-bold uppercase tracking-tight">
                  {permissionError}
                </AlertDescription>
              </Alert>
            )}

            <div className="w-full space-y-3">
              <Button onClick={startBroadcast} className="w-full h-16 romantic-gradient rounded-2xl font-black uppercase tracking-widest text-lg shadow-xl border-none">
                Chalo Shuru Karein
              </Button>
              {permissionError && (
                <p className="text-[9px] text-slate-500 font-black uppercase">
                  Settings > Site Settings > Camera > Reset
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="absolute top-4 left-4 right-4 z-50 flex flex-col gap-2">
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
          <div className="flex items-center gap-2">
            {isHost && (
              <Button variant="destructive" size="icon" className="rounded-full size-10 shadow-lg" onClick={() => router.push('/host-p')}>
                <Power size={16} />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="rounded-full size-10 bg-black/40 backdrop-blur-md border border-white/10" onClick={() => router.push('/global')}>
              <X size={20} className="text-white" />
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-44 left-4 right-4 max-h-40 overflow-y-auto space-y-2 z-40 no-scrollbar">
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
          <Button onClick={() => setShowPermissionModal(true)} className="w-64 h-20 bg-primary text-white rounded-[2.5rem] font-black text-2xl uppercase italic tracking-tighter shadow-2xl">🔴 GO LIVE</Button>
        </div>
      )}
    </div>
  );
}

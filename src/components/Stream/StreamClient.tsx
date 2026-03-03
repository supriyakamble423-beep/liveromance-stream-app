'use server';
'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  X, Heart, Send, Lock, Zap, ShieldOff, ShieldCheck, 
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

/**
 * StreamClient Component
 * Handles real-time broadcasting, camera permissions, and luxury UI interactions.
 */
export default function StreamClient({ id }: { id: string }) {
  const router = useRouter();
  const { firestore, user, areServicesAvailable } = useFirebase();
  const { toast } = useToast();

  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [giftOpen, setGiftOpen] = useState(false);
  const [minutes, setMinutes] = useState(0);
  const [bonusShow, setBonusShow] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isHostLoading, setIsHostLoading] = useState(true);
  const [loadTimeout, setLoadTimeout] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const isHost = user?.uid === id || id === 'simulate_host';
  const effectiveId = id === 'simulate_host' ? (user?.uid || 'simulate_host') : id;

  // Optimized Host Reference
  const hostRef = useMemoFirebase(() => {
    if (!firestore || !effectiveId) return null;
    return doc(firestore, 'hosts', effectiveId);
  }, [firestore, effectiveId]);

  const { data: host } = useDoc(hostRef);

  // Safety Loading Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isHostLoading || !areServicesAvailable) {
        setLoadTimeout(true);
        console.warn("Stream loading timeout - check Firebase connection");
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [isHostLoading, areServicesAvailable]);

  // Start Broadcast Logic with Permissions
  const startBroadcast = async () => {
    if (!areServicesAvailable) {
      toast({ variant: "destructive", title: "Syncing...", description: "Connecting to Global Grid..." });
      return;
    }

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
      toast({ title: "Signal Active", description: "You are now broadcasting live!" });
    } catch (err: any) {
      console.error("Camera Error:", err);
      setCameraError(err.message || "Permission denied");
      toast({ 
        variant: "destructive", 
        title: "Permission Required", 
        description: "Bhai, Camera/Mic ke bina stream nahi ho payegi. Settings mein allow karo." 
      });
    }
  };

  // Real-time Messages Sync
  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, 'streamMessages'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      setMessages(msgs.reverse());
      setIsHostLoading(false);
    }, (error) => {
      console.warn("Message sync error:", error);
      setIsHostLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);

  // Luxury Milestone Timer
  useEffect(() => {
    if (!isLive) return;
    const intervalId = setInterval(() => {
      setMinutes(prev => {
        const next = prev + 1;
        if (next > 0 && next % 30 === 0) setBonusShow(true); // Every 30 minutes
        return next;
      });
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

  if (loadTimeout && !isLive && !cameraStream) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-8 text-center space-y-6">
        <Loader2 className="size-16 text-primary animate-spin opacity-20" />
        <h2 className="text-2xl font-black uppercase italic">Grid Sync Timeout</h2>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
          The romantic signal is weak. Try refreshing or check your connection.
        </p>
        <div className="w-full space-y-3">
          <Button onClick={() => window.location.reload()} className="w-full h-14 rounded-2xl bg-primary font-black uppercase">Retry Connection</Button>
          <Button variant="ghost" onClick={() => router.push('/global')} className="w-full text-slate-500 font-bold uppercase text-[10px]">Return to Market</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden max-w-lg mx-auto border-x border-white/10">
      {/* Video Container */}
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        playsInline 
        className={cn(
          "absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-all duration-700", 
          (host?.streamType === 'private' || host?.manualBlur) && "blur-2xl opacity-60"
        )} 
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

      {/* Broadcast Guard */}
      {!isLive && (
        <div className="absolute inset-0 flex items-center justify-center z-[60] bg-black/60 backdrop-blur-sm">
          <Button 
            onClick={startBroadcast} 
            disabled={!areServicesAvailable}
            className="h-24 px-16 rounded-[2.5rem] bg-red-600 hover:bg-red-700 text-white font-black text-2xl uppercase italic shadow-[0_0_60px_rgba(220,38,38,0.6)] transition-all active:scale-95"
          >
            {areServicesAvailable ? "🔴 GO LIVE" : "Establishing..."}
          </Button>
        </div>
      )}

      {/* Luxury Header */}
      <div className="absolute top-10 left-4 right-4 z-50 flex justify-between items-start">
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-2xl">
          <div className="relative size-11 rounded-full overflow-hidden border-2 border-primary">
            <Image src={host?.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${effectiveId}`} alt="Host" fill className="object-cover" />
          </div>
          <div>
            <p className="text-white text-xs font-black uppercase italic tracking-tight truncate max-w-[100px]">@{host?.username || "Host"}</p>
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

      {/* Milestone Minimal UI */}
      <div className="absolute top-24 right-4 z-50">
        <LiveEarningTimer minutes={minutes} hostId={effectiveId} minimal />
      </div>

      {/* Side Buttons */}
      <div className="absolute right-4 top-1/3 flex flex-col gap-5 z-50">
        <button className="w-14 h-14 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 shadow-2xl hover:scale-110 transition-all">
          <Heart size={28} className="text-primary fill-current" />
        </button>
        <button className="w-14 h-14 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 shadow-2xl hover:scale-110 transition-all">
          <Share2 size={28} />
        </button>
        <button className="w-14 h-14 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 shadow-2xl hover:scale-110 transition-all">
          <MoreVertical size={28} />
        </button>
      </div>

      {/* Chat Messages */}
      <div className="absolute bottom-32 left-4 right-12 max-h-48 overflow-y-auto no-scrollbar flex flex-col gap-2 z-40">
        {messages.map((msg) => (
          <div key={msg.id} className="bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-xl w-fit max-w-full animate-in slide-in-from-left-2">
            <p className="text-[10px] leading-tight">
              <span className="text-primary font-black uppercase tracking-tighter mr-1">{msg.user}:</span>
              <span className="text-white/90 font-medium">{msg.text}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Interaction Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 z-50">
        <div className="flex-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center px-5 h-14 shadow-2xl">
          <Input 
            placeholder="Signal message..." 
            value={inputText} 
            onChange={e => setInputText(e.target.value)} 
            onKeyPress={e => e.key === 'Enter' && sendMsg()} 
            className="bg-transparent border-none text-white text-xs font-bold placeholder-white/30 focus-visible:ring-0 h-full" 
          />
          <button onClick={sendMsg} className="text-primary p-2 transition-transform active:scale-90"><Send size={20} /></button>
        </div>
        <button 
          onClick={() => setGiftOpen(true)} 
          className="w-14 h-14 bg-gradient-to-tr from-yellow-400 to-amber-600 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
        >
          <Gift size={28} className="text-black" />
        </button>
      </div>

      {/* Gift Drawer Overlay */}
      {giftOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/20 backdrop-blur-sm" onClick={() => setGiftOpen(false)}>
          <div className="w-full max-w-lg bg-[#2D1B2D]/95 backdrop-blur-2xl rounded-t-[3rem] p-8 animate-in slide-in-from-bottom-full duration-500 border-t border-white/10" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8 cursor-pointer" onClick={() => setGiftOpen(false)} />
            <h4 className="text-xl font-black uppercase italic text-white mb-8 text-center tracking-widest">Gifting Suite</h4>
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[{ e: '🌹', n: 'Rose', p: '1' }, { e: '🍦', n: 'Ice', p: '5' }, { e: '💎', n: 'Gem', p: '100' }, { e: '🚀', n: 'Node', p: '1k' }].map(item => (
                <div key={item.n} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                  <div className="size-14 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-2xl flex items-center justify-center text-2xl shadow-xl group-hover:scale-110 transition-transform">{item.e}</div>
                  <span className="text-yellow-400 text-[10px] font-black uppercase tracking-tighter">{item.p} TK</span>
                </div>
              ))}
            </div>
            <Button className="w-full h-16 bg-primary text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl">Send Offering</Button>
          </div>
        </div>
      )}

      {/* 30-min Milestone Golden Popup */}
      {bonusShow && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-6 backdrop-blur-md animate-in fade-in" onClick={() => setBonusShow(false)}>
          <div className="bg-gradient-to-br from-[#2D1B2D] to-black border-4 border-yellow-500/50 p-10 rounded-[3.5rem] text-center shadow-[0_0_100px_rgba(234,179,8,0.4)] animate-in zoom-in max-w-[340px]" onClick={e => e.stopPropagation()}>
            <Trophy className="size-20 text-yellow-400 mx-auto mb-6 animate-bounce" />
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-2 leading-tight">30 MIN BONUS!</h2>
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl mb-8">
              <p className="text-2xl font-black text-yellow-400 tracking-tight">+500 DIAMONDS</p>
            </div>
            <Button 
              onClick={async () => {
                if (firestore && user) {
                  await updateDoc(doc(firestore, 'hosts', user.uid), { earnings: increment(500) });
                  toast({ title: "Bonus Claimed!", description: "500 Diamonds added to vault." });
                }
                setBonusShow(false);
              }} 
              className="w-full h-16 bg-yellow-500 hover:bg-yellow-600 text-black font-black uppercase tracking-widest rounded-2xl shadow-xl"
            >
              Claim Gift
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

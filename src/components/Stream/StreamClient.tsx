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
  const [isUpdating, setIsUpdating] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const isHost = user?.uid === id || id === 'simulate_host';
  const effectiveId = id === 'simulate_host' ? (user?.uid || 'simulate_host') : id;

  const hostRef = useMemoFirebase(() => {
    if (!firestore || !effectiveId) return null;
    return doc(firestore, 'hosts', effectiveId);
  }, [firestore, effectiveId]);

  const { data: host, isLoading: isHostLoading } = useDoc(hostRef);

  // Loading Timeout Guard
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isHostLoading || !areServicesAvailable) setLoadTimeout(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [isHostLoading, areServicesAvailable]);

  // STRICT PERMISSIONS: Camera & Mic request
  useEffect(() => {
    if (!isHost) return;
    
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, 
          audio: true 
        });
        setCameraStream(stream);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        toast({ 
          variant: "destructive", 
          title: "Permission Denied", 
          description: "Bhai, Camera/Mic ke bina stream nahi ho payegi" 
        });
      }
    };

    startCamera();
    return () => cameraStream?.getTracks().forEach(t => t.stop());
  }, [isHost]);

  // REAL-TIME MESSAGES
  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, 'streamMessages'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      setMessages(msgs.reverse());
    }, (error) => console.warn("Message sync error:", error));
    return () => unsubscribe();
  }, [firestore]);

  // BONUS LOGIC: Every 30 mins
  useEffect(() => {
    if (!isHost) return;
    const intervalId = setInterval(() => {
      setMinutes(prev => {
        const next = prev + 1;
        if (next > 0 && next % 30 === 0) setBonusShow(true);
        return next;
      });
    }, 60000);
    return () => clearInterval(intervalId);
  }, [isHost]);

  const sendMsg = async () => {
    if (!inputText.trim() || !firestore || !user) return;
    try {
      await addDoc(collection(firestore, 'streamMessages'), {
        text: inputText,
        user: user.displayName || user.email?.split('@')[0] || 'Guest',
        uid: user.uid,
        timestamp: serverTimestamp(),
        hostId: id
      });
      setInputText("");
    } catch (e) {
      toast({ variant: "destructive", title: "Message Failed" });
    }
  };

  const toggleMode = async () => {
    if (!hostRef || !host) return;
    setIsUpdating(true);
    const nextMode = host.streamType === 'private' ? 'public' : 'private';
    try {
      await updateDoc(hostRef, { streamType: nextMode, updatedAt: serverTimestamp() });
      toast({ title: `Mode: ${nextMode.toUpperCase()}` });
    } finally { setIsUpdating(false); }
  };

  if (loadTimeout && !host) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-8 text-center space-y-6">
        <ShieldOff className="size-16 text-primary animate-pulse" />
        <h2 className="text-2xl font-black uppercase italic">Connection Dropped</h2>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
          The stream signal is weak or the host is offline.
        </p>
        <Button onClick={() => router.push('/global')} className="w-full h-14 rounded-2xl bg-primary font-black uppercase">Return to Marketplace</Button>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden max-w-lg mx-auto border-x border-white/10">
      <video ref={videoRef} autoPlay muted playsInline className={cn("absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-all duration-700", (host?.streamType === 'private' || host?.manualBlur) && "blur-2xl opacity-60")} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

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
            <Button onClick={toggleMode} disabled={isUpdating} className={cn("rounded-full px-5 h-10 text-[10px] font-black uppercase tracking-widest shadow-xl transition-all", host?.streamType === 'private' ? "bg-red-600" : "bg-green-600")}>
              {isUpdating ? <Loader2 className="animate-spin size-4" /> : host?.streamType === 'private' ? <Lock size={14} className="mr-1" /> : <Zap size={14} className="mr-1" />} 
              {host?.streamType === 'private' ? "Private" : "Public"}
            </Button>
          )}
          <Button variant="destructive" size="icon" className="rounded-full h-10 w-10" onClick={() => router.push('/host-p')}><Power size={18} /></Button>
        </div>
      </div>

      <div className="absolute top-24 right-4 z-50">
        <LiveEarningTimer minutes={minutes} hostId={effectiveId} minimal />
      </div>

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

      <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 z-50">
        <div className="flex-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center px-5 h-14 shadow-2xl">
          <Input placeholder="Signal message..." value={inputText} onChange={e => setInputText(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMsg()} className="bg-transparent border-none text-white text-xs font-bold placeholder-white/30 focus-visible:ring-0 h-full" />
          <button onClick={sendMsg} className="text-primary p-2"><Send size={20} /></button>
        </div>
        <button onClick={() => setGiftOpen(true)} className="w-14 h-14 bg-gradient-to-tr from-yellow-400 to-amber-600 rounded-full flex items-center justify-center shadow-2xl"><Gift size={28} className="text-black" /></button>
      </div>

      {giftOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/20 backdrop-blur-sm" onClick={() => setGiftOpen(false)}>
          <div className="w-full max-w-lg bg-[#2D1B2D]/95 backdrop-blur-2xl rounded-t-[3rem] p-8 animate-in slide-in-from-bottom-full duration-500 border-t border-white/10" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8" />
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

      {bonusShow && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-6 backdrop-blur-md animate-in fade-in" onClick={() => setBonusShow(false)}>
          <div className="bg-gradient-to-br from-[#2D1B2D] to-black border-4 border-yellow-500/50 p-10 rounded-[3.5rem] text-center shadow-2xl animate-in zoom-in max-w-[340px]" onClick={e => e.stopPropagation()}>
            <Trophy className="size-20 text-yellow-400 mx-auto mb-6 animate-bounce" />
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-2 leading-tight">30 MIN BONUS!</h2>
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl mb-8">
              <p className="text-2xl font-black text-yellow-400 tracking-tight">+500 DIAMONDS</p>
            </div>
            <Button onClick={() => setBonusShow(false)} className="w-full h-16 bg-yellow-500 hover:bg-yellow-600 text-black font-black uppercase tracking-widest rounded-2xl shadow-xl">Claim Gift</Button>
          </div>
        </div>
      )}
    </div>
  );
}

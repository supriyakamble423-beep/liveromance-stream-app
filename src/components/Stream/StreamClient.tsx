'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  X, Heart, Send, Lock, Zap, ShieldOff, ShieldCheck, 
  Eye, Gift, Music, Share2, MoreVertical, Loader2, Power, Activity, Trophy, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { 
  doc, updateDoc, serverTimestamp, collection, 
  query, orderBy, limit, addDoc, onSnapshot, increment 
} from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import LiveEarningTimer from "@/components/Stream/LiveEarningTimer";

interface StreamClientProps {
  id: string;
}

export function StreamClient({ id }: StreamClientProps) {
  const router = useRouter();
  const { firestore, user, areServicesAvailable, isUserLoading } = useFirebase();
  const { toast } = useToast();

  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [giftDrawerOpen, setGiftDrawerOpen] = useState(false);
  const [streamMinutes, setStreamMinutes] = useState(0);
  const [bonusPopup, setBonusPopup] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const isHost = user?.uid === id || id === 'simulate_host';
  const effectiveId = isHost ? (user?.uid || 'simulate_host') : id;

  const hostRef = useMemoFirebase(() => {
    if (!firestore || !effectiveId) return null;
    return doc(firestore, 'hosts', effectiveId as string);
  }, [firestore, effectiveId]);

  const { data: host, isLoading: isHostLoading } = useDoc(hostRef);

  // Real-time Chat Messages (Using collection from User's Final snippet)
  useEffect(() => {
    if (!firestore) return;
    const q = query(
      collection(firestore, 'streamMessages'), 
      orderBy('timestamp', 'desc'), 
      limit(20)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs.reverse());
    });
    return () => unsubscribe();
  }, [firestore]);

  // Camera + Permissions Logic (Step 2 Fix)
  useEffect(() => {
    if (!isHost || cameraStream) return;
    const requestPermissions = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "user" }, 
          audio: true 
        });
        setCameraStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err) {
        toast({ 
          variant: "destructive", 
          title: "Permission Denied", 
          description: "Bhai, Camera/Mic ke bina stream nahi ho payegi" 
        });
      }
    };
    requestPermissions();
    return () => {
      if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    };
  }, [isHost, cameraStream, toast]);

  // Stream Timer + 30 Min Bonus Popup (Step 1 Fix)
  useEffect(() => {
    if (!isHost) return;
    const interval = setInterval(() => {
      setStreamMinutes(prev => {
        const nextMin = prev + 1;
        if (nextMin > 0 && nextMin % 30 === 0) {
          setBonusPopup(true);
        }
        return nextMin;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [isHost]);

  const claimBonus = async () => {
    if (!firestore || !effectiveId) return;
    try {
      const hRef = doc(firestore, 'hosts', effectiveId as string);
      await updateDoc(hRef, {
        earnings: increment(500),
        updatedAt: serverTimestamp()
      });
      setBonusPopup(false);
      toast({ title: "Bonus Claimed!", description: "500 Diamonds added to your vault." });
    } catch (e) {
      toast({ variant: "destructive", title: "Claim Failed" });
    }
  };

  const toggleMode = async () => {
    if (!isHost || !hostRef || isUpdating) return;
    setIsUpdating(true);
    const next = host?.streamType === 'public' ? 'private' : 'public';
    try {
      await updateDoc(hostRef, { streamType: next, updatedAt: serverTimestamp() });
      toast({ 
        title: `Mode: ${next.toUpperCase()}`, 
        className: next === 'private' ? "bg-red-600 text-white" : "bg-green-600 text-white" 
      });
    } catch {
      toast({ variant: "destructive", title: "Toggle Failed" });
    } finally {
      setIsUpdating(false);
    }
  };

  const endStream = async () => {
    if (!confirm("End stream?")) return;
    try {
      if (isHost && hostRef) {
        await updateDoc(hostRef, { isLive: false, updatedAt: serverTimestamp() });
      }
      cameraStream?.getTracks().forEach(t => t.stop());
      router.push('/host-p');
    } catch (e) {
      router.push('/host-p');
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !firestore || !user) return;
    try {
      await addDoc(collection(firestore, 'streamMessages'), {
        text: inputText,
        user: user?.displayName || user?.email?.split('@')[0] || 'User',
        userId: user.uid,
        timestamp: serverTimestamp()
      });
      setInputText("");
    } catch {
      toast({ variant: "destructive", title: "Message failed" });
    }
  };

  if (isUserLoading || isHostLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4">
        <Loader2 className="size-10 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Establishing Grid</p>
      </div>
    );
  }

  const isPrivate = host?.streamType === 'private';
  const isBlur = isPrivate || host?.manualBlur;
  const username = host?.username || 'Simulate Host';
  const img = host?.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${effectiveId}`;

  return (
    <div className="relative h-[100dvh] w-full max-w-[430px] mx-auto bg-black overflow-hidden font-sans border-x border-white/10">
      {/* Video Feed */}
      <div className="absolute inset-0 z-0">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className={cn("w-full h-full object-cover scale-x-[-1] transition-all duration-700", isBlur && "blur-3xl opacity-50")} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90" />
      </div>

      {/* Header - Clean with Revenue Tracker */}
      <div className="absolute top-0 left-0 right-0 p-6 pt-12 flex justify-between items-start z-50">
        <div className="flex items-center gap-3">
          <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-1.5 px-4 shadow-2xl flex flex-col items-start min-w-[140px]">
             <div className="py-1">
               <h3 className="text-white text-xs font-bold tracking-tight italic">@{username}</h3>
               <p className="text-white/60 text-[9px] flex items-center gap-1 mt-0.5">
                 <Eye size={10} className="text-primary" /> 1200 Watching
               </p>
             </div>
             {isHost && (
               <div className="mt-1 w-full pt-1 border-t border-white/5">
                 <LiveEarningTimer minutes={streamMinutes} hostId={effectiveId as string} minimal={true} />
               </div>
             )}
          </div>
        </div>

        <div className="flex flex-col gap-2 items-end">
          {isHost && (
            <div className="flex items-center gap-2">
              <Button 
                onClick={toggleMode} 
                disabled={isUpdating} 
                className={cn(
                  "h-9 px-5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-xl", 
                  isPrivate ? "bg-red-600 text-white" : "bg-green-600 text-white"
                )}
              >
                {isUpdating ? <Loader2 size={12} className="animate-spin mr-2" /> : isPrivate ? <Lock size={12} className="mr-2" /> : <Zap size={12} className="mr-2" />}
                {isPrivate ? "PRIVATE" : "PUBLIC"}
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            {isHost && (
               <button onClick={endStream} className="p-2 bg-red-600/20 backdrop-blur-md rounded-full text-red-500 border border-red-500/20"><Power size={20}/></button>
            )}
            <button onClick={() => router.back()} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/10"><X size={20}/></button>
          </div>
        </div>
      </div>

      {/* Centered Bonus Milestone Popup (Step 3 Fix) */}
      {bonusPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-[200] bg-black/80 backdrop-blur-md p-6">
           <div className="bg-gradient-to-br from-[#2D1B2D] to-black border-4 border-yellow-500/50 p-10 rounded-[3.5rem] text-center shadow-[0_0_100px_rgba(234,179,8,0.4)] animate-in zoom-in duration-500">
              <Trophy className="size-20 text-yellow-400 mx-auto mb-6 animate-bounce" />
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none mb-2">30 MIN BONUS!</h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Milestone Reached Successfully</p>
              
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl mb-8">
                <p className="text-2xl font-black text-yellow-400 tracking-tight">+500 DIAMONDS</p>
              </div>

              <div className="flex flex-col gap-3">
                <Button onClick={claimBonus} className="w-full h-16 bg-yellow-500 hover:bg-yellow-600 text-black font-black uppercase tracking-widest rounded-2xl shadow-xl">
                  Claim Reward
                </Button>
                <Button variant="ghost" onClick={() => setBonusPopup(false)} className="text-white/40 font-bold uppercase text-[10px] tracking-widest">
                  Later
                </Button>
              </div>
           </div>
        </div>
      )}

      {/* Real-time Messages */}
      <div className="absolute bottom-40 left-6 right-16 h-48 overflow-y-auto no-scrollbar space-y-2 z-40 pointer-events-none">
        {messages.map(msg => (
          <div key={msg.id} className="animate-in slide-in-from-left-2 fade-in duration-300 pointer-events-auto">
            <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl px-3 py-1.5 w-fit max-w-full">
              <p className="text-[10px] font-black text-primary uppercase inline-block mr-2 italic">{msg.user}:</p>
              <p className="text-[10px] font-medium text-white inline">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Side Actions */}
      <div className="absolute right-4 bottom-48 flex flex-col gap-4 z-40">
        {[Heart, Share2, MoreVertical].map((Icon, i) => (
          <button key={i} className="size-12 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/10 shadow-2xl hover:scale-110 transition-transform">
            <Icon size={24} />
          </button>
        ))}
      </div>

      {/* Tip Menu */}
      <div className="absolute bottom-20 left-6 right-20 flex flex-col gap-2 z-40">
        <div className="flex items-center justify-between bg-black/40 backdrop-blur-md border border-white/10 p-2 px-4 rounded-xl max-w-[160px]">
          <div className="flex items-center gap-2 text-white text-[9px] font-bold uppercase"><ShieldCheck size={12} className="text-primary"/> DM</div>
          <span className="text-yellow-400 text-[9px] font-black uppercase">10 TK</span>
        </div>
        <div className="flex items-center justify-between bg-black/40 backdrop-blur-md border border-white/10 p-2 px-4 rounded-xl max-w-[160px]">
          <div className="flex items-center gap-2 text-white text-[9px] font-bold uppercase"><Music size={12} className="text-primary"/> SONG</div>
          <span className="text-yellow-400 text-[9px] font-black uppercase">50 TK</span>
        </div>
      </div>

      {/* Input & Gift */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-10 z-40 flex items-center gap-3">
        <div className="flex-1 bg-white/10 backdrop-blur-2xl border border-white/10 h-14 rounded-full flex items-center px-6">
          <input 
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            className="bg-transparent border-none focus:ring-0 text-white text-sm w-full placeholder:text-white/30" 
            placeholder="Say something..." 
          />
          <button onClick={sendMessage} className="text-primary"><Send size={20}/></button>
        </div>
        <button 
          onClick={() => setGiftDrawerOpen(true)}
          className="size-14 bg-yellow-400 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.4)] animate-bounce"
        >
          <Gift size={28} className="text-black fill-current" />
        </button>
      </div>

      {/* Gift Drawer */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-3xl rounded-t-[40px] border-t border-white/10 z-[150] transition-transform duration-500 ease-out p-8 pt-4",
        giftDrawerOpen ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" onClick={() => setGiftDrawerOpen(false)} />
        <div className="flex justify-between items-center mb-8">
          <h4 className="text-xl font-black text-white italic uppercase">Send a Gift</h4>
          <div className="bg-white/10 px-4 py-2 rounded-full text-yellow-400 font-bold text-sm uppercase">💰 1,250</div>
        </div>
        <div className="grid grid-cols-4 gap-6 mb-10">
          {['🌹', '🍦', '💎', '🚀'].map((emoji, i) => (
            <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="size-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl group-active:scale-90 transition-all border border-white/5">
                {emoji}
              </div>
              <span className="text-yellow-400 text-[10px] font-black italic uppercase">{(i + 1) * 10} TK</span>
            </div>
          ))}
        </div>
        <Button onClick={() => setGiftDrawerOpen(false)} className="w-full h-16 bg-primary rounded-2xl font-black text-white italic uppercase shadow-2xl border-none">Send Now</Button>
      </div>
    </div>
  );
}

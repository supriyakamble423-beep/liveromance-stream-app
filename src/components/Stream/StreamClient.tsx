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
import { useFirebase, useDoc } from "@/firebase";
import { 
  doc, updateDoc, serverTimestamp, collection, 
  addDoc, onSnapshot, query, orderBy, limit, increment 
} from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function StreamClient({ id }: { id: string }) {
  const router = useRouter();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [giftOpen, setGiftOpen] = useState(false);
  const [minutes, setMinutes] = useState(0);
  const [bonusShow, setBonusShow] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const isHost = user?.uid === id || id === 'simulate_host';
  
  // Dynamic host reference
  const effectiveId = id === 'simulate_host' ? (user?.uid || 'simulate_host') : id;
  const hostRef = doc(firestore!, 'hosts', effectiveId);
  const { data: host } = useDoc(hostRef);

  // Camera Permission & Stream
  useEffect(() => {
    if (!isHost) return;
    
    let currentStream: MediaStream | null = null;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(s => {
        currentStream = s;
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => {
        toast({ 
          variant: "destructive", 
          title: "Permission Denied", 
          description: "Bhai, Camera/Mic ke bina stream nahi ho payegi" 
        });
      });

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isHost, toast]);

  // Timer + Bonus Popup (FIXED LOGIC)
  useEffect(() => {
    if (!isHost) return;
    const intervalId = setInterval(() => {
      setMinutes(prev => {
        const newMinutes = prev + 1;
        if (newMinutes % 30 === 0 && newMinutes > 0) { 
          setBonusShow(true);
        }
        return newMinutes;
      });
    }, 60000);
    return () => clearInterval(intervalId);
  }, [isHost]);

  // Live Messages
  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, 'streamMessages'), orderBy('timestamp', 'desc'), limit(50));
    const unsub = onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      setMessages(msgs.reverse() as any);
    });
    return unsub;
  }, [firestore]);

  const sendMsg = async () => {
    if (!inputText.trim() || !firestore) return;
    try {
      await addDoc(collection(firestore, 'streamMessages'), {
        text: inputText,
        user: user?.displayName || user?.email?.split('@')[0] || 'Guest',
        uid: user?.uid || 'guest',
        timestamp: serverTimestamp()
      });
      setInputText("");
    } catch (e) {
      toast({ variant: "destructive", title: "Send Failed" });
    }
  };

  const togglePrivate = async () => {
    if (!hostRef) return;
    const nextMode = host?.streamType === 'private' ? 'public' : 'private';
    try {
      await updateDoc(hostRef, { streamType: nextMode, updatedAt: serverTimestamp() });
      toast({ title: `Mode: ${nextMode.toUpperCase()}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const endStream = async () => {
    if (!confirm("End stream?")) return;
    try {
      if (isHost && hostRef) {
        await updateDoc(hostRef, { isLive: false, updatedAt: serverTimestamp() });
      }
      stream?.getTracks().forEach(t => t.stop());
      router.push('/host-p');
    } catch (e) {
      router.push('/host-p');
    }
  };

  const claimBonus = async () => {
    if (!firestore || !hostRef) return;
    try {
      await updateDoc(hostRef, {
        earnings: increment(500),
        updatedAt: serverTimestamp()
      });
      setBonusShow(false);
      toast({ title: "Bonus Claimed!", description: "500 Diamonds added to your vault." });
    } catch (e) {
      toast({ variant: "destructive", title: "Claim Failed" });
    }
  };

  const isPrivate = host?.streamType === 'private';

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden max-w-[430px] mx-auto border-x border-white/10">
      {/* Video */}
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        playsInline 
        className={cn(
          "absolute inset-0 w-full h-full object-cover transition-all duration-500",
          (isPrivate || host?.manualBlur) && "blur-xl grayscale opacity-60"
        )} 
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

      {/* Header */}
      <div className="absolute top-10 left-4 right-4 z-50 flex justify-between items-start">
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-2xl">
          <div className="relative">
            <Image 
              src={host?.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${effectiveId}`} 
              alt="Host" 
              width={44} 
              height={44} 
              className="rounded-full border-2 border-primary" 
            />
            <div className="absolute -bottom-1 -right-1 bg-red-500 size-3 rounded-full border-2 border-black animate-pulse" />
          </div>
          <div>
            <p className="text-white text-xs font-black uppercase italic tracking-tight truncate max-w-[100px]">@{host?.username || "Simulate Host"}</p>
            <p className="text-white/70 text-[10px] font-bold flex items-center gap-1">
              <Eye size={12} className="text-primary" /> 1.2k Watchers
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={togglePrivate} 
            className={cn(
              "rounded-full px-5 h-10 text-[10px] font-black uppercase tracking-widest shadow-xl border-none",
              isPrivate ? "bg-red-600" : "bg-green-600"
            )}
          >
            {isPrivate ? <Lock size={14} className="mr-1" /> : <Zap size={14} className="mr-1" />} 
            {isPrivate ? "Private" : "Public"}
          </Button>
          <Button 
            variant="destructive" 
            size="icon" 
            className="rounded-full h-10 w-10 shadow-xl" 
            onClick={endStream}
          >
            <Power size={18} />
          </Button>
        </div>
      </div>

      {/* Side Buttons */}
      <div className="absolute right-4 top-1/3 flex flex-col gap-4 z-50">
        <button className="w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 shadow-2xl hover:scale-110 transition-all active:scale-90">
          <Heart size={24} className="text-red-500 fill-current" />
        </button>
        <button className="w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 shadow-2xl hover:scale-110 transition-all active:scale-90">
          <Share2 size={24} className="text-blue-400" />
        </button>
        <button className="w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 shadow-2xl hover:scale-110 transition-all active:scale-90">
          <MoreVertical size={24} />
        </button>
      </div>

      {/* Tip Menu */}
      <div className="absolute bottom-28 left-4 right-4 flex flex-col gap-2 z-50">
        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-3 rounded-2xl flex justify-between items-center shadow-xl">
          <div className="flex items-center gap-2">
            <div className="bg-primary/20 p-1.5 rounded-lg">
              <Mail size={16} className="text-primary" />
            </div>
            <span className="text-white text-[10px] font-black uppercase tracking-widest">Secret DM</span>
          </div>
          <span className="text-yellow-400 font-black text-xs">10 TK</span>
        </div>
        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-3 rounded-2xl flex justify-between items-center shadow-xl">
          <div className="flex items-center gap-2">
            <div className="bg-secondary/20 p-1.5 rounded-lg">
              <Music size={16} className="text-secondary" />
            </div>
            <span className="text-white text-[10px] font-black uppercase tracking-widest">Song Request</span>
          </div>
          <span className="text-yellow-400 font-black text-xs">50 TK</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 z-50">
        <div className="flex-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center px-5 h-14 shadow-2xl">
          <Input 
            placeholder="Say something..." 
            value={inputText} 
            onChange={e => setInputText(e.target.value)} 
            onKeyPress={e => e.key === 'Enter' && sendMsg()}
            className="bg-transparent border-none text-white text-xs font-bold placeholder-white/30 focus-visible:ring-0 h-full" 
          />
          <button onClick={sendMsg} className="text-primary hover:text-secondary transition-colors p-2">
            <Send size={20} />
          </button>
        </div>
        <button 
          onClick={() => setGiftOpen(true)} 
          className="w-14 h-14 bg-gradient-to-tr from-yellow-400 to-amber-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:scale-110 transition-transform active:scale-95"
        >
          <Gift size={28} className="text-black" />
        </button>
      </div>

      {/* Real-time Messages Feed */}
      <div className="absolute bottom-48 left-4 right-12 max-h-40 overflow-y-auto no-scrollbar flex flex-col gap-2 z-40">
        {messages.map((msg: any) => (
          <div key={msg.id} className="bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-xl w-fit max-w-full animate-in slide-in-from-left-2">
            <p className="text-[10px] leading-tight">
              <span className="text-primary font-black uppercase tracking-tighter mr-1">{msg.user}:</span>
              <span className="text-white/90 font-medium">{msg.text}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Gift Drawer */}
      {giftOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/20 backdrop-blur-sm"
          onClick={() => setGiftOpen(false)}
        >
          <div 
            className="w-full max-w-[430px] bg-[#2D1B2D]/95 backdrop-blur-2xl rounded-t-[3rem] p-8 animate-in slide-in-from-bottom-full duration-500 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-white/10"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8 cursor-pointer" onClick={() => setGiftOpen(false)} />
            <h4 className="text-xl font-black uppercase italic text-white mb-8 text-center tracking-widest">Premium Gifts</h4>
            
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { e: '🌹', n: 'Rose', p: '1' },
                { e: '🍦', n: 'Ice', p: '5' },
                { e: '💎', n: 'Gem', p: '100' },
                { e: '🚀', n: 'Node', p: '1k' }
              ].map(item => (
                <div key={item.n} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                  <div className="size-14 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-2xl flex items-center justify-center text-2xl shadow-xl group-hover:scale-110 transition-transform">
                    {item.e}
                  </div>
                  <span className="text-yellow-400 text-[10px] font-black uppercase tracking-tighter">{item.p} TK</span>
                </div>
              ))}
            </div>
            
            <Button className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl transition-all active:scale-95">
              Send Signal
            </Button>
          </div>
        </div>
      )}

      {/* Bonus Popup */}
      {bonusShow && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-6 backdrop-blur-md animate-in fade-in duration-500"
          onClick={() => setBonusShow(false)}
        >
          <div 
            className="bg-gradient-to-br from-[#2D1B2D] to-black border-4 border-yellow-500/50 p-10 rounded-[3.5rem] text-center shadow-[0_0_100px_rgba(234,179,8,0.4)] animate-in zoom-in duration-500 max-w-[340px]"
            onClick={e => e.stopPropagation()}
          >
            <Trophy className="size-20 text-yellow-400 mx-auto mb-6 animate-bounce" />
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none mb-2">30 MIN BONUS!</h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Node Uptime Milestone</p>
            
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl mb-8">
              <p className="text-2xl font-black text-yellow-400 tracking-tight">+500 DIAMONDS</p>
            </div>

            <Button 
              onClick={claimBonus} 
              className="w-full h-16 bg-yellow-500 hover:bg-yellow-600 text-black font-black uppercase tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all"
            >
              Claim Reward
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
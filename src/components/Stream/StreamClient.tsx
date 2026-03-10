'use client';

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, Heart, Send, Lock, Zap, Eye, Gift, Music, Share2, MoreVertical, Power, Mail, Trophy, Grid3X3, Users, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, serverTimestamp, collection, addDoc, onSnapshot, query, orderBy, limit, increment, getDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function StreamClient({ id }: { id: string }) {
  const router = useRouter();
  const { firestore, user, areServicesAvailable } = useFirebase();
  const { toast } = useToast();

  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [giftOpen, setGiftOpen] = useState(false);
  const [minutes, setMinutes] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [hostData, setHostData] = useState<any>(null);
  const [isGridLoading, setIsGridLoading] = useState(true);
  const [isSimulated, setIsSimulated] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const isHost = user?.uid === id || id === 'simulate_host' || !areServicesAvailable;

  // Safe host reference
  const hostRef = useMemo(() => {
    if (!firestore || !id || id === 'simulate_host') return null;
    return doc(firestore, 'hosts', id);
  }, [firestore, id]);

  const { data: host, isLoading: isHostLoading } = useDoc(hostRef);

  // Recovery Logic for Simulation Node
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isGridLoading) {
        console.warn("Grid Loading Timeout: Entering Simulation Mode");
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
    } else if (areServicesAvailable && !isHostLoading && !host) {
      // Doc doesn't exist, use simulation
      setIsSimulated(true);
      setHostData({ username: "New Node", streamType: 'public', viewers: 0 });
      setIsGridLoading(false);
      clearTimeout(timer);
    }

    return () => clearTimeout(timer);
  }, [host, id, areServicesAvailable, isHostLoading, isGridLoading]);

  // Camera Permission Trigger
  const startBroadcast = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true
      });
      
      setStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if (hostRef && isHost && areServicesAvailable) {
        await updateDoc(hostRef, {
          isLive: true,
          lastLive: serverTimestamp()
        });
      }
      
      setIsLive(true);
      toast({ title: "🔴 LIVE", description: isSimulated ? "Broadcast active in simulation mode." : "Your broadcast signal is active." });
    } catch (err: any) {
      console.error("Camera Error:", err);
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "Bhai, Camera access allow karo varna stream nahi chalegi."
      });
    }
  };

  // Real-time Messages
  useEffect(() => {
    if (!firestore || !areServicesAvailable) {
      // Mock messages for simulation
      setMessages([
        { id: '1', user: 'System', text: 'Connecting to romantic chat grid...' },
        { id: '2', user: 'AI-Bot', text: 'Simulation mode active. Send a message to test!' }
      ]);
      return;
    }
    
    const q = query(
      collection(firestore, 'streamMessages'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse());
    }, (error) => {
      console.warn("Chat signal slow:", error.message);
    });
    
    return () => unsub();
  }, [firestore, areServicesAvailable]);

  // Send Message
  const sendMsg = async () => {
    if (!inputText.trim()) return;
    
    if (!firestore || !areServicesAvailable || !user) {
      // Simulate message locally
      const newMsg = { id: Date.now().toString(), user: 'You', text: inputText };
      setMessages(prev => [...prev, newMsg]);
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
    } catch (e) {
      console.error("Message send failed");
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [stream]);

  if (isGridLoading) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="relative size-20">
          <Grid3X3 className="size-full text-primary animate-pulse" />
          <Loader2 className="absolute -bottom-2 -right-2 size-8 text-primary animate-spin" />
        </div>
        <div className="space-y-2">
          <h3 className="text-white font-black uppercase italic tracking-widest">Syncing Grid Node</h3>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">Connecting to Romantic AI Hub</p>
        </div>
      </div>
    );
  }

  const displayHost = hostData || host;

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden max-w-[430px] mx-auto screen-guard-active">
      {/* Video Layer */}
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        playsInline 
        className={cn(
          "absolute inset-0 w-full h-full object-cover transition-opacity duration-1000",
          isLive ? "opacity-100" : "opacity-30"
        )} 
      />
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90 pointer-events-none" />

      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-50 flex flex-col gap-2 animate-in fade-in slide-in-from-top-4">
        {(!areServicesAvailable || isSimulated) && (
          <div className="bg-amber-500/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-amber-500/30 flex items-center justify-center gap-2">
            <AlertCircle className="size-3 text-amber-500" />
            <span className="text-[8px] font-black uppercase tracking-widest text-amber-200">Simulation Node Active</span>
          </div>
        )}
        
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
            <div className="relative size-10 rounded-full overflow-hidden border-2 border-primary shadow-lg">
              <Image
                src={displayHost?.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`}
                alt="Host"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-white font-black text-xs uppercase italic tracking-tight">@{displayHost?.username || "Host"}</p>
              <p className="text-primary text-[9px] font-black uppercase flex items-center gap-1">
                <Eye size={10} /> {displayHost?.viewers || 0} Watchers
              </p>
            </div>
          </div>
          
          {isHost && (
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  if (!hostRef || !areServicesAvailable) {
                    toast({ title: "Simulated", description: "Stream type changed locally." });
                    return;
                  }
                  const newType = displayHost?.streamType === 'public' ? 'private' : 'public';
                  await updateDoc(hostRef, { streamType: newType });
                }}
                className={cn("rounded-full px-4 h-10 text-[9px] font-black uppercase tracking-widest", displayHost?.streamType === 'private' ? "bg-red-600 shadow-[0_0_15px_#dc2626]" : "bg-green-600 shadow-[0_0_15px_#16a34a]")}
              >
                {displayHost?.streamType === 'private' ? <Lock size={12} className="mr-1" /> : <Zap size={12} className="mr-1" />}
                {displayHost?.streamType}
              </Button>
              <Button variant="destructive" size="icon" className="rounded-full size-10 shadow-lg" onClick={() => router.push('/host-p')}>
                <Power size={16} />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Side Buttons */}
      <div className="absolute right-4 top-1/3 flex flex-col gap-4 z-50 animate-in fade-in slide-in-from-right-4">
        <button className="size-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:scale-110 transition shadow-xl group">
          <Heart size={24} className="text-primary fill-transparent group-hover:fill-primary transition-colors" />
        </button>
        <button className="size-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:scale-110 transition shadow-xl">
          <Share2 size={22} className="text-secondary" />
        </button>
        <button className="size-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:scale-110 transition shadow-xl">
          <MoreVertical size={22} />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="absolute bottom-28 left-4 right-4 max-h-48 overflow-y-auto space-y-2 z-40 no-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5 inline-block max-w-[85%] animate-in slide-in-from-left-2">
            <p className="text-[10px] leading-relaxed">
              <span className="text-secondary font-black uppercase italic mr-2">{msg.user}:</span>
              <span className="text-white/90 font-medium">{msg.text}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Input Bar */}
      <div className="absolute bottom-6 left-4 right-4 flex items-center gap-3 z-50 animate-in slide-in-from-bottom-4">
        <div className="flex-1 bg-black/60 backdrop-blur-xl border border-white/10 rounded-[2rem] flex items-center px-5 py-3 shadow-2xl">
          <Input
            placeholder="Send love..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMsg()}
            className="bg-transparent border-none text-white placeholder-white/30 focus:ring-0 text-xs font-bold"
          />
          <button onClick={sendMsg} className="text-primary hover:scale-110 transition">
            <Send size={20} />
          </button>
        </div>
        <button
          onClick={() => setGiftOpen(true)}
          className="size-14 bg-gradient-to-tr from-yellow-400 to-amber-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 transition"
        >
          <Gift size={26} className="text-black" />
        </button>
      </div>

      {/* GO LIVE Overlay */}
      {!isLive && isHost && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-[60] bg-black/40 backdrop-blur-sm">
          <div className="text-center space-y-8 px-8">
            <div className="size-32 mx-auto relative">
              <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping" />
              <div className="relative size-full bg-primary rounded-full flex items-center justify-center shadow-[0_0_50px_#E11D48]">
                <Power size={48} className="text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">Grid Standby</h2>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.4em]">Node ID: {id.slice(0, 8)}</p>
            </div>
            <Button
              onClick={startBroadcast}
              className="w-full h-20 bg-primary hover:bg-primary/90 text-white rounded-[2.5rem] font-black text-2xl uppercase italic tracking-tighter shadow-2xl transition-transform active:scale-95"
            >
              🔴 GO LIVE
            </Button>
          </div>
        </div>
      )}

      {/* Gift Drawer */}
      {giftOpen && (
        <div className="fixed inset-x-0 bottom-0 bg-[#2D1B2D]/95 backdrop-blur-2xl rounded-t-[3rem] z-[100] p-8 border-t border-white/10 animate-in slide-in-from-bottom-full duration-500" onClick={(e) => e.target === e.currentTarget && setGiftOpen(false)}>
          <div className="w-16 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
          <h4 className="text-2xl font-black text-white mb-8 text-center italic uppercase tracking-tighter">Luxury Vault</h4>
          <div className="grid grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Rose', cost: '1TK', icon: '🌹', color: 'from-red-400 to-pink-600' },
              { label: 'Ice', cost: '5TK', icon: '🍦', color: 'from-cyan-400 to-blue-600' },
              { label: 'Diamond', cost: '100TK', icon: '💎', color: 'from-purple-400 to-indigo-600' },
              { label: 'Rocket', cost: '1kTK', icon: '🚀', color: 'from-orange-400 to-red-600' }
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group" onClick={() => {
                toast({ title: "Gift Simulated", description: `Sent ${item.label} successfully!` });
                setGiftOpen(false);
              }}>
                <div className={cn("size-16 rounded-3xl flex items-center justify-center text-3xl shadow-xl group-hover:scale-110 transition-transform bg-gradient-to-br", item.color)}>
                  {item.icon}
                </div>
                <div className="text-center">
                  <p className="text-white font-black text-[8px] uppercase tracking-widest">{item.label}</p>
                  <p className="text-primary font-black text-[10px]">{item.cost}</p>
                </div>
              </div>
            ))}
          </div>
          <Button className="w-full h-16 romantic-gradient rounded-[2rem] font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20" onClick={() => setGiftOpen(false)}>
            Close Vault
          </Button>
        </div>
      )}
    </div>
  );
}

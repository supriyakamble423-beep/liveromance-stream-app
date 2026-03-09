'use client';

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, Heart, Send, Lock, Zap, Eye, Gift, Music, Share2, MoreVertical, Power, Mail, Trophy, Grid3X3, Users } from "lucide-react";
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
  const [bonusShow, setBonusShow] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [gridError, setGridError] = useState(false);
  const [hostData, setHostData] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const isHost = user?.uid === id || id === 'simulate_host';

  // ✅ Safe host reference with guard
  const hostRef = useMemo(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'hosts', id);
  }, [firestore, id]);

  const {  host } = useDoc(hostRef);

  // ✅ Grid Error Recovery - Fallback host data
  useEffect(() => {
    if (!areServicesAvailable) return;
    
    const loadHostData = async () => {
      try {
        if (id === 'simulate_host' && !host) {
          // Mock data for simulation mode
          setHostData({
            username: "TestHost",
            streamType: "public",
            isLive: false,
            viewers: 1250,
            verified: true,
            photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`
          });
        } else if (host) {
          setHostData(host);
        }
        setGridError(false);
      } catch (err) {
        console.error("Grid load error:", err);
        setGridError(true);
      }
    };
    
    loadHostData();
  }, [host, id, areServicesAvailable]);

  // ✅ Camera Permission - Only on GO LIVE click
  const startBroadcast = async () => {
    if (!areServicesAvailable) {
      toast({ variant: "destructive", title: "Loading...", description: "Please wait" });
      return;
    }

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

      // Update host as LIVE
      if (hostRef && isHost) {
        await updateDoc(hostRef, {
          isLive: true,
          streamType: 'public',
          viewers: increment(1),
          lastLive: serverTimestamp()
        });
      }
      
      setIsLive(true);
      setGridError(false);
      toast({ title: "🔴 LIVE", description: "You are now broadcasting!" });
      
    } catch (err: any) {
      console.error("Camera/Grid Error:", err);
      setGridError(true);
      toast({
        variant: "destructive",
        title: "Grid Error",
        description: "Camera access denied or grid failed. Tap to retry."
      });
    }
  };

  // ✅ Timer + Bonus (Fixed Logic)
  useEffect(() => {
    if (!isHost) return;
    const interval = setInterval(() => {
      setMinutes(prev => {
        const newMinutes = prev + 1;
        if (newMinutes % 30 === 0) {
          setBonusShow(true);
        }
        return newMinutes;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [isHost]);

  // ✅ Real-time Messages
  useEffect(() => {
    if (!firestore) return;
    
    const q = query(
      collection(firestore, 'streamMessages'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse());
    }, (error) => {
      console.error("Chat error:", error);
    });
    
    return () => unsub();
  }, [firestore]);

  // ✅ Send Message
  const sendMsg = async () => {
    if (!inputText.trim() || !firestore || !user) return;
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
      console.error("Send error:", e);
    }
  };

  // ✅ Cleanup
  useEffect(() => {
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [stream]);

  // ✅ Grid Error Fallback UI
  if (gridError || !areServicesAvailable) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <Grid3X3 className="w-16 h-16 text-red-400 mb-4 animate-pulse" />
        <h3 className="text-white font-bold text-lg mb-2">Grid Loading...</h3>
        <p className="text-white/60 text-sm mb-6">
          {!areServicesAvailable ? "Connecting to Firebase..." : "Grid render failed"}
        </p>
        <Button 
          onClick={() => {
            setGridError(false);
            if (isHost) startBroadcast();
          }}
          className="bg-primary px-8 py-3 rounded-full font-bold"
        >
          Retry Grid
        </Button>
      </div>
    );
  }

  const displayHost = hostData || host;

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden max-w-[430px] mx-auto">
      
      {/* ✅ Video Layer */}
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        playsInline 
        className={cn(
          "absolute inset-0 w-full h-full object-cover transition-opacity",
          isLive ? "opacity-100" : "opacity-30"
        )} 
      />
      
      {/* ✅ Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90 pointer-events-none" />

      {/* ✅ Header - Safe Render */}
      <div className="absolute top-4 left-4 right-4 z-50 flex justify-between items-start">
        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
          <Image
            src={displayHost?.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`}
            alt="Host"
            width={48}
            height={48}
            className="rounded-full border-2 border-purple-500"
          />
          <div>
            <p className="text-white font-bold">@{displayHost?.username || "Host"}</p>
            <p className="text-white/70 text-sm flex items-center gap-1">
              <Eye size={14} /> {displayHost?.viewers || 0} Watching
            </p>
          </div>
        </div>
        
        {isHost && (
          <div className="flex gap-2">
            <Button
              onClick={async () => {
                if (!hostRef) return;
                const newType = displayHost?.streamType === 'public' ? 'private' : 'public';
                await updateDoc(hostRef, { streamType: newType });
              }}
              className={cn("rounded-full px-4", displayHost?.streamType === 'private' ? "bg-red-600" : "bg-green-600")}
            >
              {displayHost?.streamType === 'private' ? <Lock size={14} /> : <Zap size={14} />}
            </Button>
            <Button variant="destructive" size="icon" className="rounded-full" onClick={() => {
              stream?.getTracks().forEach(t => t.stop());
              setIsLive(false);
              router.push('/host-p');
            }}>
              <Power size={16} />
            </Button>
          </div>
        )}
      </div>

      {/* ✅ Side Buttons */}
      <div className="absolute right-4 top-1/3 flex flex-col gap-4 z-50">
        <button className="w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:scale-110 transition">
          <Heart size={24} className="text-red-400" />
        </button>
        <button className="w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:scale-110 transition">
          <Share2 size={24} className="text-blue-400" />
        </button>
        <button className="w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:scale-110 transition">
          <MoreVertical size={24} />
        </button>
      </div>

      {/* ✅ Messages Grid - Safe Render */}
      <div className="absolute bottom-32 left-4 right-4 max-h-40 overflow-y-auto space-y-2 z-40">
        {messages.map((msg) => (
          <div key={msg.id} className="bg-black/40 backdrop-blur-md px-3 py-2 rounded-xl max-w-[85%]">
            <span className="text-purple-400 font-bold text-xs">{msg.user}: </span>
            <span className="text-white/90 text-xs">{msg.text}</span>
          </div>
        ))}
      </div>

      {/* ✅ Input + Gift */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 z-50">
        <div className="flex-1 bg-black/50 backdrop-blur-md border border-white/20 rounded-full flex items-center px-4 py-2">
          <Input
            placeholder="Say something..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMsg()}
            className="bg-transparent border-none text-white placeholder-white/50 focus:ring-0 text-sm"
          />
          <button onClick={sendMsg} className="text-purple-400 ml-2">
            <Send size={18} />
          </button>
        </div>
        <button
          onClick={() => setGiftOpen(true)}
          className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition"
        >
          <Gift size={22} className="text-black" />
        </button>
      </div>

      {/* ✅ GO LIVE Button - Only for Host */}
      {!isLive && isHost && (
        <div className="absolute bottom-24 left-0 right-0 flex justify-center z-50">
          <Button
            onClick={startBroadcast}
            disabled={!areServicesAvailable}
            className="bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-full font-bold text-lg shadow-[0_0_30px_rgba(220,38,38,0.6)] disabled:opacity-50"
          >
            🔴 GO LIVE
          </Button>
        </div>
      )}

      {/* ✅ Bonus Popup */}
      {bonusShow && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200]" onClick={() => setBonusShow(false)}>
          <div className="bg-gradient-to-br from-yellow-500 to-amber-600 p-8 rounded-3xl text-center max-w-[320px] mx-4" onClick={(e) => e.stopPropagation()}>
            <Trophy className="w-20 h-20 text-white mx-auto mb-4" />
            <h2 className="text-3xl font-black text-white">30 MIN BONUS!</h2>
            <p className="text-xl text-white mt-2 font-bold">+500 Diamonds</p>
            <Button onClick={() => setBonusShow(false)} className="mt-6 bg-white text-yellow-600 px-8 py-3 rounded-full font-bold">
              Claim Now
            </Button>
          </div>
        </div>
      )}

      {/* ✅ Gift Drawer */}
      {giftOpen && (
        <div className="fixed inset-x-0 bottom-0 bg-slate-900/95 backdrop-blur-xl rounded-t-[2rem] z-[100] p-6" onClick={(e) => e.target === e.currentTarget && setGiftOpen(false)}>
          <div className="w-12 h-1.5 bg-white/30 rounded-full mx-auto mb-6" />
          <h4 className="text-xl font-bold text-white mb-6 text-center">Send a Gift</h4>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {['🌹 Rose 1TK', '🍦 Ice 5TK', '💎 Diamond 100TK', '🚀 Rocket 1kTK'].map((item) => (
              <div key={item} className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-white/5 cursor-pointer">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-2xl flex items-center justify-center text-2xl">
                  {item.split(' ')[0]}
                </div>
                <span className="text-yellow-300 text-[10px] font-bold text-center">{item.split(' ').slice(1).join(' ')}</span>
              </div>
            ))}
          </div>
          <Button className="w-full bg-purple-600 h-12 rounded-2xl font-bold" onClick={() => setGiftOpen(false)}>
            Send Gift
          </Button>
        </div>
      )}
    </div>
  );
}
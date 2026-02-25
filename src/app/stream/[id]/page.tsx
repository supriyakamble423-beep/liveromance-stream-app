
"use client"

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  X, Eye, Heart, Send,
  Lock, Zap, UserPlus, ShieldOff, ShieldCheck, Check, Ban, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection, query, orderBy, limit, where, updateDoc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import LiveEarningTimer from "@/components/Stream/LiveEarningTimer";
import { Badge } from "@/components/ui/badge";

export default function StreamPage() {
  const { id } = useParams();
  const router = useRouter();
  const { firestore, user, areServicesAvailable } = useFirebase();
  const { toast } = useToast();

  const [inputText, setInputText] = useState("");
  const [streamMinutes, setStreamMinutes] = useState(0);
  const [requestPopup, setRequestPopup] = useState<{ id: string; name: string } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const isHost = user?.uid === id || id === 'simulate_host';
  const effectiveId = (id === 'simulate_host') ? (user?.uid || 'simulate_host') : id;

  const hostRef = useMemoFirebase(() => {
    if (!firestore || !effectiveId) return null;
    return doc(firestore, 'hosts', effectiveId as string);
  }, [firestore, effectiveId]);

  const { data: host, isLoading } = useDoc(hostRef);

  // Listener for Private Requests
  useEffect(() => {
    if (!firestore || !isHost || !effectiveId) return;

    const q = query(
      collection(firestore, 'streamRequests'),
      where('hostId', '==', effectiveId),
      where('status', '==', 'pending'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        const docId = snapshot.docs[0].id;
        setRequestPopup({ id: docId, name: docData.userName || 'Anonymous' });
        const timer = setTimeout(() => setRequestPopup(null), 5000);
        return () => clearTimeout(timer);
      } else {
        setRequestPopup(null);
      }
    });

    return () => unsubscribe();
  }, [firestore, isHost, effectiveId]);

  // Stream Timer
  useEffect(() => {
    if (!isHost) return;
    const interval = setInterval(() => setStreamMinutes(prev => prev + 1), 60000);
    return () => clearInterval(interval);
  }, [isHost]);

  // Camera Access
  useEffect(() => {
    if (!isHost) return;
    const getCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setCameraStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err) {
        console.error(err);
        toast({ variant: "destructive", title: "Camera Error", description: "Could not access camera node." });
      }
    };
    getCamera();

    return () => {
      cameraStream?.getTracks().forEach(t => t.stop());
    };
  }, [isHost]);

  const toggleStreamMode = async () => {
    if (!isHost || !hostRef) return;
    setIsUpdating(true);
    const nextMode = host?.streamType === 'public' ? 'private' : 'public';
    try {
      await setDoc(hostRef, { 
        streamType: nextMode, 
        isLive: true, 
        updatedAt: serverTimestamp() 
      }, { merge: true });
      
      toast({ 
        title: `MODE: ${nextMode.toUpperCase()}`, 
        className: nextMode === 'private' ? "bg-red-600 text-white" : "bg-green-600 text-white" 
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed", description: "Database signal lost." });
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleBlur = async () => {
    if (!hostRef || !host) return;
    try {
      await updateDoc(hostRef, { manualBlur: !host.manualBlur });
    } catch (e) {
      toast({ variant: "destructive", title: "Blur Signal Failed" });
    }
  };

  const handleRequest = async (reqId: string, action: 'approved' | 'rejected') => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'streamRequests', reqId), { 
        status: action, 
        updatedAt: serverTimestamp() 
      });
      setRequestPopup(null);
      toast({ title: action === 'approved' ? "Session Accepted" : "Request Declined" });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Action Failed' });
    }
  };

  const endStream = async () => {
    if (!confirm("Are you sure you want to disconnect?")) return;
    if (isHost && hostRef) {
      await updateDoc(hostRef, { isLive: false, streamType: 'public' });
    }
    cameraStream?.getTracks().forEach(t => t.stop());
    router.push('/host-p');
  };

  if (isLoading && areServicesAvailable) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <Loader2 className="size-12 animate-spin text-primary" />
      </div>
    );
  }

  const isPrivate = host?.streamType === 'private';
  const isBlur = isPrivate || host?.manualBlur;
  const username = host?.username || 'Host';
  const img = host?.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${effectiveId}`;

  return (
    <div className="relative h-screen w-full flex flex-col overflow-hidden bg-black max-w-lg mx-auto border-x border-white/10">
      {/* Background Feed */}
      <div className="absolute inset-0 z-0">
        {isHost ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={cn(
              "w-full h-full object-cover scale-x-[-1] transition-all duration-700", 
              isBlur && "blur-3xl opacity-60"
            )} 
          />
        ) : (
          <Image 
            src={img} 
            alt="Stream" 
            fill 
            className={cn("object-cover transition-all duration-700", isBlur ? "blur-3xl opacity-40" : "opacity-90")} 
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />
      </div>

      {/* Top Controls Overlay */}
      <div className="absolute top-10 left-0 right-0 z-50 flex justify-center px-6">
        {isHost && (
          <div className="flex gap-3">
            <Button
              onClick={toggleStreamMode}
              disabled={isUpdating}
              className={cn(
                "h-12 px-8 rounded-full text-xs font-black uppercase tracking-widest shadow-2xl transition-all border-none italic", 
                isPrivate ? "bg-red-600 text-white" : "bg-green-500 text-white"
              )}
            >
              {isUpdating ? <Loader2 className="size-4 mr-2 animate-spin" /> : isPrivate ? <Lock className="size-4 mr-2" /> : <Zap className="size-4 mr-2" />}
              MODE: {isPrivate ? "PRIVATE" : "PUBLIC"}
            </Button>
            
            {/* Show Blur button ONLY in Private Mode */}
            {isPrivate && (
              <Button 
                onClick={toggleBlur} 
                size="icon" 
                className={cn(
                  "h-12 w-12 rounded-full shadow-2xl border-none transition-all", 
                  host?.manualBlur ? "bg-primary text-white" : "bg-white/20 text-white"
                )}
              >
                {host?.manualBlur ? <ShieldOff size={20} /> : <ShieldCheck size={20} />}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Revenue HUD */}
      {isHost && (
        <div className="absolute top-24 right-6 z-50">
          <LiveEarningTimer minutes={streamMinutes} />
        </div>
      )}

      {/* Center Popup for Requests */}
      {requestPopup && (
        <div className="absolute inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm px-6">
          <div className="bg-gradient-to-br from-[#E11D48] to-[#F472B6] p-8 rounded-[3rem] shadow-[0_20px_60px_rgba(225,29,72,0.6)] text-center space-y-6 w-full max-w-sm border border-white/20">
            <div className="size-20 bg-white/20 rounded-full flex items-center justify-center mx-auto">
              <UserPlus size={40} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">@{requestPopup.name}</h3>
              <p className="text-[10px] font-black text-white/80 uppercase tracking-widest mt-1">Wants Private Call</p>
            </div>
            <div className="flex gap-4">
              <Button onClick={() => handleRequest(requestPopup.id, 'approved')} className="flex-1 h-14 rounded-2xl bg-white text-primary font-black uppercase tracking-widest border-none">Accept</Button>
              <Button onClick={() => handleRequest(requestPopup.id, 'rejected')} variant="outline" className="flex-1 h-14 rounded-2xl border-white/40 text-white font-black uppercase tracking-widest hover:bg-white/10">Reject</Button>
            </div>
            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white w-full animate-[progress_5s_linear_forwards]" />
            </div>
          </div>
        </div>
      )}

      {/* Header Info - Clean Version */}
      <header className="relative z-10 mt-32 px-6 flex justify-between items-center">
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl rounded-full p-2 pr-6 border border-white/10 shadow-xl">
          <div className="relative size-12 rounded-full overflow-hidden border-2 border-primary">
            <Image src={img} alt={username} fill className="object-cover" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-white font-black uppercase italic text-sm tracking-tight">@{username}</h3>
          </div>
        </div>
        
        {isHost && (
          <Button 
            variant="destructive" 
            onClick={endStream} 
            className="rounded-full px-6 h-10 font-black uppercase tracking-widest text-[10px] border-none italic shadow-lg"
          >
            End Signal
          </Button>
        )}
      </header>

      {/* Chat & Footer */}
      <div className="flex-1 z-10 flex flex-col justify-end px-6 pb-12 space-y-4">
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-3xl border border-white/5 max-h-[25vh] overflow-y-auto no-scrollbar">
          <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
            <span className="text-primary font-black">SYSTEM: </span>
            {isPrivate ? "Private Encryption Active. Secure Tunnel Established." : "Public Discovery Active. Network Visible Globally."}
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 flex bg-black/40 backdrop-blur-xl rounded-full px-6 py-3 border border-white/10 shadow-2xl">
            <Input 
              value={inputText} 
              onChange={e => setInputText(e.target.value)} 
              placeholder="Send heart signal..." 
              className="bg-transparent border-none text-white placeholder-white/30 font-bold text-xs focus-visible:ring-0" 
            />
            <button className="text-primary hover:scale-110 transition-transform"><Send className="size-5" /></button>
          </div>
          <Button className="size-14 rounded-full romantic-gradient shadow-2xl border-none hover:scale-105 transition-all">
            <Heart className="size-7 fill-white text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
}

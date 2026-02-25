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
import { doc, collection, addDoc, serverTimestamp, query, orderBy, limit, where, updateDoc, onSnapshot, setDoc } from "firebase/firestore";
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
  const [requestPopup, setRequestPopup] = useState<{ id: string, name: string } | null>(null);
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

  // REAL-TIME REQUEST POPUP LISTENER
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
        const requestTime = docData.timestamp?.toMillis() || Date.now();
        
        // Popup timing check: only show if request is fresh (last 15s)
        if (Date.now() - requestTime < 15000) {
          setRequestPopup({ id: docId, name: docData.userName || 'Anonymous' });
          const timer = setTimeout(() => setRequestPopup(null), 5000);
          return () => clearTimeout(timer);
        }
      }
    });

    return () => unsubscribe();
  }, [firestore, isHost, effectiveId]);

  // Minutes tracker
  useEffect(() => {
    if (!isHost) return;
    const interval = setInterval(() => {
      setStreamMinutes(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, [isHost]);

  // Camera permissions
  useEffect(() => {
    if (!isHost) return;
    const getCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setCameraStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err) { 
        console.error(err);
        toast({ variant: "destructive", title: "Camera Error", description: "Enable camera for streaming." });
      }
    };
    getCamera();
    return () => { cameraStream?.getTracks().forEach(t => t.stop()); };
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
      toast({ title: `MODE: ${nextMode.toUpperCase()}`, className: nextMode === 'private' ? "bg-red-600 text-white" : "bg-green-600 text-white" });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync failed" });
    } finally {
      setTimeout(() => setIsUpdating(false), 500);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'approved' | 'rejected') => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'streamRequests', requestId), { 
        status: action,
        updatedAt: serverTimestamp()
      });
      setRequestPopup(null);
      toast({ title: action === 'approved' ? "Call Accepted" : "Request Rejected" });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Action Failed' });
    }
  };

  const endStream = async () => {
    if (confirm("End broadcast?")) {
      if (isHost && hostRef) {
        await updateDoc(hostRef, { isLive: false, streamType: 'public' });
      }
      router.push('/host-p');
    }
  };

  if (isLoading && areServicesAvailable) {
    return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="size-12 animate-spin text-primary" /></div>;
  }

  const isPrivateMode = host?.streamType === 'private';
  const displayUsername = host?.username || 'Host';
  const displayImage = host?.previewImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${effectiveId}`;

  return (
    <div className="relative h-screen w-full flex flex-col overflow-hidden bg-black mx-auto max-w-lg border-x border-white/10">
      
      {/* BACKGROUND VIDEO/IMAGE */}
      <div className="absolute inset-0 z-0 bg-black">
        {isHost ? (
          <video ref={videoRef} autoPlay playsInline muted className={cn("w-full h-full object-cover scale-x-[-1] transition-all", (isPrivateMode || host?.manualBlur) && "blur-3xl opacity-60")} />
        ) : (
          <div className="relative w-full h-full">
            <Image src={displayImage} alt="Feed" fill className={cn("object-cover transition-all", isPrivateMode || host?.manualBlur ? "blur-3xl opacity-40" : "opacity-90")} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
      </div>

      {/* TOP CONTROLS (ONE-CLICK TOGGLE) */}
      <div className="absolute top-10 left-0 right-0 z-[60] flex justify-center px-6">
         <div className="flex gap-3 items-center">
            {isHost && (
              <>
                <Button 
                  onClick={toggleStreamMode}
                  disabled={isUpdating}
                  className={cn(
                    "h-12 px-8 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-none shadow-2xl transition-all",
                    isPrivateMode ? "bg-red-600 text-white" : "bg-green-500 text-white"
                  )}
                >
                  {isUpdating ? <Loader2 className="size-4 mr-2 animate-spin" /> : isPrivateMode ? <Lock className="size-4 mr-2" /> : <Zap className="size-4 mr-2" />}
                  {isPrivateMode ? "MODE: PRIVATE" : "MODE: PUBLIC"}
                </Button>
                
                {isPrivateMode && (
                  <Button 
                    onClick={async () => { if (hostRef) await updateDoc(hostRef, { manualBlur: !host?.manualBlur }); }}
                    size="icon"
                    className={cn("h-12 w-12 rounded-full border-none shadow-2xl", host?.manualBlur ? "bg-primary text-white" : "bg-white/10 text-white/60")}
                  >
                    {host?.manualBlur ? <ShieldOff className="size-5" /> : <ShieldCheck className="size-5" />}
                  </Button>
                )}
              </>
            )}
            {!isHost && (
              <Badge className="h-10 px-6 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest">
                <Eye className="size-3 mr-2 text-primary" /> {host?.viewers || 0} Viewers
              </Badge>
            )}
         </div>
      </div>

      {/* REVENUE BADGE (TOP RIGHT - NO FACE BLOCKING) */}
      {isHost && (
        <div className="absolute top-24 right-6 z-50">
          <LiveEarningTimer minutes={streamMinutes} />
        </div>
      )}

      {/* PRIVATE REQUEST POPUP (CENTERED - 5 SECOND DISMISS) */}
      {isHost && requestPopup && (
        <div className="absolute inset-0 flex items-center justify-center z-[100] px-6 pointer-events-none">
           <div className="romantic-gradient p-8 rounded-[3rem] shadow-[0_20px_60px_rgba(225,29,72,0.5)] flex flex-col items-center text-center space-y-6 border border-white/20 pointer-events-auto animate-in zoom-in duration-300">
              <div className="size-20 rounded-[2rem] bg-white/20 flex items-center justify-center"><UserPlus className="size-10 text-white" /></div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">Incoming Private Request</p>
                 <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">@{requestPopup.name} is waiting</h3>
              </div>
              <div className="flex gap-3 w-full">
                <Button onClick={() => handleRequestAction(requestPopup.id, 'approved')} className="flex-1 h-14 rounded-2xl bg-white text-primary font-black uppercase text-[10px] border-none shadow-xl"><Check className="size-4 mr-2" /> Accept</Button>
                <Button onClick={() => handleRequestAction(requestPopup.id, 'rejected')} variant="outline" className="flex-1 h-14 rounded-2xl border-white/20 bg-black/20 text-white font-black uppercase text-[10px]"><Ban className="size-4 mr-2" /> Reject</Button>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-white animate-[progress_5s_linear_forwards]" />
              </div>
           </div>
        </div>
      )}

      {/* CLEAN HEADER (NO EXTRA LABELS) */}
      <header className="relative z-10 flex items-center justify-between px-6 mt-32 mb-4">
        <div className="flex items-center gap-4 glass-effect rounded-full p-1.5 pr-6 bg-black/40 backdrop-blur-xl border border-white/10">
          <div className="relative size-12 rounded-full border-2 border-primary overflow-hidden">
            <Image src={displayImage} alt="Profile" fill className="object-cover" />
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-tighter italic">@{displayUsername}</h3>
        </div>
        
        <div className="flex gap-3">
          {isHost ? (
            <Button variant="destructive" size="sm" onClick={endStream} className="rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] h-12 px-6 border-none shadow-2xl">End Session</Button>
          ) : (
            <Button variant="secondary" size="icon" onClick={() => router.back()} className="glass-effect size-12 rounded-full text-white border-none bg-white/10"><X className="size-6" /></Button>
          )}
        </div>
      </header>

      {/* CHAT AREA */}
      <div className="flex-1 relative z-10 flex flex-col justify-end px-6 pb-12">
        <div className="w-full max-w-[85%] flex flex-col gap-3 overflow-y-auto max-h-[25vh] mb-8 no-scrollbar">
            <div className="px-5 py-3.5 rounded-[1.5rem] max-w-fit bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl">
              <p className="text-[11px] text-white font-medium leading-relaxed uppercase">
                <span className="font-black mr-2 text-primary">System:</span>
                <span className="opacity-80">
                  {isPrivateMode ? "Encryption Active. Signal is secure." : "Public Discovery Active. Visible to marketplace."}
                </span>
              </p>
            </div>
        </div>

        <footer className="flex items-center gap-4 w-full animate-in slide-in-from-bottom-6">
          <div className="flex-1 flex items-center glass-effect rounded-[2.5rem] px-8 h-16 bg-white/5 border-white/10">
            <Input value={inputText} onChange={(e) => setInputText(e.target.value)} className="bg-transparent border-none focus-visible:ring-0 text-white placeholder-white/20 font-black text-xs uppercase" placeholder="Secure message..." />
            <button onClick={() => setInputText("")} className="ml-3 text-primary hover:scale-125 transition-transform"><Send className="size-7" /></button>
          </div>
          <Button className="size-16 rounded-full romantic-gradient border-none shadow-2xl flex items-center justify-center active:scale-90 transition-all"><Heart className="size-8 text-white fill-current" /></Button>
        </footer>
      </div>
      
      <style jsx global>{` 
        @keyframes progress { from { width: 100%; } to { width: 0%; } } 
      `}</style>
    </div>
  );
}

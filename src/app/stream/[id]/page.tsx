"use client"

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { 
  X, Eye, Heart, Gift, MessageCircle, Share2, 
  Info, Star, Smile, Lock, Send, ShieldCheck, CameraOff,
  Globe, ShieldAlert, RefreshCw, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useFirebase, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp, query, orderBy, limit, setDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function StreamPage() {
  const { id } = useParams();
  const router = useRouter();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [inputText, setInputText] = useState("");
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [cameraMode, setCameraMode] = useState<"user" | "environment">("user");
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Camera for Host
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const isHost = user?.uid === id;

  const hostRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'hosts', id as string);
  }, [firestore, id]);

  const { data: host, isLoading } = useDoc(hostRef);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(
      collection(firestore, 'streams', id as string, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );
  }, [firestore, id]);

  const { data: messages } = useCollection(messagesQuery);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const getCameraPermission = async () => {
      if (!isHost) return;
      try {
        if (videoRef.current?.srcObject) {
          const prevStream = videoRef.current.srcObject as MediaStream;
          prevStream.getTracks().forEach(t => t.stop());
        }

        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: cameraMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }, 
          audio: true 
        });
        
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.warn("Autoplay blocked", playErr);
          }
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions to stream.',
        });
      }
    };

    if (isHost) {
      getCameraPermission();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isHost, cameraMode, toast]);

  const sendMessage = async () => {
    if (!inputText.trim() || !user || !firestore || !id) return;
    
    try {
      await addDoc(collection(firestore, 'streams', id as string, 'messages'), {
        text: inputText,
        senderId: user.uid,
        senderName: user.displayName || `Guest_${user.uid.slice(0, 4)}`,
        timestamp: serverTimestamp(),
      });
      setInputText("");
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not send message." });
    }
  };

  const togglePrivacy = async () => {
    if (!hostRef || !isHost) return;
    setIsUpdatingPrivacy(true);
    const newType = host?.streamType === 'private' ? 'public' : 'private';
    
    try {
      await setDoc(hostRef, { 
        streamType: newType,
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast({ 
        title: `Mode: ${newType.toUpperCase()}`, 
        description: newType === 'public' ? "Stream is now public." : "Stream is now private." 
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update stream mode." });
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const swapCamera = () => {
    setCameraMode(prev => prev === "user" ? "environment" : "user");
    toast({ title: "Camera Swapped" });
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!host) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center p-6 text-center space-y-4">
        <X className="size-16 text-slate-700" />
        <h2 className="text-xl font-bold uppercase tracking-widest text-white">Stream Not Found</h2>
        <Button onClick={() => router.push('/global')} className="bg-primary rounded-2xl h-14 px-8 font-black uppercase text-white">Return Home</Button>
      </div>
    );
  }

  const isPrivate = host.streamType === 'private' || host.streamType === 'invite-only';

  return (
    <div className="relative h-screen w-full flex flex-col overflow-hidden bg-black mx-auto max-w-lg border-x border-white/10">
      {/* Video / Image Background */}
      <div className="absolute inset-0 z-0 bg-black">
        {isHost ? (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={cn(
                "w-full h-full object-cover transition-all duration-700", 
                cameraMode === "user" && "scale-x-[-1]",
                // ONLY blur for viewers, not for the host themselves
                !isHost && isPrivate && "blur-3xl opacity-40"
              )} 
            />
            {hasCameraPermission === false && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <CameraOff className="size-16 text-destructive/50" />
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 rounded-3xl">
                  <AlertTitle className="font-black uppercase tracking-widest text-white">Camera Disabled</AlertTitle>
                  <AlertDescription className="text-xs text-white">
                    Please allow camera access in your browser settings to broadcast.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </>
        ) : (
          <Image 
            src={host.previewImageUrl || "https://picsum.photos/seed/stream/800/1200"} 
            alt="Stream" 
            fill 
            className={cn("object-cover transition-all duration-700", isPrivate ? "blur-3xl opacity-40" : "opacity-90")} 
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
      </div>

      {/* Stream Header */}
      <header className="relative z-10 flex items-center justify-between px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 glass-effect rounded-full p-1.5 pr-4 bg-black/30 backdrop-blur-md">
          <div className="relative size-10 rounded-full border-2 border-primary overflow-hidden">
            <Image 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${host.id}`} 
              alt="Host" 
              fill 
              className="object-cover" 
            />
          </div>
          <div>
            <h3 className="text-[11px] font-black leading-none text-white uppercase tracking-tighter">{host.username || 'Host'}</h3>
            <div className="flex items-center gap-1 mt-1">
              <Eye className="size-3 text-white/70" />
              <span className="text-[10px] font-black text-white/70">{host.viewers || 0}</span>
            </div>
          </div>
          <Button size="sm" className="ml-2 h-7 rounded-full bg-primary hover:bg-primary/90 text-[10px] font-black uppercase tracking-widest px-4 text-white">
            Follow
          </Button>
        </div>
        
        <div className="flex gap-2">
          {isHost && (
             <Button 
                onClick={swapCamera}
                variant="secondary" 
                size="icon" 
                className="glass-effect size-10 rounded-full text-white border-none bg-white/10 hover:bg-white/20"
              >
                <RefreshCw className="size-5" />
              </Button>
          )}
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={() => router.back()}
            className="glass-effect size-10 rounded-full text-white border-none bg-white/10 hover:bg-white/20"
          >
            <X className="size-5" />
          </Button>
        </div>
      </header>

      {/* Private Overlay for Viewers (Clearer UI) */}
      {isPrivate && !isHost && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 bg-black/60 backdrop-blur-md text-center space-y-6">
          <div className="size-24 rounded-[3rem] bg-primary/20 border border-primary/40 flex items-center justify-center shadow-[0_0_50px_rgba(137,90,246,0.3)] animate-pulse">
            <Lock className="size-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white">Private Room</h2>
            <p className="text-sm text-slate-300 font-bold uppercase tracking-widest max-w-[240px] mx-auto">This host is currently in a private session. Send a Zap to join.</p>
          </div>
          <Button className="h-16 w-full max-w-[280px] rounded-3xl bg-primary text-sm font-black uppercase tracking-widest gap-2 shadow-2xl shadow-primary/40 active:scale-95 transition-all text-white">
            <Zap className="size-5 fill-current" /> Send Zap to Unlock
          </Button>
        </div>
      )}

      {/* Main Interaction Overlay */}
      <div className="flex-1 relative z-10 flex flex-col justify-end px-4 pb-6">
        {/* Chat Area */}
        <div className="w-full max-w-[85%] flex flex-col gap-2 overflow-y-auto max-h-[35vh] mb-6 no-scrollbar">
          <div className="bg-primary/20 border-l-4 border-primary px-3 py-2 rounded-r-2xl backdrop-blur-md">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="size-3" /> System: Stream is active and secure.
            </p>
          </div>
          
          {messages?.map((m) => (
            <div key={m.id} className="px-3 py-2 rounded-2xl max-w-fit bg-black/40 backdrop-blur-md border border-white/5 animate-in slide-in-from-left-2">
              <p className="text-xs text-white">
                <span className="font-black mr-2 text-secondary text-[10px] uppercase tracking-tighter">
                  {m.senderName}:
                </span>
                <span className="opacity-90 font-medium tracking-tight">{m.text}</span>
              </p>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Floating Side Controls */}
        <div className="absolute right-4 bottom-24 flex flex-col gap-4">
          {isHost && (
            <button 
              onClick={togglePrivacy}
              disabled={isUpdatingPrivacy}
              className={cn(
                "size-14 rounded-full flex items-center justify-center text-white shadow-2xl active:scale-90 transition-all border-none",
                host.streamType === 'private' ? "bg-red-500 shadow-red-500/30" : "bg-green-500 shadow-green-500/30"
              )}
            >
              {host.streamType === 'private' ? <Lock className="size-7" /> : <Globe className="size-7" />}
            </button>
          )}
          <button className="size-14 glass-effect rounded-full flex items-center justify-center text-white shadow-xl active:scale-90 transition-all border-none bg-white/10">
            <Heart className="size-7 hover:fill-destructive transition-colors" />
          </button>
          <button className="size-14 bg-secondary/80 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-all">
            <Gift className="size-7" />
          </button>
        </div>

        {/* Message Input (only if public or is host) */}
        {(!isPrivate || isHost) && (
          <footer className="flex items-center gap-3 w-full">
            <div className="flex-1 flex items-center glass-effect rounded-[2rem] px-6 py-3 h-14 bg-white/10 border-white/10 backdrop-blur-md">
              <Input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="bg-transparent border-none focus-visible:ring-0 text-white placeholder-slate-400 h-full p-0 font-bold text-sm" 
                placeholder="Type a message..." 
              />
              <button onClick={sendMessage} className="ml-2 text-primary hover:text-white transition-colors">
                <Send className="size-5" />
              </button>
            </div>
            <button className="size-14 glass-effect rounded-full flex items-center justify-center text-white shadow-xl active:scale-95 transition-all border-none bg-white/10">
              <Share2 className="size-5" />
            </button>
          </footer>
        )}
      </div>

      {/* Tip Menu (Viewers only) */}
      {!isHost && (
        <div className="absolute top-28 right-4 z-10 w-44">
          <div className="glass-effect rounded-[2rem] p-5 flex flex-col gap-3 shadow-2xl border-white/10 bg-black/40 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tip Hub</span>
              <Zap className="size-3 text-amber-400 fill-current" />
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Direct Message", cost: "50" },
                { label: "Bite Lips", cost: "100" },
                { label: "Strip Show", cost: "1000" }
              ].map((tip) => (
                <div key={tip.label} className="flex items-center justify-between text-[10px] hover:bg-white/5 p-2 rounded-xl transition-all cursor-pointer group">
                  <span className="text-slate-100 font-bold uppercase tracking-tighter">{tip.label}</span>
                  <span className="bg-primary/20 text-primary font-black px-2 py-0.5 rounded-lg text-[9px]">
                    {tip.cost}
                  </span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full h-8 rounded-xl text-[8px] font-black uppercase border-primary/30 text-primary hover:bg-primary hover:text-white transition-all">
              See All Tips
            </Button>
          </div>
        </div>
      )}

      {/* Host Status Badge */}
      {isHost && (
        <div className="absolute top-28 left-4 z-10 flex flex-col gap-2">
          <Badge className="bg-red-600 border-none text-[10px] font-black uppercase tracking-widest px-4 py-1.5 shadow-xl text-white">
             Broadcasting Live
          </Badge>
          <Badge className={cn(
            "border-none text-[8px] font-black uppercase tracking-widest px-3 py-1 shadow-lg",
            host.streamType === 'private' ? "bg-amber-500 text-black" : "bg-cyan-500 text-white"
          )}>
            {host.streamType === 'private' ? "PRIVATE" : "PUBLIC"}
          </Badge>
        </div>
      )}
    </div>
  );
}
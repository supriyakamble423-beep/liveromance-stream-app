"use client"

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { 
  X, Eye, Heart, Gift, MessageCircle, Share2, 
  Info, Star, Smile, Lock, Send, ShieldCheck, CameraOff,
  Globe, ShieldAlert, RefreshCw, Zap, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useFirebase, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp, query, orderBy, limit, setDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { nsfwModeration } from "@/ai/flows/nsfw-moderation-flow";

export default function StreamPage() {
  const { id } = useParams();
  const router = useRouter();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [inputText, setInputText] = useState("");
  const [cameraMode, setCameraMode] = useState<"user" | "environment">("user");
  const [isModerating, setIsModerating] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
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
          video: { facingMode: cameraMode }, 
          audio: true 
        });
        
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };

    if (isHost) getCameraPermission();

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [isHost, cameraMode]);

  // NSFW AI MODERATION ENGINE (AUTO-CUT)
  useEffect(() => {
    if (!isHost || host?.streamType !== 'public' || !host?.isLive) return;

    const moderationInterval = setInterval(async () => {
      if (!videoRef.current || isModerating) return;

      setIsModerating(true);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 400; // Low res for speed
        canvas.height = 300;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const photoData = canvas.toDataURL("image/jpeg", 0.6);
          
          const result = await nsfwModeration({ 
            photoDataUri: photoData, 
            streamType: 'public' 
          });

          if (!result.isSafe) {
            console.warn("AI AUTO-CUT: NSFW Content Detected!");
            toast({ 
              variant: "destructive", 
              title: "AI AUTO-CUT", 
              description: "Public stream terminated due to nudity violation." 
            });
            
            if (hostRef) {
              await setDoc(hostRef, { 
                isLive: false, 
                nsfwReason: result.reason,
                updatedAt: serverTimestamp() 
              }, { merge: true });
              router.push('/host-p');
            }
          }
        }
      } catch (e) {
        console.error("Moderation error:", e);
      } finally {
        setIsModerating(false);
      }
    }, 10000); // Check every 10 seconds for prototype

    return () => clearInterval(moderationInterval);
  }, [isHost, host?.streamType, host?.isLive, hostRef, isModerating]);

  const sendMessage = () => {
    if (!inputText.trim() || !user || !firestore || !id) return;
    
    const msgData = {
      text: inputText,
      senderId: user.uid,
      senderName: user.displayName || `Guest_${user.uid.slice(0, 4)}`,
      timestamp: serverTimestamp(),
    };

    addDoc(collection(firestore, 'streams', id as string, 'messages'), msgData)
      .catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `streams/${id}/messages`,
          operation: 'create',
          requestResourceData: msgData
        }));
      });
    setInputText("");
  };

  const sendTip = (label: string, cost: number) => {
    if (!user || !firestore || !id) {
      toast({ variant: "destructive", title: "Error", description: "Sign in to send tips." });
      return;
    }

    const tipData = {
      text: `🎁 Tipped ${cost} Coins for [${label}]`,
      senderId: user.uid,
      senderName: user.displayName || `Guest_${user.uid.slice(0, 4)}`,
      timestamp: serverTimestamp(),
      type: 'tip',
      amount: cost
    };

    addDoc(collection(firestore, 'streams', id as string, 'messages'), tipData)
      .then(() => {
        toast({ title: "Tip Sent!", description: `${cost} Coins sent to host.` });
      })
      .catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `streams/${id}/messages`,
          operation: 'create',
          requestResourceData: tipData
        }));
      });
  };

  if (isLoading) return <div className="h-screen bg-black flex items-center justify-center"><RefreshCw className="animate-spin text-primary" /></div>;

  const isPrivate = host?.streamType === 'private' || host?.streamType === 'invite-only';

  return (
    <div className="relative h-screen w-full flex flex-col overflow-hidden bg-black mx-auto max-w-lg border-x border-white/10">
      <div className="absolute inset-0 z-0 bg-black">
        {isHost ? (
          <video ref={videoRef} autoPlay playsInline muted className={cn("w-full h-full object-cover scale-x-[-1]")} />
        ) : (
          <Image src={host?.previewImageUrl || "https://picsum.photos/seed/stream/800/1200"} alt="Stream" fill className={cn("object-cover", isPrivate ? "blur-3xl opacity-40" : "opacity-90")} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
      </div>

      {/* AI Moderation Status Indicator */}
      {isHost && host?.streamType === 'public' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
          <Badge className="bg-green-500/80 backdrop-blur-md text-[8px] font-black tracking-widest uppercase gap-2">
            {isModerating ? <Loader2 className="size-2 animate-spin" /> : <ShieldCheck className="size-2" />}
            AI Safety Guard Active
          </Badge>
        </div>
      )}

      <header className="relative z-10 flex items-center justify-between px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 glass-effect rounded-full p-1.5 pr-4 bg-black/30 backdrop-blur-md">
          <div className="relative size-10 rounded-full border-2 border-primary overflow-hidden">
            <Image src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`} alt="Host" fill className="object-cover" />
          </div>
          <div>
            <h3 className="text-[11px] font-black leading-none text-white uppercase tracking-tighter">{host?.username || 'Host'}</h3>
            <div className="flex items-center gap-1 mt-1">
              <Eye className="size-3 text-white/70" />
              <span className="text-[10px] font-black text-white/70">{host?.viewers || 0}</span>
            </div>
          </div>
        </div>
        <Button variant="secondary" size="icon" onClick={() => router.back()} className="glass-effect size-10 rounded-full text-white border-none bg-white/10">
          <X className="size-5" />
        </Button>
      </header>

      {isPrivate && !isHost && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 bg-black/60 backdrop-blur-md text-center space-y-6">
          <Lock className="size-16 text-primary animate-pulse" />
          <div className="space-y-2">
            <h2 className="text-4xl font-black uppercase italic text-white">Private Room</h2>
            <p className="text-sm text-slate-300 font-bold uppercase tracking-widest">Zap to unlock this session.</p>
          </div>
          <Button className="h-16 w-full max-w-[280px] rounded-3xl bg-primary text-sm font-black uppercase tracking-widest gap-2 text-white">
            <Zap className="size-5 fill-current" /> Send 50 Coins Zap
          </Button>
        </div>
      )}

      <div className="flex-1 relative z-10 flex flex-col justify-end px-4 pb-6">
        <div className="w-full max-w-[85%] flex flex-col gap-2 overflow-y-auto max-h-[35vh] mb-6 no-scrollbar">
          {messages?.map((m) => (
            <div key={m.id} className={cn("px-3 py-2 rounded-2xl max-w-fit bg-black/40 backdrop-blur-md border border-white/5", m.type === 'tip' && "border-amber-500/50 bg-amber-500/10")}>
              <p className="text-xs text-white">
                <span className="font-black mr-2 text-secondary text-[10px] uppercase">{m.senderName}:</span>
                <span className="opacity-90 font-medium">{m.text}</span>
              </p>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="absolute right-4 bottom-24 flex flex-col gap-4">
          <button className="size-14 glass-effect rounded-full flex items-center justify-center text-white bg-white/10"><Heart className="size-7" /></button>
          <button className="size-14 bg-secondary/80 rounded-full flex items-center justify-center text-white"><Gift className="size-7" /></button>
        </div>

        {(!isPrivate || isHost) && (
          <footer className="flex items-center gap-3 w-full">
            <div className="flex-1 flex items-center glass-effect rounded-[2rem] px-6 py-3 h-14 bg-white/10 border-white/10 backdrop-blur-md">
              <Input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="bg-transparent border-none focus-visible:ring-0 text-white placeholder-slate-400 font-bold text-sm" 
                placeholder="Type a message..." 
              />
              <button onClick={sendMessage} className="ml-2 text-primary"><Send className="size-5" /></button>
            </div>
          </footer>
        )}
      </div>

      {!isHost && (
        <div className="absolute top-28 right-4 z-10 w-44">
          <div className="glass-effect rounded-[2rem] p-5 flex flex-col gap-3 shadow-2xl border-white/10 bg-black/40 backdrop-blur-xl">
            <span className="text-[9px] font-black text-slate-400 uppercase">Tip Menu</span>
            {[
              { label: "DM Host", cost: 50 },
              { label: "Bite Lips", cost: 100 },
              { label: "Show More", cost: 500 }
            ].map((tip) => (
              <div 
                key={tip.label} 
                onClick={() => sendTip(tip.label, tip.cost)}
                className="flex items-center justify-between text-[10px] hover:bg-white/5 p-2 rounded-xl transition-all cursor-pointer"
              >
                <span className="text-slate-100 font-bold uppercase">{tip.label}</span>
                <span className="bg-primary/20 text-primary font-black px-2 py-0.5 rounded-lg">{tip.cost}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

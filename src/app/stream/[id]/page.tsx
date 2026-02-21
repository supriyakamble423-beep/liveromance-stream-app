
"use client"

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { 
  X, Eye, Heart, Gift, MessageCircle, Share2, 
  Info, Star, Smile, Lock, Send, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useFirebase, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp, query, orderBy, limit } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function StreamPage() {
  const { id } = useParams();
  const router = useRouter();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

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
        <h2 className="text-xl font-bold">Stream Not Found</h2>
        <Button onClick={() => router.push('/global')}>Return to Market</Button>
      </div>
    );
  }

  const isPrivate = host.streamType === 'private' || host.streamType === 'invite-only';

  return (
    <div className="relative h-screen w-full flex flex-col overflow-hidden bg-black mx-auto max-w-lg border-x border-white/10">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <Image 
          src={host.previewImageUrl || "https://picsum.photos/seed/stream/800/1200"} 
          alt="Stream" 
          fill 
          className={cn("object-cover opacity-90", isPrivate && "blur-xl")} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
      </div>

      {/* Stream Header */}
      <header className="relative z-10 flex items-center justify-between px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 glass-effect rounded-full p-1.5 pr-4">
          <div className="relative size-10 rounded-full border-2 border-primary overflow-hidden">
            <Image 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${host.id}`} 
              alt="Host" 
              fill 
              className="object-cover" 
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full" />
          </div>
          <div>
            <h3 className="text-xs font-bold leading-none text-white uppercase tracking-tight">Host_{host.id.slice(0, 4)}</h3>
            <div className="flex items-center gap-1 mt-1 opacity-70">
              <Eye className="size-3 text-white" />
              <span className="text-[10px] font-black text-white">{host.viewers || 0}</span>
            </div>
          </div>
          <Button size="sm" className="ml-2 h-7 rounded-full bg-primary hover:bg-primary/90 text-[10px] font-black uppercase tracking-widest">
            Follow
          </Button>
        </div>
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={() => router.back()}
          className="glass-effect size-10 rounded-full text-white border-none bg-white/10 hover:bg-white/20"
        >
          <X className="size-5" />
        </Button>
      </header>

      {/* Private Overlay */}
      {isPrivate && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 bg-black/60 backdrop-blur-md text-center space-y-6">
          <div className="size-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Lock className="size-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black uppercase tracking-tighter italic">Private Room</h2>
            <p className="text-sm text-slate-400 font-medium">This host is currently in a private session. Send a Zap to request access.</p>
          </div>
          <Button className="h-16 w-full rounded-2xl bg-primary text-lg font-black uppercase tracking-widest gap-2 shadow-2xl shadow-primary/20">
            Request Zap Access
          </Button>
        </div>
      )}

      {/* Main UI Overlay */}
      <div className="flex-1 relative z-10 flex flex-col justify-end px-4 pb-4">
        {/* Chat Messages */}
        <div className="w-full max-w-[85%] flex flex-col gap-2 overflow-y-auto max-h-[40vh] mb-4 no-scrollbar">
          <div className="bg-primary/20 border-l-4 border-primary px-3 py-2 rounded-r-2xl backdrop-blur-md">
            <p className="text-[11px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="size-3" /> System: Welcome to the live feed!
            </p>
          </div>
          
          {messages?.map((m) => (
            <div key={m.id} className="px-3 py-2 rounded-2xl max-w-fit bg-black/40 backdrop-blur-md border border-white/5 transition-all animate-in slide-in-from-left-2">
              <p className="text-sm text-white">
                <span className="font-black mr-1.5 text-secondary text-[10px] uppercase tracking-tighter">
                  {m.senderName}:
                </span>
                <span className="opacity-90 font-medium">{m.text}</span>
              </p>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Right Floating Actions */}
        <div className="absolute right-4 bottom-28 flex flex-col gap-4">
          <button className="size-12 glass-effect rounded-full flex items-center justify-center text-white shadow-2xl active:scale-90 transition-all border-none bg-white/10">
            <Heart className="size-6 hover:fill-destructive transition-colors" />
          </button>
          <button className="size-12 bg-secondary/80 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-all">
            <Gift className="size-6" />
          </button>
          <button className="flex items-center gap-2 bg-primary px-5 py-3 rounded-full text-white shadow-2xl active:scale-95 transition-all">
            <MessageCircle className="size-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Private Chat</span>
          </button>
        </div>

        {/* Interaction Footer */}
        {!isPrivate && (
          <footer className="flex items-center gap-3 w-full">
            <div className="flex-1 flex items-center glass-effect rounded-full px-5 py-3 h-14 bg-white/10 border-white/10">
              <Input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="bg-transparent border-none focus-visible:ring-0 text-white placeholder-slate-400 h-full p-0 font-bold" 
                placeholder="Say something..." 
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

      {/* Tip Menu Overlay */}
      {!isPrivate && (
        <div className="absolute top-28 right-4 z-10 w-44 animate-in slide-in-from-right-4">
          <div className="glass-effect rounded-3xl p-4 flex flex-col gap-3 shadow-2xl border-white/10 bg-black/60">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tip Menu</span>
              <Info className="size-3 text-slate-500" />
            </div>
            <div className="space-y-2">
              {[
                { label: "DM / PM", cost: "50" },
                { label: "Bite Lips", cost: "100" },
                { label: "Strip Show", cost: "1000" }
              ].map((tip) => (
                <div key={tip.label} className="flex items-center justify-between text-[10px] hover:bg-white/5 p-2 rounded-xl transition-all cursor-pointer group">
                  <span className="text-slate-100 font-bold">{tip.label}</span>
                  <span className="bg-primary/20 text-primary font-black px-2 py-0.5 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                    {tip.cost}
                  </span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full h-8 rounded-xl text-[8px] font-black uppercase border-secondary text-secondary hover:bg-secondary hover:text-white transition-all">
              View More
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

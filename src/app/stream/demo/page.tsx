'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  X, Eye, Heart, Gift, MessageCircle, Share2, 
  Info, Star, Smile, Lock, Send, ShieldCheck, 
  Globe, Sparkles, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MOCK_MESSAGES = [
  { id: 1, sender: "CyberGamer", text: "This setup looks insane! 🔥", color: "text-secondary" },
  { id: 2, sender: "StarGirl", text: "Sending love from Tokyo! 🇯🇵", color: "text-pink-400" },
  { id: 3, sender: "Admin_System", text: "Welcome to the premium demo feed.", color: "text-primary", isSystem: true },
  { id: 4, sender: "BigSpender", text: "Tipped 500 Diamonds! 💎", color: "text-amber-400" },
];

export default function DemoStreamPage() {
  const router = useRouter();
  const [inputText, setInputText] = useState("");
  const [hearts, setHearts] = useState<number[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const spawnHeart = () => {
    setHearts(prev => [...prev, Date.now()]);
    setTimeout(() => {
      setHearts(prev => prev.slice(1));
    }, 2000);
  };

  return (
    <div className="relative h-screen w-full flex flex-col overflow-hidden bg-black mx-auto max-w-lg border-x border-white/10">
      {/* Visual Background */}
      <div className="absolute inset-0 z-0 bg-black">
        <Image 
          src="https://picsum.photos/seed/demo-stream/800/1200" 
          alt="Demo Stream" 
          fill 
          className="object-cover opacity-80" 
          data-ai-hint="streaming girl"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 glass-effect rounded-full p-1.5 pr-4">
          <div className="relative size-10 rounded-full border-2 border-primary overflow-hidden">
            <Image 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=DemoHost" 
              alt="Demo Host" 
              fill 
              className="object-cover" 
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full" />
          </div>
          <div>
            <h3 className="text-[11px] font-black leading-none text-white uppercase tracking-tighter">DEMO_HOST</h3>
            <div className="flex items-center gap-1 mt-1 opacity-70">
              <Eye className="size-3 text-white" />
              <span className="text-[10px] font-black text-white">12.4k</span>
            </div>
          </div>
          <Badge className="ml-2 bg-primary text-[8px] font-black h-5">FEATURED</Badge>
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

      {/* Main UI Overlay */}
      <div className="flex-1 relative z-10 flex flex-col justify-end px-4 pb-4">
        {/* Animated Hearts Area */}
        <div className="absolute right-4 bottom-40 w-20 h-64 pointer-events-none">
          {hearts.map(id => (
            <div key={id} className="absolute bottom-0 left-1/2 animate-float-up opacity-0">
              <Heart className="size-6 text-red-500 fill-current" />
            </div>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="w-full max-w-[85%] flex flex-col gap-2 overflow-y-auto max-h-[35vh] mb-4 no-scrollbar">
          {MOCK_MESSAGES.map((m) => (
            <div key={m.id} className={cn(
              "px-3 py-2 rounded-2xl max-w-fit bg-black/40 backdrop-blur-md border border-white/5",
              m.isSystem && "bg-primary/20 border-primary/20"
            )}>
              <p className="text-xs text-white">
                <span className={cn("font-black mr-2 text-[10px] uppercase tracking-tighter", m.color)}>
                  {m.sender}:
                </span>
                <span className="opacity-90 font-medium tracking-tight">{m.text}</span>
              </p>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Right Floating Actions */}
        <div className="absolute right-4 bottom-24 flex flex-col gap-4">
          <button onClick={spawnHeart} className="size-12 glass-effect rounded-full flex items-center justify-center text-white shadow-2xl active:scale-90 transition-all border-none bg-white/10">
            <Heart className="size-6 hover:fill-red-500 transition-colors" />
          </button>
          <button className="size-12 bg-secondary/80 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-all">
            <Gift className="size-6" />
          </button>
          <button className="flex items-center gap-2 bg-primary px-5 py-3 rounded-full text-white shadow-2xl active:scale-95 transition-all">
            <Sparkles className="size-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Unlock Private</span>
          </button>
        </div>

        {/* Interaction Footer */}
        <footer className="flex items-center gap-3 w-full">
          <div className="flex-1 flex items-center glass-effect rounded-full px-5 py-3 h-14 bg-white/10 border-white/10">
            <Input 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="bg-transparent border-none focus-visible:ring-0 text-white placeholder-slate-400 h-full p-0 font-bold text-sm" 
              placeholder="Say something nice..." 
            />
            <button className="ml-2 text-primary">
              <Send className="size-5" />
            </button>
          </div>
          <button className="size-14 glass-effect rounded-full flex items-center justify-center text-white shadow-xl active:scale-95 transition-all border-none bg-white/10">
            <Share2 className="size-5" />
          </button>
        </footer>
      </div>

      {/* Tip Menu Overlay */}
      <div className="absolute top-28 right-4 z-10 w-40">
        <div className="glass-effect rounded-3xl p-4 flex flex-col gap-3 shadow-2xl border-white/10 bg-black/60 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tip Demo</span>
            <Info className="size-3 text-slate-500" />
          </div>
          <div className="space-y-2">
            {[
              { label: "High Five", cost: "10" },
              { label: "Dance", cost: "50" },
              { label: "Private Show", cost: "500" }
            ].map((tip) => (
              <div key={tip.label} className="flex items-center justify-between text-[10px] p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                <span className="text-slate-100 font-bold uppercase">{tip.label}</span>
                <span className="text-primary font-black">
                  {tip.cost}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float-up {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-150px) scale(1.5); opacity: 0; }
        }
        .animate-float-up {
          animation: float-up 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
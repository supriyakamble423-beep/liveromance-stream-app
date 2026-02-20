
"use client"

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { 
  X, Eye, Heart, Gift, MessageCircle, Share2, 
  Info, Star, Smile, ArrowUpRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MOCK_HOSTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function StreamPage() {
  const { id } = useParams();
  const router = useRouter();
  const host = MOCK_HOSTS.find(h => h.id === id) || MOCK_HOSTS[0];
  const [messages, setMessages] = useState([
    { user: "System", text: "Welcome to Global Live! Be polite.", isSystem: true },
    { user: "Guest442", text: "Hey! Love the stream today 🔥" },
    { user: "Alex_99", text: "Can you show the new setup?" },
  ]);
  const [inputText, setInputText] = useState("");

  const sendMessage = () => {
    if (!inputText.trim()) return;
    setMessages([...messages, { user: "You", text: inputText }]);
    setInputText("");
  };

  return (
    <div className="relative h-screen w-full flex flex-col overflow-hidden bg-black mx-auto max-w-lg border-x border-border">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <Image 
          src={host.imageUrl} 
          alt="Stream" 
          fill 
          className="object-cover opacity-90" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
      </div>

      {/* Stream Header */}
      <header className="relative z-10 flex items-center justify-between px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 glass-effect rounded-full p-1.5 pr-4">
          <div className="relative size-10 rounded-full border-2 border-primary overflow-hidden">
            <Image src={host.imageUrl} alt={host.name} fill className="object-cover" />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full" />
          </div>
          <div>
            <h3 className="text-sm font-bold leading-none text-white">{host.name}</h3>
            <div className="flex items-center gap-1 mt-1 opacity-70">
              <Eye className="size-3 text-white" />
              <span className="text-[10px] font-bold text-white">{host.viewers || "1.5k"}</span>
            </div>
          </div>
          <Button size="sm" className="ml-2 h-7 rounded-full bg-primary hover:bg-primary/90 text-[10px] font-bold">
            Follow
          </Button>
        </div>
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={() => router.back()}
          className="glass-effect size-10 rounded-full text-white border-none"
        >
          <X className="size-5" />
        </Button>
      </header>

      {/* Main UI Overlay */}
      <div className="flex-1 relative z-10 flex flex-col justify-end px-4 pb-4">
        {/* Chat Messages */}
        <div className="w-full max-w-[85%] flex flex-col gap-2 overflow-y-auto max-h-[40vh] mb-4 no-scrollbar">
          <div className="bg-gradient-to-r from-amber-500/20 to-transparent border-l-4 border-amber-500 px-3 py-2 rounded-r-lg">
            <p className="text-[11px] font-bold text-amber-200 flex items-center gap-1">
              <Star className="size-3 fill-amber-500" /> JbxZ35S tipped 250 Coins
            </p>
          </div>
          {messages.map((m, i) => (
            <div key={i} className={cn(
              "px-3 py-1.5 rounded-xl max-w-fit",
              m.isSystem ? "bg-primary/20 border-l-2 border-primary" : "bg-black/40 backdrop-blur-md"
            )}>
              <p className="text-sm text-white">
                <span className={cn("font-bold mr-1", m.isSystem ? "text-primary" : "text-secondary")}>
                  {m.user}:
                </span>
                <span className="opacity-90">{m.text}</span>
              </p>
            </div>
          ))}
        </div>

        {/* Right Floating Actions */}
        <div className="absolute right-4 bottom-28 flex flex-col gap-4">
          <Button variant="secondary" size="icon" className="size-12 glass-effect rounded-full shadow-2xl">
            <Heart className="size-6 text-white hover:fill-destructive transition-colors" />
          </Button>
          <Button variant="secondary" size="icon" className="size-12 bg-secondary/80 rounded-full shadow-2xl border-none">
            <Gift className="size-6 text-white" />
          </Button>
          <Button className="rounded-full bg-primary shadow-2xl h-11 px-6 font-bold gap-2">
            <MessageCircle className="size-4" /> Private Chat
          </Button>
        </div>

        {/* Interaction Footer */}
        <footer className="flex items-center gap-3 w-full">
          <div className="flex-1 flex items-center glass-effect rounded-full px-4 py-3 h-12">
            <Input 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              className="bg-transparent border-none focus-visible:ring-0 text-white placeholder-slate-400 h-full p-0" 
              placeholder="Say something..." 
            />
            <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white">
              <Smile className="size-5" />
            </Button>
          </div>
          <Button variant="secondary" size="icon" className="size-12 glass-effect rounded-full shadow-xl">
            <Share2 className="size-5 text-white" />
          </Button>
        </footer>
      </div>

      {/* Tip Menu Overlay */}
      <div className="absolute top-28 right-4 z-10 w-44">
        <div className="glass-effect rounded-2xl p-4 flex flex-col gap-3 shadow-2xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Tip Menu</span>
            <Info className="size-3 text-slate-400" />
          </div>
          <div className="space-y-2.5">
            {[
              { label: "DM / PM", cost: "1 tk" },
              { label: "Bite Lips", cost: "1 tk" },
              { label: "Strip Show", cost: "10 tk" }
            ].map((tip) => (
              <div key={tip.label} className="flex items-center justify-between text-[11px] hover:bg-white/5 p-1 rounded transition-colors cursor-pointer group">
                <span className="text-slate-100">{tip.label}</span>
                <span className="bg-primary/20 text-primary font-bold px-1.5 rounded group-hover:bg-primary transition-colors group-hover:text-white">
                  {tip.cost}
                </span>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full h-7 rounded-lg text-[9px] font-bold uppercase border-secondary text-secondary hover:bg-secondary hover:text-white">
            View More
          </Button>
        </div>
      </div>
    </div>
  );
}

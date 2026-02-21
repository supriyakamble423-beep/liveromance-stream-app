
'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Button } from "@/components/ui/button";
import { Share2, Copy, Send, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ShareKit({ hostId, username }: { hostId: string; username?: string }) {
  const { toast } = useToast();
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/join?ref=${hostId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Signal Copied!", description: "Link added to your clipboard." });
  };

  const shareWhatsApp = () => {
    const text = `Join my private session on Global Live! 🚀\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="bg-gradient-to-br from-[#0a0a0a] to-[#121212] p-8 rounded-[3rem] border border-white/10 shadow-2xl space-y-8">
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_0_50px_rgba(137,92,246,0.4)]">
          <QRCodeSVG value={shareUrl} size={180} level="H" includeMargin={true} />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
            {username ? `@${username}'s` : "My"} Invite Hub
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] px-4 leading-relaxed">
            Scan to bypass the waitlist & unlock private sessions
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          <Button 
            onClick={shareWhatsApp}
            className="bg-[#25D366] hover:bg-[#25D366]/90 rounded-2xl h-14 font-black uppercase text-[10px] gap-2 text-white border-none"
          >
            <Send className="size-4" /> WhatsApp
          </Button>
          <Button 
            onClick={copyLink}
            className="bg-white text-black hover:bg-slate-200 rounded-2xl h-14 font-black uppercase text-[10px] gap-2 border-none"
          >
            <Copy className="size-4" /> Copy Link
          </Button>
        </div>

        <div className="pt-2">
          <Button 
            variant="ghost" 
            className="text-[9px] font-black uppercase tracking-widest text-slate-500 gap-2 hover:bg-white/5"
            onClick={() => window.open('https://pwabuilder.com', '_blank')}
          >
            <Smartphone className="size-3" /> Get Android APK
          </Button>
        </div>
      </div>
    </div>
  );
}

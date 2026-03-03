
'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Button } from "@/components/ui/button";
import { Share2, Copy, Send, Smartphone, Download, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ShareKit({ hostId, username }: { hostId: string; username?: string }) {
  const { toast } = useToast();
  // Using relative path for robustness, production will use the actual domain
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${hostId}`;
  const apkUrl = "https://liveromance-stream-app.vercel.app/app-release.apk"; 

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Signal Copied!", description: "Referral link added to your clipboard." });
  };

  const shareWhatsApp = () => {
    const text = `Join my private room on Global Love! 🚀\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const downloadAPK = () => {
    window.open(apkUrl, '_blank');
    toast({ title: "Downloading APK", description: "Stream-X v1.0 is starting..." });
  };

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] p-8 rounded-[3rem] border border-white/10 shadow-2xl space-y-8 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -top-20 -right-20 size-40 bg-primary/20 rounded-full blur-[60px]" />
      
      <div className="flex flex-col items-center text-center space-y-6 relative z-10">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_0_50px_rgba(225,29,72,0.3)] group hover:scale-105 transition-transform duration-500">
          <QRCodeSVG 
            value={shareUrl} 
            size={180} 
            level="H" 
            includeMargin={true} 
            fgColor="#E11D48"
          />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
            Invite Hub <span className="text-primary">@ {username || "NODE"}</span>
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] px-4 leading-relaxed">
            Scan to bypass the grid & unlock 1% lifetime revenue
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          <Button 
            onClick={shareWhatsApp}
            className="bg-[#25D366] hover:bg-[#25D366]/90 rounded-2xl h-14 font-black uppercase text-[10px] gap-2 text-white border-none shadow-lg"
          >
            <Send className="size-4" /> WhatsApp
          </Button>
          <Button 
            onClick={copyLink}
            className="bg-white text-black hover:bg-slate-200 rounded-2xl h-14 font-black uppercase text-[10px] gap-2 border-none shadow-lg"
          >
            <Copy className="size-4" /> Copy Link
          </Button>
        </div>

        <div className="w-full pt-4 space-y-4">
          <Button 
            onClick={downloadAPK}
            className="w-full h-16 romantic-gradient rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] gap-3 shadow-[0_10px_30px_rgba(225,29,72,0.4)] border-none hover:scale-[1.02] transition-transform"
          >
            <Download className="size-5" /> Download App (v1.0)
          </Button>
          
          <div className="flex items-center justify-center gap-4 opacity-40">
            <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest">
              <Smartphone className="size-3" /> Android 10+
            </div>
            <div className="size-1 bg-white/20 rounded-full" />
            <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest">
              <Zap className="size-3 fill-current" /> Fast Sync
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

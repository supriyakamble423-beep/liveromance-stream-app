'use client';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { useFirebase } from '@/firebase';
import { Share2, Facebook, Instagram, MessageCircle, Link2, Download, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ShareKit({ hostId, username }: { hostId: string, username: string }) {
  const { user } = useFirebase();
  const { toast } = useToast();
  
  const referralLink = `https://liveromance.vercel.app/join?ref=${hostId}`;
  const appLink = `https://liveromance.vercel.app/stream/${hostId}`;
  const apkUrl = "https://liveromance-stream-app.vercel.app/app-release.apk";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Link Copied!", description: "Share anywhere to earn 1% lifetime!" });
  };

  const shareWhatsApp = () => {
    const text = `🌹 Join my Live Romance Stream!\n\nWatch me live: ${appLink}\n\nUse my code: ${hostId}\n\n💎 Get 50 Welcome Diamonds!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="bg-gradient-to-br from-[#3D263D] to-[#2D1B2D] p-8 rounded-[3rem] border border-pink-500/20 shadow-2xl">
      <div className="text-center mb-8">
        <h3 className="text-primary text-xs font-black uppercase tracking-[0.3em] mb-2 italic">Viral Network Hub</h3>
        <p className="text-slate-400 text-[9px] font-bold uppercase">Earn 1% lifetime from every node you onboard</p>
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="bg-white p-5 rounded-[2.5rem] shadow-2xl mb-4 romantic-glow">
          <QRCodeSVG
            value={referralLink}
            size={180}
            level="H"
            includeMargin={true}
            fgColor="#E11D48"
            bgColor="transparent"
          />
        </div>
        <p className="text-[10px] text-white/60 font-black uppercase tracking-widest italic">@{username}'s Node Signature</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button
          onClick={shareWhatsApp}
          className="bg-[#25D366] hover:bg-[#25D366]/90 rounded-2xl h-14 font-black uppercase text-[10px] gap-2"
        >
          <MessageCircle size={18} /> WhatsApp
        </Button>
        <Button
          onClick={copyLink}
          className="bg-white text-black hover:bg-slate-100 rounded-2xl h-14 font-black uppercase text-[10px] gap-2"
        >
          <Link2 size={18} /> Copy Link
        </Button>
      </div>

      <div className="space-y-4">
        <Button
          className="w-full h-16 bg-gradient-to-r from-red-600 to-pink-500 rounded-3xl font-black uppercase text-xs shadow-[0_0_30px_rgba(225,29,72,0.4)] hover:scale-[1.02] transition-transform gap-3"
          onClick={() => window.open(apkUrl, '_blank')}
        >
          <Download size={20} /> 📱 Download App (v1.0)
        </Button>
        
        <div className="flex items-center justify-center gap-2 py-2 opacity-40">
          <Zap className="size-3 text-amber-400 fill-current" />
          <span className="text-[8px] font-black uppercase tracking-[0.3em]">Encrypted Peer-to-Peer Tunnel</span>
        </div>
      </div>
    </div>
  );
}

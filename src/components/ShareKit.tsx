'use client';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { useFirebase } from '@/firebase';
import { Share2, Facebook, Instagram, MessageCircle, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ShareKit({ hostId }: { hostId: string }) {
  const { user } = useFirebase();
  const { toast } = useToast();
  
  // 🔗 Unique referral link
  const referralLink = `https://liveromance.vercel.app/join?ref=${hostId}`;
  const appLink = `https://liveromance.vercel.app/stream/${hostId}`;
  
  // 📱 APK Download URL (Firebase Storage se)
  const apkUrl = process.env.NEXT_PUBLIC_APK_URL || 'https://firebasestorage.googleapis.com/.../app-release.apk';

  // 📤 Share Functions
  const shareWhatsApp = () => {
    const text = `🌹 Join my Live Romance Stream!\n\nWatch me live: ${appLink}\n\nUse my code: ${hostId}\n\n💎 Get 50 Welcome Diamonds!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    trackShare('whatsapp');
  };

  const shareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appLink)}&quote=🌹 Join my Live Romance Stream!`;
    window.open(url, '_blank', 'width=600,height=400');
    trackShare('facebook');
  };

  const shareInstagram = () => {
    // Instagram direct share not available via web, so copy link
    navigator.clipboard.writeText(appLink);
    toast({ title: "Link Copied!", description: "Paste in Instagram Story/DM" });
    trackShare('instagram');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Link Copied!", description: "Share anywhere!" });
  };

  // 📊 Track shares in Firestore
  const trackShare = async (platform: string) => {
    if (!user || !hostId) return;
    try {
      const { db } = await import('@/firebase');
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      await addDoc(collection(db, 'referrals'), {
        hostId,
        userId: user.uid,
        platform,
        sharedAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Share tracking error:", e);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#3D263D] to-[#2D1B2D] p-6 rounded-[2.5rem] border border-pink-500/20">
      
      {/* 🔹 QR Code */}
      <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl inline-block mb-4 shadow-lg">
        <QRCodeSVG
          value={referralLink}
          size={180}
          level="H"
          includeMargin={true}
          fgColor="#E11D48"
          bgColor="transparent"
        />
      </div>
      
      <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mb-4 text-center">
        Scan to Join My Network
      </p>

      {/* 🔹 Social Share Buttons */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <Button
          size="icon"
          className="bg-[#25D366] hover:bg-[#25D366]/90 rounded-xl h-10"
          onClick={shareWhatsApp}
        >
          <MessageCircle size={18} className="text-white" />
        </Button>
        <Button
          size="icon"
          className="bg-[#1877F2] hover:bg-[#1877F2]/90 rounded-xl h-10"
          onClick={shareFacebook}
        >
          <Facebook size={18} className="text-white" />
        </Button>
        <Button
          size="icon"
          className="bg-gradient-to-tr from-[#F09433] via-[#E6683C] to-[#C13584] rounded-xl h-10"
          onClick={shareInstagram}
        >
          <Instagram size={18} className="text-white" />
        </Button>
        <Button
          size="icon"
          className="bg-white/20 hover:bg-white/30 rounded-xl h-10"
          onClick={copyLink}
        >
          <Link2 size={18} className="text-white" />
        </Button>
      </div>

      {/* 🔹 APK Download Button */}
      <Button
        className="w-full h-12 bg-gradient-to-r from-red-600 to-pink-500 rounded-2xl font-black uppercase text-[10px] shadow-[0_0_20px_rgba(225,29,72,0.4)] hover:scale-[1.02] transition-transform"
        onClick={() => {
          window.open(apkUrl, '_blank');
          trackShare('apk_download');
        }}
      >
        📱 Download App (v1.0)
      </Button>

      {/* 🔹 Stats */}
      <div className="mt-4 text-center">
        <p className="text-[10px] text-slate-400">
          Shares today: <span className="text-pink-400 font-bold">12</span>
        </p>
      </div>
    </div>
  );
}
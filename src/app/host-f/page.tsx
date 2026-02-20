
'use client';

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, User, CheckCircle, Loader2, Camera, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { hostFaceVerification } from "@/ai/flows/host-face-verification-flow";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, setDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function HostFaceVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{ isVerified: boolean; message: string } | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const { firestore, auth } = useFirebase();
  const router = useRouter();

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions to use this feature.',
        });
      }
    };
    getCameraPermission();
  }, [toast]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg');
  };

  const handleVerify = async () => {
    if (!hasCameraPermission) {
      toast({ variant: 'destructive', title: 'Camera Error', description: 'Camera access is required.' });
      return;
    }

    const photoDataUri = capturePhoto();
    if (!photoDataUri) return;

    setIsVerifying(true);
    setResult(null);

    try {
      const res = await hostFaceVerification({ photoDataUri });
      
      if (res.isVerified && auth?.currentUser) {
        const userId = auth.currentUser.uid;
        
        // Instant unlock for both permissions
        const hostRef = doc(firestore, 'hosts', userId);
        await setDoc(hostRef, { 
          verified: true,
          canStreamPublic: true,
          canStreamPrivate: true,
          previewImageUrl: photoDataUri, 
          status: 'online',
          updatedAt: serverTimestamp() 
        }, { merge: true });

        toast({ title: '✅ VERIFIED!', description: 'Permissions unlocked! Redirecting...' });
        setResult(res);
        setTimeout(() => router.push('/host-p'), 1500);
      } else {
        toast({
          variant: 'destructive',
          title: 'Verification Failed',
          description: res.message || 'Face not recognized. Please ensure clear lighting.'
        });
        setResult(res);
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'System busy. Try again.' });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 max-w-lg mx-auto border-x border-white/10">
      <header className="absolute top-10 left-6">
        <Link href="/host-p">
          <Button variant="ghost" size="icon" className="rounded-full text-white">
            <ArrowLeft className="size-6" />
          </Button>
        </Link>
      </header>

      <div className="text-center space-y-4 mb-10">
        <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-1 uppercase tracking-widest text-[10px] font-bold">Identity Step</Badge>
        <h1 className="text-3xl font-black tracking-tighter uppercase font-headline">1-Sec Selfie</h1>
        <p className="text-slate-400 text-xs">Verify instantly to unlock Public & Private streaming.</p>
      </div>

      <div className="relative size-72 rounded-full border-4 border-primary/40 overflow-hidden bg-slate-900 shadow-[0_0_50px_rgba(137,90,246,0.3)]">
        <video 
          ref={videoRef} 
          className={cn(
            "w-full h-full object-cover",
            isVerifying && "opacity-50 grayscale"
          )} 
          autoPlay 
          muted 
          playsInline
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {isVerifying && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-primary shadow-[0_0_20px_#895af6] animate-scan" />
          </div>
        )}

        {result?.isVerified && (
          <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm flex items-center justify-center">
            <CheckCircle className="size-20 text-green-500" />
          </div>
        )}
      </div>

      <div className="mt-12 w-full space-y-4">
        <Button 
          disabled={isVerifying || result?.isVerified} 
          onClick={handleVerify}
          className="w-full bg-primary hover:bg-primary/90 h-16 rounded-3xl shadow-2xl shadow-primary/40 font-black text-lg gap-3 transition-transform active:scale-95 uppercase"
        >
          {isVerifying ? (
            <><Loader2 className="size-6 animate-spin" /> Verifying...</>
          ) : result?.isVerified ? (
            <><ShieldCheck className="size-6" /> Success!</>
          ) : (
            <><Camera className="size-6" /> Take 1-Sec Selfie</>
          )}
        </Button>
        <p className="text-center text-[10px] text-slate-500 uppercase font-bold tracking-widest">Powered by Stream-X AI</p>
      </div>
    </div>
  );
}

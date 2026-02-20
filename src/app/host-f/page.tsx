'use client';

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, User, CheckCircle, Loader2, Lightbulb, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { hostFaceVerification } from "@/ai/flows/host-face-verification-flow";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function HostFaceVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{ isVerified: boolean; message: string; confidence?: number } | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const { firestore, auth } = useFirebase();

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
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
      toast({ variant: "destructive", title: "Camera Error", description: "Camera access is required for verification." });
      return;
    }

    const photoDataUri = capturePhoto();
    if (!photoDataUri) {
      toast({ variant: "destructive", title: "Capture Error", description: "Could not capture image from camera." });
      return;
    }

    setIsVerifying(true);
    try {
      const res = await hostFaceVerification({ photoDataUri });
      setResult(res);
      
      if (res.isVerified && auth?.currentUser) {
        // Record the attempt
        addDoc(collection(firestore, 'hostVerificationAttempts'), {
          hostId: auth.currentUser.uid,
          status: 'approved',
          timestamp: serverTimestamp(),
          verificationImageUrl: photoDataUri,
          aiConfidenceScore: res.confidence || 0.95
        });

        // Update the host profile to verified
        const hostRef = doc(firestore, 'hosts', auth.currentUser.uid);
        updateDoc(hostRef, {
          verified: true
        });

        toast({ title: "Verification Successful", description: "Your identity has been confirmed." });
      } else {
        toast({ variant: "destructive", title: "Verification Failed", description: res.message });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Process failed. Please try again." });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="relative w-full max-w-lg h-screen bg-background flex flex-col overflow-hidden border-x border-border mx-auto">
      <header className="flex items-center px-6 py-4 pt-10">
        <Link href="/host-p">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold tracking-tight font-headline">AI Face Identity</h1>
      </header>

      <div className="px-6 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-primary uppercase tracking-widest">Host Onboarding</span>
          <Progress value={result?.isVerified ? 100 : 50} className="h-1.5 w-32" />
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-6 space-y-10">
        <div className="relative size-72 rounded-full border-4 border-primary/40 overflow-hidden bg-black shadow-2xl">
          <video 
            ref={videoRef} 
            className={cn(
              "w-full h-full object-cover transition-all duration-500",
              isVerifying ? "grayscale opacity-50 scale-105" : "grayscale-0 opacity-100 scale-100"
            )} 
            autoPlay 
            muted 
            playsInline
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {isVerifying && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary/60 shadow-[0_0_15px_#895af6] animate-scan" />
            </div>
          )}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center">
            <Badge variant="secondary" className="glass-effect px-4 py-1.5 rounded-full uppercase text-[10px] font-bold gap-2 tracking-widest text-primary">
              {isVerifying ? <Loader2 className="size-3 animate-spin" /> : result?.isVerified ? "Verified" : "Live View"}
            </Badge>
          </div>
        </div>

        <div className="w-full glass-effect rounded-2xl p-4 flex items-center gap-4">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Lightbulb className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold">Face Recognition</p>
            <p className="text-[11px] text-muted-foreground">Please look directly at the camera. Ensure good lighting.</p>
          </div>
        </div>
      </main>

      <footer className="p-6 pb-12">
        <Button 
          disabled={isVerifying || result?.isVerified} 
          onClick={handleVerify}
          className="w-full bg-primary hover:bg-primary/90 h-14 rounded-2xl shadow-xl shadow-primary/25 font-bold gap-2 text-base"
        >
          {isVerifying ? (
            <><Loader2 className="size-5 animate-spin" /> Analyzing Face...</>
          ) : result?.isVerified ? (
            <><CheckCircle className="size-5" /> Verified Successfully</>
          ) : (
            <><Camera className="size-5" /> Capture & Verify</>
          )}
        </Button>
      </footer>
    </div>
  );
}

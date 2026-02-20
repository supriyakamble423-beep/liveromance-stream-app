'use client';

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, User, CheckCircle, Loader2, Camera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { hostFaceVerification } from "@/ai/flows/host-face-verification-flow";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, setDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function HostFaceVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{ isVerified: boolean; message: string; confidence?: number; lightingIssue?: boolean } | null>(null);
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
    if (!photoDataUri) {
      toast({ variant: 'destructive', title: 'Capture Error', description: 'Could not capture photo.' });
      return;
    }

    setIsVerifying(true);
    setResult(null);

    try {
      const res = await hostFaceVerification({ photoDataUri });
      setResult(res);

      if (res.isVerified && auth?.currentUser) {
        const hostId = auth.currentUser.uid;
        
        // Record verification attempt in Firestore
        addDoc(collection(firestore, 'hostVerificationAttempts'), {
          hostId,
          status: 'approved',
          timestamp: serverTimestamp(),
          aiConfidenceScore: res.confidence || 0.9,
          photoUrl: photoDataUri.slice(0, 100) + '...' // Storage optimized record
        });

        // Update Host Profile in real-time
        const hostRef = doc(firestore, 'hosts', hostId);
        await setDoc(hostRef, { 
          verified: true,
          previewImageUrl: photoDataUri, // Use captured photo as profile preview
          updatedAt: serverTimestamp() 
        }, { merge: true });

        toast({ title: 'Face Verified!', description: 'Verification successful!' });
      } else if (res.lightingIssue) {
        toast({
          title: 'Lighting Issue',
          description: 'Please move to a brighter spot or ensure your face is visible.'
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Verification Failed',
          description: res.message || 'No human face detected. Please try again.'
        });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Verification failed. Try again.' });
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
        <h1 className="flex-1 text-center text-lg font-bold tracking-tight font-headline">Face Verification</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 space-y-6">
        <div className="relative size-72 rounded-full border-4 border-primary/40 overflow-hidden bg-black shadow-2xl">
          <video 
            ref={videoRef} 
            className={cn(
              "w-full h-full object-cover",
              isVerifying && "opacity-50"
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
        </div>

        {result?.lightingIssue && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
            <AlertCircle className="size-4" />
            <AlertTitle>Low Light Detected</AlertTitle>
            <AlertDescription>The AI is struggling to see you. Please move to a brighter area.</AlertDescription>
          </Alert>
        )}

        <div className="text-center space-y-2">
          <p className="text-sm font-bold">Look directly at the camera</p>
          <p className="text-xs text-muted-foreground">We just need to confirm you are a real person.</p>
        </div>
      </main>

      <footer className="p-6 pb-12">
        <Button 
          disabled={isVerifying || result?.isVerified} 
          onClick={handleVerify}
          className="w-full bg-primary hover:bg-primary/90 h-14 rounded-2xl shadow-xl shadow-primary/25 font-bold gap-2 text-base"
        >
          {isVerifying ? (
            <><Loader2 className="size-5 animate-spin" /> Checking...</>
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

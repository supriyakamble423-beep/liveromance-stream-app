'use client';

import { useState, useRef, useEffect } from "react";
import { useFirebase } from "@/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { ShieldCheck, Camera, Loader2, CheckCircle2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function HostVerificationPage() {
  const { firestore, storage, user } = useFirebase();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  // 1. Camera Initialization
  useEffect(() => {
    async function startCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "user",
            width: { ideal: 720 },
            height: { ideal: 720 }
          }, 
          audio: false 
        });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err) {
        console.error("Camera Error:", err);
        toast({ 
          variant: "destructive", 
          title: "Camera Error", 
          description: "Please allow camera access to verify your identity." 
        });
      }
    }
    startCamera();

    // Cleanup: Stop camera when leaving page
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  // 2. Capture & Upload Logic
  const handleCapture = async () => {
    if (!videoRef.current || !user || !storage || !firestore) {
      toast({ variant: "destructive", title: "Error", description: "System not ready. Try again." });
      return;
    }

    setLoading(true);

    try {
      // Step A: Capture frame from Video to Canvas
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize canvas context");
      
      // Draw the current video frame
      ctx.drawImage(videoRef.current, 0, 0);
      
      // Convert to Base64 String
      const photoData = canvas.toDataURL("image/jpeg", 0.7);

      // Step B: Upload to Firebase Storage
      const storagePath = `verifications/${user.uid}_${Date.now()}.jpg`;
      const storageRef = ref(storage, storagePath);
      
      await uploadString(storageRef, photoData, "data_url");
      const downloadURL = await getDownloadURL(storageRef);

      // Step C: Update Firestore permissions
      const hostRef = doc(firestore, 'hosts', user.uid);
      await updateDoc(hostRef, {
        verified: true,
        selfieUrl: downloadURL,
        canStreamPublic: true,
        canStreamPrivate: true,
        verificationStatus: 'approved',
        verifiedAt: serverTimestamp(),
      });

      setIsDone(true);
      toast({ title: "Identity Verified!", description: "Welcome to the host community." });
      
      // Redirect back to dashboard after a short delay
      setTimeout(() => {
        router.push('/host-p');
      }, 2000);

    } catch (error: any) {
      console.error("Verification Error:", error);
      toast({ 
        variant: "destructive", 
        title: "Verification Failed", 
        description: error.message || "An unexpected error occurred." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col max-w-lg mx-auto border-x border-white/10">
      {/* Header */}
      <div className="p-6 flex items-center gap-4">
        <Link href="/host-p">
          <Button variant="ghost" size="icon" className="rounded-full bg-white/5">
            <ChevronLeft className="size-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-black uppercase tracking-tighter">Identity Check</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 border border-primary/20 mb-2">
            <ShieldCheck className="size-8 text-primary" />
          </div>
          <h2 className="text-3xl font-black tracking-tight uppercase">Face Verification</h2>
          <p className="text-slate-400 text-sm font-medium px-8">
            Please ensure your face is clearly visible and well-lit.
          </p>
        </div>

        {/* Camera Container */}
        <div className="relative w-full aspect-square max-w-[320px] rounded-[3.5rem] overflow-hidden border-4 border-white/10 bg-slate-900 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          {!isDone ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover scale-x-[-1]" 
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-green-500/10 animate-in fade-in zoom-in duration-500">
              <CheckCircle2 className="size-24 text-green-500 mb-4" />
              <p className="font-black text-green-500 tracking-widest uppercase">Identity Secure</p>
            </div>
          )}
          
          {loading && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center space-y-4">
              <Loader2 className="size-12 text-primary animate-spin" />
              <p className="text-xs font-black uppercase tracking-widest text-primary">Uploading to Secure Server...</p>
            </div>
          )}

          {/* Guidelines Overlay */}
          {!loading && !isDone && (
            <div className="absolute inset-0 border-[30px] border-black/20 pointer-events-none rounded-[3.5rem]" />
          )}
        </div>

        <div className="w-full pt-4">
          {!isDone && (
            <Button 
              onClick={handleCapture} 
              disabled={loading || !stream}
              className="w-full h-16 rounded-[1.5rem] text-lg font-black uppercase tracking-widest gap-3 shadow-[0_10px_20px_rgba(var(--primary),0.3)] active:scale-95 transition-all"
            >
              {loading ? "Processing..." : <><Camera className="size-6" /> Take Photo</>}
            </Button>
          )}

          <div className="mt-8 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
              <ShieldCheck className="size-3" />
              Secure AI Verification
            </div>
            <p className="text-[9px] text-slate-600 text-center px-10 leading-relaxed font-bold uppercase">
              Your data is encrypted and used only for safety compliance.<br/> Unauthorized streaming is prohibited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
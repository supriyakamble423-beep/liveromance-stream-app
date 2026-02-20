"use client"

import { useState } from "react";
import { ArrowLeft, HelpCircle, Lightbulb, User, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { hostFaceVerification } from "@/ai/flows/host-face-verification-flow";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function VerifyPage() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{ isVerified: boolean; message: string } | null>(null);
  const { toast } = useToast();

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      // Simulate taking a photo by using a mock data URI of the placeholder image
      // In a real app, this would come from a camera capture
      const mockPhoto = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."; 
      const res = await hostFaceVerification({ photoDataUri: mockPhoto });
      setResult(res);
      
      if (res.isVerified) {
        toast({ title: "Verification Successful", description: res.message });
      } else {
        toast({ variant: "destructive", title: "Verification Failed", description: res.message });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to process verification." });
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyUserImage = PlaceHolderImages.find(img => img.id === "host-1")?.imageUrl || "https://picsum.photos/seed/verify/600/600";

  return (
    <div className="relative w-full max-w-lg h-screen bg-background flex flex-col overflow-hidden border-x border-border mx-auto">
      <header className="flex items-center px-6 py-4 pt-10">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold tracking-tight font-headline">Identity Verification</h1>
        <Button variant="ghost" size="icon" className="rounded-full">
          <HelpCircle className="size-5" />
        </Button>
      </header>

      <div className="px-6 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-primary uppercase tracking-widest">Step 2 of 3</span>
          <span className="text-xs font-medium text-muted-foreground">66% Complete</span>
        </div>
        <Progress value={66} className="h-1.5" />
        <div className="flex justify-between opacity-80">
          <div className="text-center"><p className="text-[10px] font-bold text-muted-foreground uppercase">Camera</p></div>
          <div className="text-center"><p className="text-[10px] font-bold text-primary uppercase">Face</p></div>
          <div className="text-center"><p className="text-[10px] font-bold text-muted-foreground uppercase">Rate</p></div>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-6 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight font-headline">Position your face</h2>
          <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
            Ensure you are in a well-lit area for better accuracy.
          </p>
        </div>

        <div className="relative group">
          <div className="absolute -inset-4 rounded-full border border-primary/20 animate-pulse" />
          <div className="relative w-72 h-72 rounded-full border-4 border-primary/40 overflow-hidden bg-muted shadow-2xl">
            <Image 
              src={verifyUserImage} 
              alt="Viewfinder" 
              fill 
              className="object-cover grayscale opacity-70"
            />
            {isVerifying && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary/60 shadow-[0_0_15px_#895af6] animate-scan" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
              <svg fill="none" height="200" viewBox="0 0 200 260" width="160" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 20C60 20 30 60 30 110C30 170 60 240 100 240C140 240 170 170 170 110C170 60 140 20 100 20Z" stroke="white" strokeDasharray="8 8" strokeWidth="2" />
              </svg>
            </div>
            
            <div className="absolute bottom-6 left-0 right-0 flex justify-center">
              <Badge variant="secondary" className="glass-effect px-4 py-1.5 rounded-full uppercase text-[10px] font-bold gap-2 tracking-widest text-primary border-primary/20">
                {isVerifying ? (
                  <><Loader2 className="size-3 animate-spin" /> Analyzing...</>
                ) : result?.isVerified ? (
                  <><CheckCircle className="size-3 text-green-500" /> Verified</>
                ) : (
                  "Ready"
                )}
              </Badge>
            </div>
          </div>
        </div>

        <div className="w-full glass-effect rounded-2xl p-4 flex items-center gap-4">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Lightbulb className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold">Verification Tip</p>
            <p className="text-[11px] text-muted-foreground">Keep your head straight and avoid wearing hats or glasses.</p>
          </div>
        </div>
      </main>

      <footer className="p-6 pb-12 space-y-4">
        <Button 
          disabled={isVerifying} 
          onClick={handleVerify}
          className="w-full bg-primary hover:bg-primary/90 h-14 rounded-2xl shadow-xl shadow-primary/25 font-bold gap-2 text-base"
        >
          {isVerifying ? <Loader2 className="size-5 animate-spin" /> : <User className="size-5" />}
          {result?.isVerified ? "Retry Scan" : "Scan Face"}
        </Button>
        <Button variant="ghost" className="w-full text-sm text-muted-foreground">
          Having trouble? Contact Support
        </Button>
      </footer>
    </div>
  );
}
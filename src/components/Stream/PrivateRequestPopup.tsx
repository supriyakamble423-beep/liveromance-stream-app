'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Firestore, collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface PrivateRequestPopupProps {
  firestore: Firestore | null;
  hostId: string;
}

export function PrivateRequestPopup({ firestore, hostId }: PrivateRequestPopupProps) {
  const [request, setRequest] = useState<{ id: string; userName: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore || !hostId) return;

    // Listen for pending private call requests for this host
    const q = query(
      collection(firestore, 'streamRequests'),
      where('hostId', '==', hostId),
      where('status', '==', 'pending'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        const docId = snapshot.docs[0].id;
        
        // Only show if the request is fresh (within last 30 seconds)
        const requestTime = docData.timestamp?.toMillis() || Date.now();
        if (Date.now() - requestTime < 30000) {
          setRequest({ id: docId, userName: docData.userName || 'Anonymous' });
          
          // Auto-dismiss after 5 seconds
          const timer = setTimeout(() => {
            setRequest(null);
          }, 5000);
          return () => clearTimeout(timer);
        }
      } else {
        setRequest(null);
      }
    }, (error) => {
      console.error("Request listener error:", error);
    });

    return () => unsubscribe();
  }, [firestore, hostId]);

  const handleAction = async (status: 'approved' | 'rejected') => {
    if (!firestore || !request) return;
    try {
      await updateDoc(doc(firestore, 'streamRequests', request.id), {
        status,
        updatedAt: serverTimestamp()
      });
      setRequest(null);
      toast({ title: status === 'approved' ? "Call Accepted" : "Call Rejected" });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  if (!request) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm pointer-events-none p-6">
      <div className="bg-gradient-to-br from-[#E11D48] to-[#F472B6] p-8 rounded-[3rem] shadow-[0_0_80px_rgba(225,29,72,0.6)] text-center space-y-6 pointer-events-auto animate-in zoom-in duration-300 max-w-sm w-full border border-white/20">
        <div className="size-16 bg-white/20 rounded-full flex items-center justify-center mx-auto romantic-glow">
          <UserPlus className="size-8 text-white" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Private Call</h3>
          <p className="text-xs font-bold text-white/90 uppercase tracking-widest leading-relaxed">
            @{request.userName} wants to unlock your private room.
          </p>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={() => handleAction('approved')} 
            className="flex-1 h-14 bg-white text-primary font-black uppercase tracking-widest rounded-2xl hover:bg-slate-100"
          >
            Accept
          </Button>
          <Button 
            onClick={() => handleAction('rejected')} 
            variant="outline" 
            className="flex-1 h-14 border-white text-white font-black uppercase tracking-widest rounded-2xl hover:bg-white/10"
          >
            Reject
          </Button>
        </div>

        {/* Progress Bar Timer */}
        <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
          <div className="h-full bg-white animate-[shrink_5s_linear_forwards]" />
        </div>
      </div>
      <style jsx global>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

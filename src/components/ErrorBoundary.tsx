'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Heart, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Themed Error Boundary
 * Catches client-side crashes and shows a "Romantic/Cyberpunk" recovery screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0F0101] text-white flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto border-x border-white/10">
          <div className="romantic-gradient p-5 rounded-[2.5rem] shadow-[0_0_50px_rgba(225,29,72,0.4)] mb-8 animate-pulse">
            <ShieldAlert className="size-16 text-white" />
          </div>
          
          <div className="space-y-4 mb-10">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Signal <span className="text-primary">Dropped</span></h1>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] leading-relaxed px-10">
              The AI Grid encountered a fatal anomaly. Re-establishing secure romantic connection...
            </p>
          </div>

          <div className="w-full space-y-4">
            <Button 
              onClick={() => window.location.reload()}
              className="w-full h-16 rounded-[1.5rem] bg-primary hover:bg-primary/90 text-lg font-black uppercase tracking-widest gap-3 shadow-2xl shadow-primary/40 text-white"
            >
              <RefreshCcw className="size-6" /> Reboot Node
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/global'}
              className="w-full h-14 rounded-2xl border-white/10 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-white/5"
            >
              Return to Marketplace
            </Button>
          </div>

          <div className="mt-12 opacity-20 flex items-center gap-2">
            <Heart className="size-4 fill-current" />
            <span className="text-[8px] font-black uppercase tracking-widest">System Overseer Protected</span>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

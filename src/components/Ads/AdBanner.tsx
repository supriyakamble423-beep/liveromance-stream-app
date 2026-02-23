'use client';

import React, { useEffect, useRef } from 'react';

/**
 * AdBanner Component
 * Designed to hold Adsterra banner scripts or direct links safely.
 */
export default function AdBanner() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    // Optional: Example of how to inject a script safely
    // const script = document.createElement('script');
    // script.type = 'text/javascript';
    // script.src = '//www.highperformanceformat.com/300x50/script.js';
    // containerRef.current.appendChild(script);
  }, []);
  
  return (
    <div className="w-full flex flex-col items-center my-8 animate-in fade-in duration-1000">
      <div className="flex items-center gap-2 mb-2">
        <span className="h-px w-8 bg-pink-500/20" />
        <p className="text-[8px] text-pink-500 font-black uppercase tracking-[0.3em]">Sponsored Content</p>
        <span className="h-px w-8 bg-pink-500/20" />
      </div>
      
      <div 
        ref={containerRef}
        className="bg-white/5 border border-pink-500/10 rounded-[2rem] overflow-hidden min-h-[60px] w-full max-w-[320px] flex items-center justify-center relative group transition-all hover:border-pink-500/30 shadow-lg shadow-pink-500/5"
      >
        <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest p-4 text-center">
          <span className="text-pink-600 opacity-50 group-hover:opacity-100 transition-opacity italic">Premium Ad Slot Active</span>
        </div>
        
        {/* Style Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/5 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

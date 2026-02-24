'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * AdBanner Component: Optimized for Stay-to-Earn session length.
 * Features an auto-refresh simulation to maximize CTR.
 */
export default function AdBanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    // Simulate Ad refresh logic every 45 seconds to maximize revenue during long streams
    const refreshInterval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 45000);

    return () => clearInterval(refreshInterval);
  }, []);
  
  return (
    <div key={refreshKey} className="w-full flex flex-col items-center my-10 animate-in fade-in zoom-in duration-700">
      <div className="flex items-center gap-3 mb-3">
        <span className="h-px w-6 bg-pink-500/30" />
        <p className="text-[9px] text-pink-500 font-black uppercase tracking-[0.4em] italic">Exclusive Partner</p>
        <span className="h-px w-6 bg-pink-500/30" />
      </div>
      
      <div 
        ref={containerRef}
        className="bg-[#3D263D]/60 border border-pink-500/20 rounded-[2.5rem] overflow-hidden min-h-[80px] w-full max-w-[340px] flex items-center justify-center relative group transition-all hover:border-pink-500/50 shadow-2xl shadow-pink-500/5 backdrop-blur-xl"
      >
        {/* Adsterra Placeholder Logic */}
        <div className="flex flex-col items-center text-center p-5 group-hover:scale-105 transition-transform duration-500">
          <div className="size-2 rounded-full bg-green-500 mb-2 shadow-[0_0_10px_#22c55e] animate-pulse" />
          <span className="text-[11px] text-[#FDA4AF] font-black uppercase tracking-widest italic group-hover:text-white transition-colors">Premium Ad Hub Active</span>
          <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">High-CTR Node #Ref-{refreshKey}</p>
        </div>
        
        {/* Glossy Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 via-transparent to-white/5 pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
    </div>
  );
}
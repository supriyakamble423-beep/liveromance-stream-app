'use client';

import React, { useEffect, useRef, useState } from 'react';

interface AdBannerProps {
  /** Adsterra script URL (e.g., //pl12345.highrevenuegate.com/abc/invoke.js) */
  adScriptUrl?: string;
  /** Adsterra ad container options key */
  adOptionsKey?: string;
}

/**
 * AdBanner Component: Loads Adsterra ad scripts dynamically.
 * Falls back to a styled placeholder if no ad script is configured.
 */
export default function AdBanner({ adScriptUrl, adOptionsKey }: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    // If a valid Adsterra script URL is provided, load it
    if (adScriptUrl && adScriptUrl.length > 10) {
      const scriptId = 'adsterra-banner-script';
      
      // Avoid loading the script multiple times
      if (document.getElementById(scriptId)) {
        setAdLoaded(true);
        return;
      }

      // Set ad options on window if key is provided
      if (adOptionsKey) {
        (window as unknown as Record<string, unknown>)[`atOptions_${adOptionsKey}`] = {
          key: adOptionsKey,
          format: 'iframe',
          height: 90,
          width: 728,
          params: {},
        };
      }

      const script = document.createElement('script');
      script.src = adScriptUrl;
      script.async = true;
      script.id = scriptId;
      script.onload = () => setAdLoaded(true);
      script.onerror = () => setAdError(true);
      containerRef.current.appendChild(script);

      return () => {
        const existingScript = document.getElementById(scriptId);
        if (existingScript) {
          existingScript.remove();
        }
      };
    }
  }, [adScriptUrl, adOptionsKey]);
  
  return (
    <div className="w-full flex flex-col items-center my-10 animate-in fade-in zoom-in duration-700">
      <div className="flex items-center gap-3 mb-3">
        <span className="h-px w-6 bg-pink-500/30" />
        <p className="text-[9px] text-pink-500 font-black uppercase tracking-[0.4em] italic">Exclusive Partner</p>
        <span className="h-px w-6 bg-pink-500/30" />
      </div>
      
      <div 
        ref={containerRef}
        className="bg-[#3D263D]/60 border border-pink-500/20 rounded-[2.5rem] overflow-hidden min-h-[80px] w-full max-w-[340px] flex items-center justify-center relative group transition-all hover:border-pink-500/50 shadow-2xl shadow-pink-500/5 backdrop-blur-xl"
      >
        {/* Show placeholder if ad hasn't loaded or no script URL configured */}
        {!adLoaded && (
          <div className="flex flex-col items-center text-center p-5 group-hover:scale-105 transition-transform duration-500">
            <div className={`size-2 rounded-full mb-2 shadow-[0_0_10px_#22c55e] animate-pulse ${adError ? 'bg-red-500' : 'bg-green-500'}`} />
            <span className="text-[11px] text-[#FDA4AF] font-black uppercase tracking-widest italic group-hover:text-white transition-colors">
              {adError ? 'Ad Failed to Load' : adScriptUrl ? 'Loading Ad...' : 'Ad Slot Available'}
            </span>
            {!adScriptUrl && (
              <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Configure NEXT_PUBLIC_ADSTERRA_SCRIPT_URL</p>
            )}
          </div>
        )}
        
        {/* Glossy Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 via-transparent to-white/5 pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
    </div>
  );
}

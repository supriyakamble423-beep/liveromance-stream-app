'use client';

import React, { useEffect, useRef } from 'react';

/**
 * Adsterra AdBanner Component
 * Optimized for Next.js with client-side only script injection.
 */
export default function AdBanner({ zoneId }: { zoneId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || !containerRef.current) return;

    const currentContainer = containerRef.current;
    
    // Clear container to prevent duplicate ads on re-renders
    currentContainer.innerHTML = '';

    try {
      // 1. Create atOptions script
      const confScript = document.createElement('script');
      confScript.type = 'text/javascript';
      confScript.innerHTML = `
        atOptions = {
          'key' : '${zoneId}',
          'format' : 'iframe',
          'height' : 250,
          'width' : 300,
          'params' : {}
        };
      `;

      // 2. Create invoke script
      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      // Load script after the main interactive parts of the page (simulating strategy="afterInteractive")
      invokeScript.async = true; 
      invokeScript.src = `//www.topcreativeformat.com/${zoneId}/invoke.js`;

      // 3. Append to container
      currentContainer.appendChild(confScript);
      currentContainer.appendChild(invokeScript);
    } catch (error) {
      console.error('Adsterra injection failed:', error);
    }

    return () => {
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };
  }, [zoneId]);

  return (
    <div className="w-full flex flex-col items-center my-8 animate-in fade-in duration-1000">
      {/* Decorative indicator for users */}
      <div className="flex items-center gap-3 mb-3 opacity-30">
        <span className="h-px w-4 bg-white/20" />
        <p className="text-[7px] text-white font-black uppercase tracking-[0.4em] italic">Promoted Node</p>
        <span className="h-px w-4 bg-white/20" />
      </div>
      
      {/* The actual ad container targeted by zoneId */}
      <div 
        ref={containerRef}
        id={`adsterra-container-${zoneId}`}
        className="bg-black/40 border border-white/5 rounded-[2.5rem] overflow-hidden min-h-[250px] min-w-[300px] flex items-center justify-center relative shadow-2xl backdrop-blur-xl"
      >
        <div className="text-[10px] font-black text-white/5 uppercase tracking-[0.2em] absolute">
          Loading Signal...
        </div>
      </div>
    </div>
  );
}

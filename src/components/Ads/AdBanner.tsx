'use client';

import React, { useEffect, useRef } from 'react';

/**
 * Adsterra AdBanner Component
 * Optimized for dynamic injection in Next.js
 */
export default function AdBanner({ zoneId }: { zoneId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    const currentContainer = containerRef.current;
    
    // Clear any existing scripts to prevent duplication on re-render
    currentContainer.innerHTML = '';

    // Create the script for atOptions
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

    // Create the script for invoke.js
    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = `//www.topcreativeformat.com/${zoneId}/invoke.js`;

    currentContainer.appendChild(confScript);
    currentContainer.appendChild(invokeScript);

    return () => {
      if (currentContainer) currentContainer.innerHTML = '';
    };
  }, [zoneId]);

  return (
    <div className="w-full flex flex-col items-center my-10 animate-in fade-in duration-1000">
      <div className="flex items-center gap-3 mb-3 opacity-40">
        <span className="h-px w-6 bg-white/20" />
        <p className="text-[8px] text-white font-black uppercase tracking-[0.4em] italic">Partner Signal</p>
        <span className="h-px w-6 bg-white/20" />
      </div>
      
      <div 
        ref={containerRef}
        className="bg-black/20 border border-white/5 rounded-[2rem] overflow-hidden min-h-[250px] min-w-[300px] flex items-center justify-center relative shadow-2xl backdrop-blur-xl"
      >
        {/* Adsterra ad will be injected here */}
      </div>
    </div>
  );
}

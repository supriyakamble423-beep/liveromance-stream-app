
'use client';

import React, { useEffect, useRef } from 'react';

/**
 * Adsterra Banner Component
 * Handles dynamic script injection for display ads.
 */
interface AdsterraBannerProps {
  adId: string;
  scriptUrl: string;
  className?: string;
}

export function AdsterraBanner({ adId, scriptUrl, className }: AdsterraBannerProps) {
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
          'key' : '${adId}',
          'format' : 'iframe',
          'height' : 50,
          'width' : 320,
          'params' : {}
        };
      `;

      // 2. Create invoke script
      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = scriptUrl;
      invokeScript.async = true;

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
  }, [adId, scriptUrl]);

  return (
    <div 
      ref={containerRef}
      id={`adsterra-banner-${adId}`}
      className={className}
    />
  );
}

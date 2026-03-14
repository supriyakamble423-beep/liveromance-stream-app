'use client';

import { useEffect, useRef } from 'react';

interface AdsterraBannerProps {
  adId: string;
  scriptUrl: string; // Adsterra se milne wala poora script URL
  className?: string;
}

/**
 * AdsterraBanner Component
 * Dynamically injects Adsterra banner scripts with cleanup safety.
 */
export function AdsterraBanner({ adId, scriptUrl, className = '' }: AdsterraBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || !containerRef.current) return;

    // Clear existing content to prevent duplicate ads on re-renders
    const currentContainer = containerRef.current;
    currentContainer.innerHTML = '';

    // Script load karne ke liye
    const script = document.createElement('script');
    script.type = 'application/javascript';
    script.src = scriptUrl;
    script.async = true;
    script.setAttribute('data-cfasync', 'false');

    try {
      currentContainer.appendChild(script);
    } catch (error) {
      console.error('Adsterra script injection failed:', error);
    }

    return () => {
      if (currentContainer) {
        currentContainer.innerHTML = ''; // Cleanup on unmount
      }
    };
  }, [scriptUrl]);

  return (
    <div 
      id={`ad-container-${adId}`} 
      ref={containerRef} 
      className={`w-full flex justify-center items-center overflow-hidden ${className}`}
      style={{ minHeight: '50px' }} // Banner height ke liye min-height set ki hai
    >
      {/* Ad yahan load hoga */}
    </div>
  );
}


import { Loader2 } from "lucide-react";

/**
 * Global Marketplace Loading UI
 * Prevents ChunkLoadError by providing a fallback while the route segment is loading.
 */
export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-[#2D1B2D] flex flex-col items-center justify-center space-y-8 mesh-gradient">
      <div className="relative size-32 animate-pulse logo-glow flex items-center justify-center">
        <div className="size-24 rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center">
          <span className="text-white font-black italic text-4xl">GL</span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin text-primary" />
        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Syncing Romantic Grid...</p>
      </div>
    </div>
  );
}

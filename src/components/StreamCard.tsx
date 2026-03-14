'use client';

import { motion } from 'framer-motion';
import { Users, MapPin, Lock, Eye } from 'lucide-react';
import type { Stream } from '@/types';

interface StreamCardProps {
  stream: Stream;
  onJoin: (streamId: string) => void;
}

/**
 * StreamCard Component
 * Displays a high-engagement preview for live broadcast nodes.
 * Optimized for the Cyber-Romantic aesthetic of Global Love.
 */
export function StreamCard({ stream, onJoin }: StreamCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onJoin(stream.id)}
      className="relative bg-card rounded-[2rem] overflow-hidden cursor-pointer border border-white/5 shadow-2xl group transition-all hover:border-primary/30"
    >
      {/* Preview Media Area */}
      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
        {/* Animated Avatar Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center transition-transform duration-1000 group-hover:scale-110">
          <div className="w-24 h-24 rounded-[2.5rem] romantic-gradient flex items-center justify-center text-4xl font-black italic text-white shadow-[0_0_40px_rgba(225,29,72,0.4)]">
            {stream.hostName.charAt(0)}
          </div>
        </div>
        
        {/* Status Indicators */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-primary px-3 py-1.5 rounded-full shadow-lg">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-white text-[9px] font-black uppercase tracking-widest">LIVE</span>
        </div>

        {stream.isPublic ? (
          <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-white/10">
            <Eye className="w-4 h-4 text-white" />
          </div>
        ) : (
          <div className="absolute top-4 right-4 bg-secondary px-2.5 py-1.5 rounded-2xl shadow-lg">
            <Lock className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Viewer Count */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <Users className="w-3.5 h-3.5 text-secondary" />
          <span className="text-white text-[10px] font-black italic tracking-tighter">{stream.viewers}</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-white font-black text-lg uppercase italic tracking-tighter truncate group-hover:text-primary transition-colors">
              @{stream.hostName}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-secondary" />
              <span className="text-muted-foreground text-[10px] font-black uppercase tracking-widest truncate">
                {stream.region}
              </span>
            </div>
          </div>
          
          <button 
            className="romantic-gradient text-white px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl active:scale-90 transition-all hover:brightness-110"
            onClick={(e) => {
              e.stopPropagation();
              onJoin(stream.id);
            }}
          >
            Join Node
          </button>
        </div>
      </div>
    </motion.div>
  );
}

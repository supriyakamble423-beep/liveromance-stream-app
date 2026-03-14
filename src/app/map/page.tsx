'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, Eye, Heart, X, Zap } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BottomNav } from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

const MAP_USERS = [
  { id: '1', name: 'Sophia', country: 'USA', viewers: 1200, top: '30%', left: '20%', avatar: 'S' },
  { id: '2', name: 'Priya', country: 'India', viewers: 3400, top: '45%', left: '68%', avatar: 'P' },
  { id: '3', name: 'Lucas', country: 'Brazil', viewers: 890, top: '65%', left: '32%', avatar: 'L' },
  { id: '4', name: 'Emma', country: 'UK', viewers: 560, top: '25%', left: '48%', avatar: 'E' },
  { id: '5', name: 'Yuki', country: 'Japan', viewers: 2100, top: '35%', left: '82%', avatar: 'Y' },
  { id: '6', name: 'Amara', country: 'Nigeria', viewers: 450, top: '55%', left: '50%', avatar: 'A' },
];

export default function MapPage() {
  const [selectedUser, setSelectedUser] = useState<typeof MAP_USERS[0] | null>(null);

  return (
    <div className="relative h-screen w-full max-w-lg mx-auto bg-[#0f0a10] overflow-hidden border-x border-white/5 mesh-gradient">
      {/* Abstract Map Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[30%] h-[40%] bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] left-[40%] w-[20%] h-[30%] bg-secondary/20 rounded-full blur-[80px]" />
        <div className="absolute top-[50%] left-[60%] w-[25%] h-[35%] bg-primary/10 rounded-full blur-[120px]" />
      </div>

      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <header className="absolute top-0 left-0 right-0 p-8 pt-12 bg-gradient-to-b from-black/80 to-transparent z-30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white">Global Grid</h1>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Live Satellite Nodes</p>
          </div>
          <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Zap className="size-6 text-amber-400 fill-current animate-pulse" />
          </div>
        </div>
      </header>

      <div className="relative flex-1 h-full">
        {MAP_USERS.map((user) => (
          <motion.button
            key={user.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.2 }}
            onClick={() => setSelectedUser(user)}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{ top: user.top, left: user.left }}
          >
            <div className="absolute inset-0 bg-primary rounded-full opacity-40 animate-ping scale-150" />
            <Avatar className="size-12 border-2 border-white/20 relative z-10 shadow-[0_0_20px_rgba(225,29,72,0.4)]">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
              <AvatarFallback className="bg-primary text-white font-black">{user.avatar}</AvatarFallback>
            </Avatar>
            <div className="absolute -top-2 -right-2 bg-primary text-white text-[7px] px-1.5 py-0.5 rounded-full font-black uppercase z-20">Live</div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-36 left-6 right-6 z-50"
          >
            <div className="bg-[#2D1B2D]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden">
              <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 text-white/40"><X size={20} /></button>
              <div className="flex items-start gap-5">
                <Avatar className="size-20 border-4 border-primary/30 rounded-3xl">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.name}`} />
                  <AvatarFallback className="text-2xl font-black">{selectedUser.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">@{selectedUser.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mt-1">
                      <MapPin className="size-3 text-secondary" /> {selectedUser.country}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5"><Eye className="size-4 text-primary" /><span className="text-xs font-black italic">{selectedUser.viewers}</span></div>
                    <div className="flex items-center gap-1.5"><Heart className="size-4 text-secondary fill-secondary" /><span className="text-xs font-black italic">12k</span></div>
                  </div>
                  <Link href={`/stream/${selectedUser.id}`} className="block"><Button className="w-full h-12 romantic-gradient rounded-xl font-black uppercase text-[10px] tracking-widest">Connect Now</Button></Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}

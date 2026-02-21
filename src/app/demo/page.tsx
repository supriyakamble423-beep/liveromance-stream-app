'use client';

import { 
  ShieldCheck, Globe, Zap, Lock, Users, Radio, 
  MessageSquare, TrendingUp, Cpu, Sparkles, ChevronRight, Activity, Eye, UserCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/BottomNav";
import Link from "next/link";

const features = [
  {
    title: "Interactive Stream Demo",
    description: "Experience the premium live interface with mock chat, hearts, and tip menu animations.",
    icon: Radio,
    color: "text-red-500",
    bg: "bg-red-500/10",
    link: "/stream/demo",
    isNew: true
  },
  {
    title: "AI Face ID Onboarding",
    description: "Ultra-fast, lenient AI verification that grants instant streaming access with a 1-second selfie.",
    icon: ShieldCheck,
    color: "text-green-500",
    bg: "bg-green-500/10",
    link: "/host-f"
  },
  {
    title: "3D Global Traffic Map",
    description: "Futuristic 3D visualization of real-time traffic across global nodes (New York, Delhi, Tokyo).",
    icon: Globe,
    color: "text-primary",
    bg: "bg-primary/10",
    link: "/interest"
  },
  {
    title: "AI Stream Optimizer",
    description: "Neural analysis that suggests the best time for hosts to go live based on global demand.",
    icon: Zap,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    link: "/host-p"
  },
  {
    title: "Admin God-Mode",
    description: "Real-time surveillance and direct command injection into any host's stream for full system control.",
    icon: MessageSquare,
    color: "text-secondary",
    bg: "bg-secondary/10",
    link: "/admin"
  }
];

export default function DemoShowcase() {
  return (
    <div className="min-h-screen bg-slate-950 text-white pb-32 max-w-lg mx-auto border-x border-white/10">
      <header className="p-8 pt-12 space-y-4">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
            <Cpu className="size-7 text-primary animate-pulse" />
          </div>
          <div>
            <Badge className="bg-primary/20 text-primary border-none text-[10px] font-black tracking-widest uppercase mb-1">Capabilities v2.1</Badge>
            <h1 className="text-3xl font-black uppercase tracking-tighter italic font-headline">System Intelligence</h1>
          </div>
        </div>
        <p className="text-sm text-slate-400 font-medium leading-relaxed">
          Explore the advanced modules and interactive demos developed for the Global Social Marketplace.
        </p>
      </header>

      <main className="px-6 space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {features.map((f, i) => (
            <Link key={i} href={f.link}>
              <div className="group relative p-6 rounded-[2.5rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all active:scale-[0.98]">
                {f.isNew && (
                  <Badge className="absolute -top-2 -right-2 bg-red-600 text-[8px] font-black uppercase border-none px-2 shadow-lg z-10 animate-bounce">
                    HOT DEMO
                  </Badge>
                )}
                <div className="flex items-start gap-4">
                  <div className={`size-12 rounded-2xl ${f.bg} flex items-center justify-center ${f.color} shrink-0`}>
                    <f.icon className="size-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-black text-sm uppercase tracking-tight">{f.title}</h3>
                      <ChevronRight className="size-4 text-slate-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      {f.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <section className="mt-10 p-8 rounded-[3rem] bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 text-center space-y-4">
          <Sparkles className="size-10 text-primary mx-auto animate-bounce" />
          <h2 className="text-xl font-black uppercase italic">Future-Ready Architecture</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Next.js 15 • Firebase 11 • AI Genkit</p>
          <div className="pt-4 flex flex-col gap-3">
             <Link href="/global">
               <Button className="w-full h-14 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-slate-200">
                 Marketplace Entry
               </Button>
             </Link>
             <Link href="/host-p">
               <Button variant="outline" className="w-full h-14 rounded-2xl border-white/10 text-white font-black uppercase tracking-widest">
                 Host Dashboard
               </Button>
             </Link>
          </div>
        </section>

        <div className="flex items-center justify-center gap-2 py-8 opacity-30">
          <Activity className="size-4 text-green-500" />
          <span className="text-[10px] font-black uppercase tracking-widest">All Modules Operational</span>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
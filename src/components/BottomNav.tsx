'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Radio, Map, User, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Global", href: "/global" },
  { icon: Radio, label: "Trends", href: "/trends" },
  { icon: Wallet, label: "Wallet", href: "/wallet" },
  { icon: Map, label: "Map", href: "/interest" },
  { icon: User, label: "Profile", href: "/host-p" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#2D1B2D]/95 backdrop-blur-2xl border-t border-white/5 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.5)]">
      <div className="flex justify-around items-end h-16 max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-300 relative pb-2",
                isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-primary"
              )}
            >
              <div className="relative">
                <item.icon className={cn("size-6", isActive && "fill-current drop-shadow-[0_0_8px_#E11D48]")} />
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-tighter leading-none transition-all",
                isActive ? "opacity-100" : "opacity-60"
              )}>{item.label}</span>
              {isActive && (
                <div className="absolute -bottom-0.5 h-1 w-6 bg-primary rounded-full romantic-glow" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

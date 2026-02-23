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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border pb-safe shadow-[0_-4px_20px_rgba(225,29,72,0.1)]">
      <div className="flex justify-around items-end h-16 max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors relative pb-2",
                isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}
            >
              <div className="relative">
                <item.icon className={cn("size-6", isActive && "fill-current")} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter leading-none">{item.label}</span>
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


'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Radio, User, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * BottomNav Component
 * Features Framer Motion active states and sits above the Social Bar (ID: 28788998).
 * Positioned at bottom-14 to accommodate Adsterra floating bar.
 */
const navItems = [
  { icon: Home, label: "Home", href: "/global" },
  { icon: Search, label: "Discover", href: "/trends" },
  { icon: MapPin, label: "Map", href: "/interest" },
  { icon: Radio, label: "Go Live", href: "/host-p" },
  { icon: User, label: "Profile", href: "/host-p" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-14 left-0 right-0 z-50 bg-[#2D1B2D]/95 backdrop-blur-2xl border-t border-white/5 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.5)]">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          // Match pathname to highlight active route
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.label}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-14 h-14 group"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-[#E11D48]/20 rounded-xl"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <item.icon className={cn(
                "w-6 h-6 relative z-10 transition-all duration-300",
                isActive ? "text-[#F472B6] scale-110" : "text-gray-400 group-hover:text-primary"
              )} />
              
              <span className={cn(
                "text-[9px] mt-1 relative z-10 font-black uppercase tracking-tighter transition-colors duration-300",
                isActive ? "text-[#F472B6]" : "text-gray-500"
              )}>
                {item.label}
              </span>
              
              {isActive && (
                <motion.div 
                  className="absolute -bottom-1 h-0.5 w-6 bg-primary rounded-full romantic-glow"
                  layoutId="activeUnderline"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

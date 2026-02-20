"use client"

import { useState, useEffect } from "react";
import { 
  Bell, Globe, TrendingUp, Cpu, AlertTriangle, 
  ArrowUp, Download, LayoutDashboard, BarChart2, 
  Bolt, UserCircle, Settings, RefreshCcw, Wifi, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { adminAIErrorReports, type AdminAIErrorReportsOutput } from "@/ai/flows/admin-ai-error-reports";
import Image from "next/image";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [reports, setReports] = useState<AdminAIErrorReportsOutput["autoReports"]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchReports() {
      setIsLoading(true);
      try {
        const res = await adminAIErrorReports({
          systemLogs: "Memory usage spike on Node 3. Latency > 200ms detected in AP-South-1 region.",
          hostVerificationIssues: ["User #882: ID document blurry", "User #991: Face mismatch detected"]
        });
        setReports(res.autoReports);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReports();
  }, []);

  const adminAvatar = PlaceHolderImages.find(img => img.id === "avatar-admin")?.imageUrl || "";

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-lg mx-auto border-x border-border bg-background pb-20">
      <header className="flex items-center justify-between px-6 pt-10 pb-4 sticky top-0 z-20 bg-background/80 backdrop-blur-md">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-secondary shadow-[0_0_10px_#0EA5E9] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Live System</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight font-headline">AI Error Manager</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="icon" className="size-10 rounded-full bg-primary/10 text-primary">
            <Bell className="size-5" />
          </Button>
          <div className="size-10 rounded-full overflow-hidden border-2 border-primary/30 relative">
            <Image src={adminAvatar} alt="Admin" fill className="object-cover" />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 space-y-6 pb-24 no-scrollbar">
        {/* Stats Section */}
        <section className="grid grid-cols-2 gap-3 mt-2">
          <div className="col-span-2 flex flex-col gap-2 p-5 rounded-3xl glass-effect border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground text-sm font-medium">System Uptime</span>
              <TrendingUp className="text-secondary size-5" />
            </div>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-3xl font-bold tracking-tight">99.98%</p>
              <Badge variant="secondary" className="bg-green-500/10 text-green-500 text-[10px] font-bold mb-1.5 py-0">
                <ArrowUp className="size-3 mr-0.5" /> 0.01%
              </Badge>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-primary rounded-full w-[99.98%] shadow-[0_0_8px_#895af6]" />
            </div>
          </div>
          
          <div className="flex flex-col gap-1 p-4 rounded-2xl bg-muted/30 border border-border">
            <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">AI Agents</span>
            <p className="text-xl font-bold">14 Active</p>
            <div className="flex items-center gap-1 mt-2">
              {[1, 2, 3].map(i => <span key={i} className="size-1.5 rounded-full bg-green-500" />)}
              {[1, 2].map(i => <span key={i} className="size-1.5 rounded-full bg-muted" />)}
            </div>
          </div>
          <div className="flex flex-col gap-1 p-4 rounded-2xl bg-muted/30 border border-border">
            <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Error Rate</span>
            <p className="text-xl font-bold text-destructive">0.02%</p>
            <p className="text-[10px] text-muted-foreground mt-2 font-mono">Last sync: 2s ago</p>
          </div>
        </section>

        {/* Action Header */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold font-headline">Auto-reports Feed</h2>
            <Button variant="link" className="text-primary text-[10px] font-bold uppercase tracking-widest p-0 h-auto gap-1">
              Export <Download className="size-3" />
            </Button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {["All Actions", "Network", "Onboarding", "Database"].map((filter, i) => (
              <Badge 
                key={filter} 
                variant={i === 0 ? "default" : "outline"}
                className={cn(
                  "px-4 py-1.5 rounded-full whitespace-nowrap cursor-pointer transition-all",
                  i === 0 ? "bg-primary" : "bg-muted/50"
                )}
              >
                {filter}
              </Badge>
            ))}
          </div>
        </section>

        {/* Feed Items */}
        <section className="space-y-4">
          {isLoading ? (
            <div className="text-center py-10 text-muted-foreground animate-pulse">Analyzing system logs...</div>
          ) : reports.length > 0 ? (
            reports.map((report, idx) => (
              <div key={idx} className="flex gap-4 group">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "size-9 rounded-full flex items-center justify-center border",
                    report.severity === 'Critical' ? "bg-destructive/20 border-destructive/30 text-destructive" : "bg-secondary/20 border-secondary/30 text-secondary"
                  )}>
                    {report.severity === 'Critical' ? <AlertTriangle className="size-5" /> : <RefreshCcw className="size-5" />}
                  </div>
                  <div className="w-px flex-1 bg-border my-2" />
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-sm">{report.reportType}</h3>
                    <span className="text-[10px] font-mono text-muted-foreground">Just now</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border group-hover:border-primary/30 transition-colors">
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                      {report.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={cn(
                        "text-[9px] uppercase font-bold",
                        report.severity === 'Critical' ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-500"
                      )}>
                        {report.severity} Severity
                      </Badge>
                      <Badge variant="outline" className="text-[9px] uppercase font-bold opacity-60">System</Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex gap-4 group">
              <div className="flex flex-col items-center">
                <div className="size-9 rounded-full bg-secondary/20 border border-secondary/30 text-secondary flex items-center justify-center">
                  <Wifi className="size-5" />
                </div>
              </div>
              <div className="flex-1">
                <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                  <p className="text-xs text-muted-foreground">All systems operational. No critical issues detected.</p>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-xl border-t border-border px-6 py-4 flex justify-between items-center max-w-lg mx-auto">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-primary">
          <LayoutDashboard className="size-6" />
          <span className="text-[10px] font-bold uppercase">Status</span>
        </Link>
        <Link href="#" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
          <BarChart2 className="size-6" />
          <span className="text-[10px] font-medium uppercase">Stats</span>
        </Link>
        <div className="relative -mt-12">
          <Link href="/verify">
            <Button className="size-14 rounded-full bg-primary text-white flex items-center justify-center shadow-2xl shadow-primary/40 transition-transform active:scale-90 border-4 border-background">
              <Bolt className="size-7 fill-current" />
            </Button>
          </Link>
        </div>
        <Link href="/referral" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
          <Users className="size-6" />
          <span className="text-[10px] font-medium uppercase">Refer</span>
        </Link>
        <Link href="#" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
          <Settings className="size-6" />
          <span className="text-[10px] font-medium uppercase">Admin</span>
        </Link>
      </nav>
    </div>
  );
}

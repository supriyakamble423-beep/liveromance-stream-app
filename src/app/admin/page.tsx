
'use client';

import { useState, useEffect } from "react";
import { 
  Bell, AlertTriangle, ArrowUp, LayoutDashboard, 
  Settings, RefreshCcw, Wifi, UserCircle, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminAIErrorReports, type AdminAIErrorReportsOutput } from "@/ai/flows/admin-ai-error-reports";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/BottomNav";

export default function AdminPanel() {
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

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-lg mx-auto border-x border-border bg-background">
      <header className="flex items-center justify-between px-6 pt-10 pb-4 sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-secondary shadow-[0_0_10px_#0EA5E9] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">System Status</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight font-headline">Admin Control</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="icon" className="size-10 rounded-full bg-primary/10 text-primary">
            <Bell className="size-5" />
          </Button>
          <div className="size-10 rounded-full overflow-hidden border-2 border-primary/30 relative bg-muted flex items-center justify-center">
            <UserCircle className="size-6 text-muted-foreground" />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 space-y-6 pb-24 no-scrollbar">
        <section className="grid grid-cols-2 gap-3 mt-4">
          <div className="col-span-2 flex flex-col gap-2 p-5 rounded-3xl glass-effect border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground text-sm font-medium">Uptime</span>
              <Wifi className="text-secondary size-5" />
            </div>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-3xl font-bold tracking-tight">99.9%</p>
              <Badge variant="secondary" className="bg-green-500/10 text-green-500 text-[10px] font-bold mb-1.5 py-0">
                <ArrowUp className="size-3 mr-0.5" /> Stable
              </Badge>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold font-headline">AI Auto-reports</h2>
            <Button variant="link" className="text-primary text-[10px] font-bold uppercase tracking-widest p-0 h-auto gap-1">
              Export <Download className="size-3" />
            </Button>
          </div>
          
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-10 text-muted-foreground animate-pulse">Analyzing system logs...</div>
            ) : reports.map((report, idx) => (
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
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border group-hover:border-primary/30 transition-colors">
                    <h3 className="font-bold text-sm mb-1">{report.reportType}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">{report.description}</p>
                    <Badge variant="secondary" className={cn(
                      "text-[9px] uppercase font-bold",
                      report.severity === 'Critical' ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-500"
                    )}>
                      {report.severity}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

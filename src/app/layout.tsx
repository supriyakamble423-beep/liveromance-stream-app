'use client';

import type { Metadata, Viewport } from "next";
import { Inter, Spline_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

const splineSans = Spline_Sans({
  subsets: ["latin"],
  variable: "--font-spline-sans",
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${splineSans.variable}`} suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Adsterra Global Social Bar - High CPM Unit */}
        <Script 
          id="adsterra-social-bar"
          strategy="afterInteractive"
          src="//pl25914325.highratecpm.com/73/64/82/7364828678576.js" 
          onError={(e) => console.error("Social Bar failed to load", e)}
        />
      </head>
      <body className="font-body antialiased selection:bg-primary/30 selection:text-primary mesh-gradient min-h-screen" suppressHydrationWarning>
        <ErrorBoundary>
          <FirebaseClientProvider>
            {children}
            <Toaster />
          </FirebaseClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}


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

export const metadata: Metadata = {
  title: 'Global Love - Live Romance Grid',
  description: 'Connect with global hosts and earn lifetime rewards.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /**
   * NOTE: Next.js uses folders in src/app/ for routing.
   * Global state and layouts are handled here.
   */
  return (
    <html lang="en" className={`dark ${inter.variable} ${splineSans.variable}`} suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Adsterra Global Social Bar - HIGH CPM Unit ID: 28788998 */}
        <Script 
          id="adsterra-social-bar-new"
          strategy="afterInteractive"
          src={`https://www.topcreativeformat.com/28788998/invoke.js`} 
        />
      </head>
      <body className="font-body antialiased selection:bg-primary/30 selection:text-primary mesh-gradient min-h-screen bg-[#0f0a10]" suppressHydrationWarning>
        <ErrorBoundary>
          <FirebaseClientProvider>
            {/* Main content container with bottom padding for Navigation + Social Bar */}
            <main className="pb-32 pt-4 px-4 min-h-screen">
              {children}
            </main>
            <Toaster />
          </FirebaseClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

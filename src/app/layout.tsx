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
  title: 'Global Love - Social Discovery',
  description: 'Connect with hosts around the world in real-time.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Global Love',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FF0000",
  viewportFit: 'cover',
};

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
      </head>
      <body className="font-body antialiased selection:bg-primary/30 selection:text-primary" suppressHydrationWarning>
        <ErrorBoundary>
          <FirebaseClientProvider>
            {children}
            <Toaster />
          </FirebaseClientProvider>
        </ErrorBoundary>
        
        {/* --- PWA Auto-Update Registration Logic --- */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('SW: Registered successfully');

                    // Detect updates automatically
                    registration.onupdatefound = () => {
                      const installingWorker = registration.installing;
                      if (installingWorker == null) return;

                      installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed') {
                          if (navigator.serviceWorker.controller) {
                            console.log('SW: New version detected! Refreshing...');
                            // Tell the new worker to skip waiting
                            installingWorker.postMessage({ type: 'SKIP_WAITING' });
                          }
                        }
                      };
                    };
                  },
                  function(err) {
                    console.log('SW: Registration failed: ', err);
                  }
                );

                // Refresh the page when the new service worker takes over
                let refreshing = false;
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                  if (refreshing) return;
                  refreshing = true;
                  window.location.reload();
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}

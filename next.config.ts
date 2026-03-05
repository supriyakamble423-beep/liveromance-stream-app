/** @type {import('next').NextConfig} */
import { NextConfig } from 'next';

// ✅ Check if building for static export (Capacitor/APK)
const isStaticExport = process.env.NEXT_STATIC_EXPORT === 'true';

const nextConfig: NextConfig = {
  images: {
    unoptimized: isStaticExport, // ✅ Required for static export
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'www.gstatic.com' },
    ],
  },

  typescript: { 
    ignoreBuildErrors: true 
  },
  
  eslint: { 
    ignoreDuringBuilds: true 
  },

  poweredByHeader: false,
  reactStrictMode: true,
  trailingSlash: isStaticExport, // ✅ Only for static export
  compress: true,

  // ✅ Conditional output: static for APK, serverless for Vercel
  ...(isStaticExport && { output: 'export' }),
};

export default nextConfig;
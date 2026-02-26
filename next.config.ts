import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Static export enable करो (Firebase Hosting के लिए जरूरी)
  output: 'export',

  // Images remote patterns (तुम्हारे पहले से सही हैं)
  images: {
    unoptimized: true, // static export में जरूरी – optimized images skip
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      }
    ],
  },

  // Build optimizations
  typescript: {
    ignoreBuildErrors: true, // production में errors skip (test में हटा सकते हो)
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  poweredByHeader: false,
  reactStrictMode: true,

  // SPA routing fix (Firebase Hosting के लिए)
  trailingSlash: true,
};

export default nextConfig;
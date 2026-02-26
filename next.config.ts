import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Images remote patterns (Updated for dynamic environment)
  images: {
    unoptimized: true, // Keeping unoptimized to avoid extra Vercel image costs, change if needed
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
    ignoreBuildErrors: true, 
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  poweredByHeader: false,
  reactStrictMode: true,

  // SPA routing fix
  trailingSlash: true,
};

export default nextConfig;
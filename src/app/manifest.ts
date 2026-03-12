import { MetadataRoute } from 'next'

/**
 * Dynamic Manifest Handler
 * Using manifest.ts instead of a static file to prevent 404 HTML errors 
 * that cause "Unexpected end of JSON input" and ChunkLoadErrors.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Global Love',
    short_name: 'GlobalLove',
    description: 'Live Streaming App',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F0101',
    theme_color: '#E11D48',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}

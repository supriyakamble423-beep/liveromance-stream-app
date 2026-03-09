
import { MetadataRoute } from 'next'

/**
 * Dynamic Manifest Handler
 * Using manifest.ts instead of a static file to prevent 404 HTML errors 
 * that cause "Unexpected end of JSON input" and ChunkLoadErrors.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Global Love - Social Discovery',
    short_name: 'GlobalLove',
    description: 'Connect with hosts around the world in real-time.',
    start_url: '/',
    display: 'standalone',
    background_color: '#2D1B2D',
    theme_color: '#E11D48',
    icons: [
      {
        src: 'https://placehold.co/192x192/E11D48/white?text=GL',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://placehold.co/512x512/E11D48/white?text=Global+Love',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}

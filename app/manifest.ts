import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GenZee | AI Voice & Content Automation Studio',
    short_name: 'GenZee',
    description: 'All-in-one AI voice synthesis and multi-platform content automation for YouTube, Facebook, and Instagram.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ff7d6e',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.pixabay.com' },
      { protocol: 'https', hostname: '*.fbcdn.net' },
      { protocol: 'https', hostname: '*.cdninstagram.com' },
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizePackageImports: ['react-icons'],
  },
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/admin',
        permanent: true,
      },
      {
        source: '/dashboard/:path*',
        destination: '/admin/:path*',
        permanent: true,
      },
      {
        source: '/landing',
        destination: '/',
        permanent: true,
      },
      {
        source: '/showcase',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

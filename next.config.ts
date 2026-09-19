import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    domains: [new URL('https://picsum.photos').hostname, 'images.unsplash.com', 'cdn.pixabay.com'],
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
        destination: '/',
        permanent: true,
      },
      {
        source: '/dashboard/:path*',
        destination: '/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

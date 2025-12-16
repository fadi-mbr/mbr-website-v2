import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScript errors should be fixed, not ignored
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/filippofilip95/car-logos-dataset/**',
      },
    ],
  },
};

export default nextConfig;

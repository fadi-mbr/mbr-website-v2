import { isProductionDeployment } from './src/lib/runtime-environment';
import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [...securityHeaders, ...(!isProductionDeployment() ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }] : [])],
      },
    ];
  },
};

export default nextConfig;

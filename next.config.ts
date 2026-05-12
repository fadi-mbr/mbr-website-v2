import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

// /book is embedded in the MBR Connect (Chatwoot) Dashboard App iframe.
// Modern browsers honor CSP frame-ancestors and IGNORE X-Frame-Options when both are set.
const bookFrameCsp = {
  key: 'Content-Security-Policy',
  value: "frame-ancestors 'self' https://connect.mbrme.com",
};

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/book',
        headers: [bookFrameCsp],
      },
      {
        source: '/book/:path*',
        headers: [bookFrameCsp],
      },
    ];
  },
};

export default nextConfig;

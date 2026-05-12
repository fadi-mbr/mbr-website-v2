import type { NextConfig } from "next";

/* Phase C: Content Security Policy.
 * Sources are explicit so a misconfigured third-party can't silently widen
 * the attack surface. `'unsafe-inline'` on script-src is unavoidable while
 * Next.js + the JSON-LD strategy="afterInteractive" payloads ship inline
 * <script> blobs; revisit when we move to a nonce-based CSP. */
const CSP = [
  "default-src 'self'",
  "img-src 'self' data: blob: https://*.googleusercontent.com https://*.gstatic.com https://*.google.com https://maps.googleapis.com https://connect.mbrme.com",
  "media-src 'self' https://cdn.mbrme.com",
  "script-src 'self' 'unsafe-inline' https://*.googletagmanager.com https://*.google-analytics.com https://connect.mbrme.com https://*.vercel-scripts.com",
  "connect-src 'self' https://*.google-analytics.com https://*.googleapis.com https://connect.mbrme.com wss://connect.mbrme.com",
  "frame-src 'self' https://www.google.com https://connect.mbrme.com",
  "font-src 'self' data: https://connect.mbrme.com",
  "style-src 'self' 'unsafe-inline' https://connect.mbrme.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ');

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: CSP },
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
  async redirects() {
    return [
      {
        source: '/privacy-policy',
        destination: '/privacy',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

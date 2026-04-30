import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import FloatingWhatsAppButton from "@/components/FloatingWhatsAppButton";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import ConditionalGoogleAnalytics from "@/components/ConditionalGoogleAnalytics";
import { autoRepairSchema, organizationSchema, aggregateRatingSchema } from '@/lib/structured-data';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://mbrme.com"),
  title: "Ferrari, Lamborghini & Rolls-Royce Service Dubai | MBR Auto Services",
  description: "Independent luxury workshop in Dubai. Trusted by Ferrari, Lamborghini and Rolls-Royce owners; experienced with Bentley, McLaren, Maserati, Porsche, Mercedes-Benz, BMW, Audi, Range Rover and Jaguar. Bosch-authorised, OEM-level diagnostics, genuine OEM parts. 15+ years in Al Quoz Industrial 4.",
  keywords: [
    "Ferrari service Dubai",
    "Ferrari repair Dubai",
    "Lamborghini service Dubai",
    "Lamborghini repair Dubai",
    "Rolls-Royce service Dubai",
    "Rolls Royce repair Dubai",
    "Bentley service Dubai",
    "McLaren service Dubai",
    "Maserati service Dubai",
    "Porsche service Dubai",
    "Mercedes AMG service Dubai",
    "Mercedes-Benz repair Dubai",
    "BMW M service Dubai",
    "Audi RS service Dubai",
    "Range Rover service Dubai",
    "Jaguar service Dubai",
    "luxury car service Dubai",
    "supercar mechanic Dubai",
    "exotic car service UAE",
    "independent luxury workshop Dubai",
    "Bosch authorised service center Dubai",
    "Al Quoz Industrial 4 car service",
    "ECU diagnostics Dubai luxury",
    "supercar maintenance Dubai",
    "ultra-luxury car repair UAE",
    "MBR Auto Services",
  ].join(", "),
  authors: [{ name: "MBR Auto Services" }],
  robots: "index, follow",
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || "https://mbrme.com",
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MBR Auto Services',
  },
  other: {
    'msapplication-TileColor': '#E30613',
  },
  openGraph: {
    title: "Ferrari, Lamborghini & Rolls-Royce Service Dubai | MBR Auto Services",
    description: "Independent luxury workshop in Dubai — trusted by Ferrari, Lamborghini and Rolls-Royce owners. Bosch-authorised, 15+ years in Al Quoz Industrial 4.",
    type: "website",
    locale: "en_US",
    siteName: "MBR Making Better Rides",
    images: [
      {
        url: 'https://mbrme.com/images/Logo_MBRauto_noWhite_small.png',
        width: 1200,
        height: 630,
        alt: 'MBR Auto Services — Independent luxury workshop in Dubai',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ferrari, Lamborghini & Rolls-Royce Service Dubai | MBR Auto Services",
    description: "Independent luxury workshop in Dubai. Bosch-authorised, OEM-level diagnostics, 15+ years.",
    images: ['https://mbrme.com/images/Logo_MBRauto_noWhite_small.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#E30613',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Structured Data for SEO */}
        <Script
          id="auto-repair-schema"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(autoRepairSchema)
          }}
        />
        <Script
          id="organization-schema"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema)
          }}
        />
        <Script
          id="aggregate-rating-schema"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(aggregateRatingSchema)
          }}
        />
        {children}
        <FloatingWhatsAppButton />
        <CookieConsentBanner />
        <ConditionalGoogleAnalytics />
        <Analytics />
      </body>
    </html>
  );
}

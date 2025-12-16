import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from 'next/script';
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
  title: "Premium Car Repair Dubai | Luxury Auto Service UAE | MBR Auto Services",
  description: "Expert luxury car repair & premium auto service in Dubai, UAE. 15+ years experience servicing Mercedes, BMW, Audi, Porsche & all premium brands. Bosch authorized service center in Al Quoz. Expert technicians, genuine parts, warranty coverage.",
  keywords: "luxury car repair Dubai, premium car service UAE, Mercedes repair Dubai, BMW service Dubai, Audi maintenance Dubai, Porsche service Dubai, Range Rover repair Dubai, Lexus service Dubai, luxury auto service Dubai, premium car maintenance UAE, car service Al Quoz, auto repair Dubai, Bosch service center Dubai, luxury car diagnostics Dubai, premium vehicle repair UAE, Mercedes mechanic Dubai, BMW service center Dubai, Audi repair shop Dubai, Porsche maintenance Dubai, luxury car electrical repair Dubai, premium car suspension service Dubai, expert car mechanic Dubai, certified auto service Dubai, 15 years experience car repair Dubai, best luxury car service Dubai",
  authors: [{ name: "MBR Auto Services" }],
  robots: "index, follow",
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || "https://mbrme.com",
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: "Premium Car Repair Dubai | Luxury Auto Service UAE | MBR Auto Services",
    description: "Expert luxury car repair & premium auto service in Dubai, UAE. 15+ years experience servicing Mercedes, BMW, Audi, Porsche & all premium brands. Bosch authorized service center in Al Quoz.",
    type: "website",
    locale: "en_US",
    siteName: "MBR Making Better Rides",
    images: [
      {
        url: 'https://mbrme.com/images/Logo_MBRauto_noWhite_small.png',
        width: 1200,
        height: 630,
        alt: 'MBR Making Better Rides - Premium Car Repair Dubai',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Premium Car Repair Dubai | Luxury Auto Service UAE | MBR Auto Services",
    description: "Expert luxury car repair & premium auto service in Dubai, UAE. 15+ years experience servicing Mercedes, BMW, Audi, Porsche & all premium brands.",
    images: ['https://mbrme.com/images/Logo_MBRauto_noWhite_small.png'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
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
      </body>
    </html>
  );
}

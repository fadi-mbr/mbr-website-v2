import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from '@next/third-parties/google';
import FloatingWhatsAppButton from "@/components/FloatingWhatsAppButton";
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
  title: "MBR Making Better Rides",
  description: "Professional automotive services in Dubai. 15+ years experience, Bosch authorized service, expert technicians. Mechanical repairs, electrical diagnostics, suspension & maintenance.",
  keywords: "car service Dubai, automotive repair, Bosch service center, car maintenance Dubai, auto repair Al Quoz, vehicle diagnostics",
  authors: [{ name: "MBR Auto Services" }],
  robots: "index, follow",
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
    title: "MBR Making Better Rides - Premium Car Care in Dubai",
    description: "Professional automotive services with 15+ years experience. Expert technicians, Bosch authorized service center in Al Quoz, Dubai.",
    type: "website",
    locale: "en_US",
    siteName: "MBR Making Better Rides",
    images: [
      {
        url: '/images/Logo_MBRauto_noWhite_small.png',
        width: 1200,
        height: 630,
        alt: 'MBR Making Better Rides Logo',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MBR Making Better Rides - Premium Car Care in Dubai",
    description: "Professional automotive services with 15+ years experience in Dubai.",
    images: ['/images/Logo_MBRauto_noWhite_small.png'],
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
        {children}
        <FloatingWhatsAppButton />
        <GoogleAnalytics gaId="G-C3F0YSMRPM" />
      </body>
    </html>
  );
}

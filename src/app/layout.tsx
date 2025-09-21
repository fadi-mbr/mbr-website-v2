import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from '@next/third-parties/google';
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
  title: "MBR Auto Services - Premium Car Care in Dubai | Expert Automotive Service",
  description: "Professional automotive services in Dubai. 15+ years experience, Bosch authorized service, expert technicians. Mechanical repairs, electrical diagnostics, suspension & maintenance.",
  keywords: "car service Dubai, automotive repair, Bosch service center, car maintenance Dubai, auto repair Al Quoz, vehicle diagnostics",
  authors: [{ name: "MBR Auto Services" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  openGraph: {
    title: "MBR Auto Services - Premium Car Care in Dubai",
    description: "Professional automotive services with 15+ years experience. Expert technicians, Bosch authorized service center in Al Quoz, Dubai.",
    type: "website",
    locale: "en_US",
    siteName: "MBR Auto Services",
  },
  twitter: {
    card: "summary_large_image",
    title: "MBR Auto Services - Premium Car Care in Dubai",
    description: "Professional automotive services with 15+ years experience in Dubai.",
  },
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
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!} />
      </body>
    </html>
  );
}

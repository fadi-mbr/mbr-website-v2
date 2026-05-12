import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Booking FAQ — MBR Auto Services',
  description:
    'Frequently asked questions about booking a service at MBR Auto Services in Al Quoz, Dubai — how online booking works, services, payment, rescheduling, and privacy.',
  alternates: {
    canonical: 'https://mbrme.com/book/faq',
  },
  robots: { index: true, follow: true },
};

export default function BookingFaqLayout({ children }: { children: ReactNode }) {
  return children;
}

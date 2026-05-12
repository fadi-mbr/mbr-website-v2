/**
 * /book-v2-preview — temporary visual + a11y preview for the v2 booking form.
 *
 * Renders <BookingForm mode="public" /> with services fetched server-side
 * from the existing `/api/booking/services`. Submit is a no-op in this
 * preview (logs to console + fake-success state) — the real wiring lands
 * in PR C (agent) and PR D (public).
 *
 * This route is deleted in PR E.
 */

import type { Metadata } from 'next';
import BookingForm from '@/components/booking/BookingForm';
import type { BookingService } from '@/lib/booking-types';

export const metadata: Metadata = {
  title: 'Booking preview — MBR',
  robots: { index: false, follow: false },
};

// Force dynamic so the route doesn't try to pre-render at build time when
// the ARC services endpoint isn't reachable. We still fetch on the server,
// just at request time.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function loadServices(): Promise<BookingService[]> {
  // Pull from the request host when available so we hit the same Vercel
  // deployment we're running on. Locally falls back to localhost:3000.
  // Wrap in try/catch — a missing ARC backend should not 500 the preview.
  try {
    const host = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const r = await fetch(`${host}/api/booking/services`, {
      cache: 'no-store',
    });
    if (!r.ok) return [];
    return (await r.json()) as BookingService[];
  } catch {
    return [];
  }
}

export default async function BookV2PreviewPage() {
  const services = await loadServices();
  return <BookingForm mode="public" services={services} />;
}

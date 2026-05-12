/**
 * /book — public booking page (v2).
 *
 * Replaces the old multi-step wizard. Renders the single-screen
 * <BookingForm mode="public" /> with a Server Action that POSTs the
 * payload to `/api/booking/request`. The API signs a magic-link token and
 * emails the customer; the form's success state tells them to check their
 * inbox.
 *
 * Robots: indexable (flipped to public in PR E, 2026-05-12).
 */

import type { Metadata } from 'next';
import BookingForm from '@/components/booking/BookingForm';
import type { BookingService } from '@/lib/booking-types';
import type {
  BookingSubmitPayload,
  ServerActionResult,
} from '@/components/booking/BookingFormClient';

export const metadata: Metadata = {
  title: 'Book Service — MBR Auto Services',
  description:
    'Book your luxury or exotic-car service at MBR Auto Services in Al Quoz, Dubai. Pick a service, pick a slot, and we will email you a confirmation link.',
  alternates: {
    canonical: 'https://mbrme.com/book',
  },
  robots: { index: true, follow: true },
};

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function deriveBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '');
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NODE_ENV === 'production') return 'https://mbrme.com';
  return 'http://localhost:3000';
}

async function loadServices(baseUrl: string): Promise<BookingService[]> {
  try {
    const r = await fetch(`${baseUrl}/api/booking/services`, {
      cache: 'no-store',
    });
    if (!r.ok) return [];
    return (await r.json()) as BookingService[];
  } catch {
    return [];
  }
}

export default async function BookPage() {
  const baseUrl = deriveBaseUrl();
  const services = await loadServices(baseUrl);

  // Server Action — POSTs to /api/booking/request. Returns the same
  // discriminated `ServerActionResult` the form expects. For the public
  // path the success branch is `{ ok: true, pending: true, message }`.
  async function publicSubmit(
    payload: BookingSubmitPayload,
  ): Promise<ServerActionResult> {
    'use server';
    const actionBaseUrl = deriveBaseUrl();
    try {
      const res = await fetch(`${actionBaseUrl}/api/booking/request`, {
        method: 'POST',
        cache: 'no-store',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (res.ok && data.ok === true) {
        return {
          ok: true,
          pending: true,
          message:
            typeof data.message === 'string'
              ? data.message
              : 'Check your email for the confirmation link.',
        };
      }
      return {
        ok: false,
        code: typeof data.code === 'string' ? data.code : undefined,
        message:
          typeof data.message === 'string'
            ? data.message
            : `Booking failed (HTTP ${res.status}).`,
      };
    } catch (e) {
      return {
        ok: false,
        code: 'NETWORK',
        message:
          e instanceof Error
            ? `Booking request failed: ${e.message}`
            : 'Booking request failed.',
      };
    }
  }

  return (
    <BookingForm
      mode="public"
      services={services}
      serverAction={publicSubmit}
    />
  );
}

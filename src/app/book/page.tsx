import { fetchServices } from '@/app/api/booking/_lib/arc-client';
import { headers } from 'next/headers';
import { POST as requestBooking } from '@/app/api/booking/request/route';
/**
 * /book — public booking page (v2).
 *
 * Replaces the old multi-step wizard. Renders the single-screen
 * <BookingForm mode="public" /> with a Server Action that invokes the
 * `/api/booking/request` handler directly. The API signs a magic-link token and
 * emails the customer; the form's success state tells them to check their
 * inbox.
 *
 * Robots: indexable (flipped to public in PR E, 2026-05-12).
 */

import type { Metadata } from 'next';
import BookingFormClient from '@/components/booking/BookingFormClient';
import ProfessionalNavigation from '@/components/ProfessionalNavigation';
import BookingFooter from '@/components/BookingFooter';
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

async function loadServices(): Promise<BookingService[]> {
  try {
    // Server-side calls must not loop through protected preview HTTP URLs.
    return (await fetchServices()).map(service => ({
      ...service,
      templateType: service.templateType ?? undefined,
    }));
  } catch {
    return [];
  }
}

export default async function BookPage() {
  const services = await loadServices();

  // Server Action — invokes the guarded request handler. Returns the same
  // discriminated `ServerActionResult` the form expects. For the public
  // path the success branch is `{ ok: true, pending: true, message }`.
  async function publicSubmit(
    payload: BookingSubmitPayload,
  ): Promise<ServerActionResult> {
    'use server';
    try {
      const incoming = await headers();
      // Invoke the same guarded handler inside this request; protected previews
      // reject unauthenticated HTTP self-fetches. Preserve the caller IP bucket.
      const requestHeaders = new Headers({ 'content-type': 'application/json' });
      for (const name of ['x-forwarded-for', 'x-real-ip']) {
        const value = incoming.get(name);
        if (value) requestHeaders.set(name, value);
      }
      const res = await requestBooking(new Request('http://internal.invalid/api/booking/request', {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(payload),
      }));
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
    <div className="min-h-screen bg-black text-white flex flex-col">
      <ProfessionalNavigation />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 pt-28 pb-12">
        <h1 className="text-3xl font-light mb-6">Book an appointment</h1>
        <BookingFormClient
          mode="public"
          services={services}
          serverAction={publicSubmit}
        />
      </main>
      <BookingFooter />
    </div>
  );
}

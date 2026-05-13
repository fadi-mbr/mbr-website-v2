/**
 * /book/confirm — magic-link landing for the public booking flow.
 *
 * Optimistic-UI variant: the Server Component does the cheap work
 * (signature verification) and hands off to a client component that
 * shows a spinner immediately, then POSTs the token to
 * `/api/booking/confirm` for the slow ARC submit. The customer sees
 * "Confirming your booking…" inside ~100ms instead of staring at a
 * blank page for 3-5s while the page-level ARC call ran.
 *
 * Render branches:
 *   - missing token / unconfigured secret → ErrorCard immediately
 *   - signature fails / expired / wrong version → ErrorCard immediately
 *     (no POST needed, no ARC traffic)
 *   - signature OK → <ConfirmInProgress> client component which calls
 *     `/api/booking/confirm` and swaps in the success/error card.
 */

import type { Metadata } from 'next';
import { verifyToken } from '@/lib/booking-token';
import { ConfirmInProgress } from '@/components/booking/ConfirmInProgress';
import {
  ConfirmErrorCard,
  invalidTokenCopy,
} from '@/components/booking/ConfirmErrorCard';

export const metadata: Metadata = {
  title: 'Confirm your booking — MBR Auto Services',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readToken(sp: Record<string, string | string[] | undefined>): string {
  const v = sp.token;
  if (Array.isArray(v)) return v[0] ?? '';
  return v ?? '';
}

export default async function ConfirmPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const token = readToken(sp);

  if (!token) {
    return (
      <ConfirmErrorCard
        heading="Missing token"
        body="This page must be opened from the link in your confirmation email."
      />
    );
  }

  const secret = process.env.BOOKING_TOKEN_SECRET;
  if (!secret) {
    return (
      <ConfirmErrorCard
        heading="Booking unavailable"
        body="Booking is temporarily unavailable. Please try again in a few minutes or contact us directly."
      />
    );
  }

  // Cheap pre-flight: if the signature/expiry is bad we can render the
  // error card immediately — no need to spin up the client, POST, and
  // wait for the server round-trip just to learn the link is broken.
  const verified = await verifyToken(token, secret);
  if (!verified.ok) {
    const copy = invalidTokenCopy(verified.reason);
    return <ConfirmErrorCard heading={copy.heading} body={copy.body} />;
  }

  // Signature OK — hand off to the client. The spinner mounts inside
  // ~100ms; the client POSTs the token to /api/booking/confirm which
  // runs the slow ARC submit.
  return <ConfirmInProgress token={token} />;
}

/**
 * /book/confirm — magic-link landing for the public booking flow.
 *
 * The customer arrives here from the "Confirm your booking" email. The
 * page itself does the work — there's no `/api/booking/confirm` route.
 * One HTTP round-trip, fully stateless: signature check, expiry check,
 * ARC submit, render.
 *
 * The booking intent is embedded inside the HMAC-signed token (v:2). No
 * DB / KV read — re-clicking the link will re-trigger the ARC submit,
 * which can create a duplicate booking. Advisors handle that manually
 * (decision 2026-05-12). The 30-min expiry caps the replay window.
 *
 * Render branches:
 *   - kind:ok              → success card with ICS data-URI download,
 *                            address, contact info.
 *   - kind:invalid-token   → error card keyed on `reason`. WhatsApp
 *                            fallback CTA + "Book again" link.
 *   - kind:submit-failed   → error card. Same fallback CTAs. Logs server-side.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { FaWhatsapp, FaPhone, FaCalendarAlt } from 'react-icons/fa';
import { confirmFromToken } from '@/lib/booking-confirm';
import { buildIcs } from '@/lib/booking-ics';
import { BUSINESS_HOURS } from '@/lib/business-hours';

export const metadata: Metadata = {
  title: 'Confirm your booking — MBR Auto Services',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MBR_ADDRESS = '16 8 St, Al Quoz Industrial 4, Dubai, UAE';
const MBR_WHATSAPP = '+971565015800';
const MBR_PHONE = '+971565015800';
const WHATSAPP_TEXT = encodeURIComponent(
  "Hi MBR — I'm trying to confirm a booking and the link didn't work.",
);

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readToken(sp: Record<string, string | string[] | undefined>): string {
  const v = sp.token;
  if (Array.isArray(v)) return v[0] ?? '';
  return v ?? '';
}

function formatDubai(ms: number): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dubai',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(ms));
  } catch {
    return new Date(ms).toISOString();
  }
}

/** Convert a Node UTF-8 string to a base64 data URI for inline downloads. */
function icsDataUri(content: string): string {
  const b64 = Buffer.from(content, 'utf8').toString('base64');
  return `data:text/calendar;charset=utf-8;base64,${b64}`;
}

const INVALID_REASON_COPY: Record<
  'malformed' | 'bad-signature' | 'expired' | 'bad-version',
  { heading: string; body: string }
> = {
  malformed: {
    heading: 'Invalid link',
    body: 'This confirmation link is invalid or has been tampered with. Please submit a new booking request.',
  },
  'bad-signature': {
    heading: 'Invalid link',
    body: 'This confirmation link could not be verified. Please submit a new booking request.',
  },
  expired: {
    heading: 'This link has expired',
    body: 'Confirmation links expire 30 minutes after the request. Please submit a new booking and confirm right away.',
  },
  'bad-version': {
    heading: 'Outdated link',
    body: "This link is from an older booking flow we don't support anymore. Please submit a new booking request.",
  },
};

function ErrorCard({
  heading,
  body,
  showFallback = true,
}: {
  heading: string;
  body: string;
  showFallback?: boolean;
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto max-w-[720px] px-4 py-16">
        <div className="rounded-lg border border-red-900/60 bg-neutral-950 p-6">
          <h1 className="text-2xl font-light mb-3">{heading}</h1>
          <p className="text-sm text-neutral-300 leading-relaxed mb-6">
            {body}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/book"
              className="inline-flex items-center justify-center rounded-lg px-5 py-3 bg-[#b08d57] text-black font-medium hover:bg-[#c79c63] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-[#b08d57]"
            >
              Book again
            </Link>
            {showFallback && (
              <>
                <a
                  href={`https://wa.me/${MBR_WHATSAPP.replace(/[^\d]/g, '')}?text=${WHATSAPP_TEXT}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 border border-neutral-700 text-white hover:border-[#b08d57] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b08d57]"
                >
                  <FaWhatsapp className="w-4 h-4" aria-hidden="true" />
                  Chat to book
                </a>
                <a
                  href={`tel:${MBR_PHONE}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 border border-neutral-700 text-white hover:border-[#b08d57] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b08d57]"
                >
                  <FaPhone className="w-4 h-4" aria-hidden="true" />
                  Call us
                </a>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default async function ConfirmPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const token = readToken(sp);

  if (!token) {
    return (
      <ErrorCard
        heading="Missing token"
        body="This page must be opened from the link in your confirmation email."
      />
    );
  }

  const secret = process.env.BOOKING_TOKEN_SECRET;
  if (!secret) {
    return (
      <ErrorCard
        heading="Booking unavailable"
        body="Booking is temporarily unavailable. Please try again in a few minutes or contact us directly."
      />
    );
  }

  const result = await confirmFromToken(token, secret);

  if (result.kind === 'invalid-token') {
    const copy = INVALID_REASON_COPY[result.reason];
    return <ErrorCard heading={copy.heading} body={copy.body} />;
  }

  if (result.kind === 'submit-failed') {
    let heading: string;
    let body: string;
    if (result.code === 'SLOT_TAKEN') {
      heading = 'That slot was just booked';
      body = 'Another booking landed on that time before yours. Please pick a new slot.';
    } else if (result.code === 'EXISTING_CUSTOMER') {
      heading = "We need to attach this to your existing record";
      body = result.message;
    } else if (result.code === 'PHONE_PROBLEM') {
      heading = "Phone number issue";
      body = `${result.message} You can also reach us on WhatsApp.`;
    } else {
      heading = "We couldn't create your booking";
      body = `${result.message} If this keeps happening, please reach out on WhatsApp or by phone.`;
    }
    return <ErrorCard heading={heading} body={body} />;
  }

  // ----- Success ----------------------------------------------------------
  const { intent, tokenId, arcAppointmentId, serviceName, estimatedDuration } =
    result;
  const endMs = intent.timeStartMs + estimatedDuration * 60 * 60 * 1000;
  const when = formatDubai(intent.timeStartMs);

  const icsContent = buildIcs({
    uid: `mbr-booking-${tokenId}@mbrme.com`,
    title: `MBR — ${serviceName}`,
    description:
      `Service: ${serviceName}\n` +
      `Vehicle: ${intent.vehicleYear} ${intent.vehicleMake} ${intent.vehicleModel}\n` +
      (intent.plate ? `Plate: ${intent.plate}\n` : '') +
      (intent.notes ? `Notes: ${intent.notes}\n` : ''),
    location: MBR_ADDRESS,
    startMs: intent.timeStartMs,
    endMs,
    organizerEmail: 'booking@mbrme.com',
  });
  const icsHref = icsDataUri(icsContent);
  const icsFilename = `mbr-booking-${tokenId.slice(0, 8)}.ics`;

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto max-w-[720px] px-4 py-16">
        <div className="rounded-lg border border-[#b08d57]/40 bg-neutral-950 p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-[#b08d57] mb-2">
            Booking confirmed
          </p>
          <h1 className="text-2xl font-light mb-4">
            We&apos;ll see you on{' '}
            <span className="text-[#b08d57]">{when}</span>.
          </h1>
          <p className="text-sm text-neutral-300 leading-relaxed mb-6">
            Hi {intent.firstName}, your booking for{' '}
            <strong className="text-white">{serviceName}</strong> is in our
            calendar.
            {arcAppointmentId !== undefined && (
              <>
                {' '}Reference{' '}
                <span className="font-mono text-[#b08d57]">
                  #{arcAppointmentId}
                </span>
                .
              </>
            )}
          </p>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm border-t border-neutral-800 pt-4 mb-6">
            <div>
              <dt className="text-xs uppercase tracking-wide text-neutral-500">
                Vehicle
              </dt>
              <dd className="text-white">
                {intent.vehicleYear} {intent.vehicleMake} {intent.vehicleModel}
                {intent.plate && (
                  <span className="text-neutral-400"> · {intent.plate}</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-neutral-500">
                Duration
              </dt>
              <dd className="text-white">
                {estimatedDuration === 1
                  ? '1 hour'
                  : `${estimatedDuration} hours`}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-neutral-500">
                Location
              </dt>
              <dd className="text-white">{MBR_ADDRESS}</dd>
            </div>
          </dl>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <a
              href={icsHref}
              download={icsFilename}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 bg-[#b08d57] text-black font-medium hover:bg-[#c79c63] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-[#b08d57]"
            >
              <FaCalendarAlt className="w-4 h-4" aria-hidden="true" />
              Add to calendar (.ics)
            </a>
            <a
              href={`https://wa.me/${MBR_WHATSAPP.replace(/[^\d]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 border border-neutral-700 text-white hover:border-[#b08d57] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b08d57]"
            >
              <FaWhatsapp className="w-4 h-4" aria-hidden="true" />
              Message us
            </a>
          </div>

          <p className="text-xs text-neutral-500 leading-relaxed">
            Need to change or cancel? Reply to the WhatsApp thread or call{' '}
            <a
              href={`tel:${MBR_PHONE}`}
              className="text-[#b08d57] hover:text-white"
            >
              {MBR_PHONE}
            </a>
            . Our hours: {BUSINESS_HOURS.displayDayRange},{' '}
            {BUSINESS_HOURS.displayHours}.
          </p>
        </div>
      </main>
    </div>
  );
}

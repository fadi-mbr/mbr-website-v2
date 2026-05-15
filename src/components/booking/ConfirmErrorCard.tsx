/**
 * Error card for the `/book/confirm` flow.
 *
 * Renders identical markup whether the failure surfaced server-side
 * (no token, no signing secret) or client-side (after the POST to
 * `/api/booking/confirm` returned `kind: 'invalid-token'` or
 * `kind: 'submit-failed'`). The page used to inline this — extracted
 * here so the client component can render the same card after the
 * spinner resolves.
 */

import Link from 'next/link';
import { FaWhatsapp, FaPhone } from 'react-icons/fa';

export const MBR_WHATSAPP = '+971565015800';
export const MBR_PHONE = '+971565015800';
const WHATSAPP_TEXT = encodeURIComponent(
  "Hi MBR — I'm trying to confirm a booking and the link didn't work.",
);

export interface ConfirmErrorCardProps {
  heading: string;
  body: string;
  showFallback?: boolean;
}

export function ConfirmErrorCard({
  heading,
  body,
  showFallback = true,
}: ConfirmErrorCardProps) {
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
              className="inline-flex items-center justify-center rounded-lg px-5 py-3 bg-[#E30613] text-black font-medium hover:bg-[#FF1A2E] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-[#E30613]"
            >
              Book again
            </Link>
            {showFallback && (
              <>
                <a
                  href={`https://wa.me/${MBR_WHATSAPP.replace(/[^\d]/g, '')}?text=${WHATSAPP_TEXT}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 border border-neutral-700 text-white hover:border-[#E30613] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E30613]"
                >
                  <FaWhatsapp className="w-4 h-4" aria-hidden="true" />
                  Chat to book
                </a>
                <a
                  href={`tel:${MBR_PHONE}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 border border-neutral-700 text-white hover:border-[#E30613] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E30613]"
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

export function invalidTokenCopy(
  reason: 'malformed' | 'bad-signature' | 'expired' | 'bad-version',
): { heading: string; body: string } {
  return INVALID_REASON_COPY[reason];
}

export function submitFailedCopy(
  code: string,
  message: string,
): { heading: string; body: string } {
  if (code === 'SLOT_TAKEN') {
    return {
      heading: 'That slot was just booked',
      body: 'Another booking landed on that time before yours. Please pick a new slot.',
    };
  }
  if (code === 'SLOT_UNAVAILABLE') {
    return { heading: "That time isn't actually open", body: message };
  }
  if (code === 'EXISTING_CUSTOMER') {
    return {
      heading: 'We need to attach this to your existing record',
      body: message,
    };
  }
  if (code === 'PHONE_PROBLEM') {
    return {
      heading: 'Phone number issue',
      body: `${message} You can also reach us on WhatsApp.`,
    };
  }
  return {
    heading: "We couldn't create your booking",
    body: `${message} If this keeps happening, please reach out on WhatsApp or by phone.`,
  };
}

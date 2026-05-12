import type { Metadata } from 'next';
import Link from 'next/link';
import { FaWhatsapp, FaPhone } from 'react-icons/fa';
import { BUSINESS_HOURS } from '@/lib/business-hours';
import BookingWizardClient from '@/components/booking/BookingWizardClient';
import './booking.css';

/**
 * /book — multi-step booking wizard.
 *
 * Modes:
 *   - Default (no `?embed`): full page with eyebrow, headline, WhatsApp/Call
 *     fallback CTAs, and a working-hours footnote.
 *   - Embed (`?embed=1`):    just the wizard, transparent body bg, no chrome.
 *     This is what loads inside the Chatwoot Dashboard App iframe at
 *     connect.mbrme.com → "MBR Booking".
 *
 * Magic-link entry: `/book?phone=971501234567&name=Faisal&conversation_id=42`
 * pre-fills the Details step (read client-side by the wizard). Validation
 * still runs server-side, so the worst a tampered link can do is fill out
 * a booking on the named customer's behalf — which the rate-limiter caps
 * at 1/hour and the customer sees confirmation of anyway. See
 * src/lib/embed-mode.ts for the rationale.
 */

export const metadata: Metadata = {
  title: 'Book Service — MBR Auto Services',
  description:
    'Book your luxury or exotic-car service at MBR Auto Services in Al Quoz, Dubai. Pick a service, pick a slot, and we will confirm right away.',
  alternates: {
    canonical: 'https://mbrme.com/book',
  },
  robots: {
    // Embed-mode views shouldn't be indexed, but the canonical page should be.
    // Keep `index, follow` on the metadata level; the embed view is reached
    // via query string so search engines won't surface it directly.
    index: true,
    follow: true,
  },
};

interface PageProps {
  // Next.js 15: searchParams is a Promise. We resolve it before checking flags.
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readEmbedFlag(sp: Record<string, string | string[] | undefined>): boolean {
  const v = sp.embed;
  const s = Array.isArray(v) ? v[0] : v;
  return s === '1' || s === 'true';
}

export default async function BookPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const embed = readEmbedFlag(sp);

  if (embed) {
    return (
      <main className="booking-embed-root">
        <BookingWizardClient />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="section-padding">
        <div className="container-luxury max-w-4xl">
          {/* Eyebrow */}
          <p className="text-eyebrow mb-5">
            Book Your Service
          </p>

          {/* Headline */}
          <h1 className="text-display font-light gradient-text mb-6 leading-tight">
            Book your service.
          </h1>

          <p className="text-subheading text-[var(--text-body)] max-w-2xl leading-relaxed mb-10">
            Pick a service, choose a slot, and we&apos;ll confirm right away.
            Prefer to chat? The buttons below open WhatsApp or place a call —
            both reach our team instantly during working hours.
          </p>

          {/* Fallback CTAs — kept above the wizard so users who don't want
              to use the form can still reach us in one tap. */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <a
              href="https://wa.me/+971565015800?text=Hello%20MBR%2C%20I%27d%20like%20to%20book%20a%20service%20appointment."
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-glass-btn liquid-glass-btn-secondary inline-flex items-center justify-center gap-3"
            >
              <FaWhatsapp className="w-5 h-5" aria-hidden="true" />
              <span>Chat to book</span>
            </a>
            <a
              href="tel:+971565015800"
              className="liquid-glass-btn liquid-glass-btn-secondary inline-flex items-center justify-center gap-3"
            >
              <FaPhone className="w-4 h-4" aria-hidden="true" />
              <span>Call +971 56 501 5800</span>
            </a>
          </div>

          {/* Wizard mount — the multi-step booking flow lives here.
              <section data-booking-mount> is the slot the contract names. */}
          <section
            data-booking-mount
            className="glass-card-premium p-6 md:p-10"
            aria-label="Online booking form"
          >
            <BookingWizardClient />
          </section>

          {/* Working hours footnote */}
          <div className="mt-12 pt-8 border-t border-white/5 text-sm text-[var(--text-muted)] leading-relaxed">
            <p>
              <span className="text-white">{BUSINESS_HOURS.displayDayRange}</span>
              {' · '}
              {BUSINESS_HOURS.displayHours}
              {' · '}
              {BUSINESS_HOURS.closedNote}
            </p>
            <p className="mt-3">
              16 8 St Al Quoz Industrial 4, Dubai, UAE ·{' '}
              <Link href="/#contact" className="text-accent-bronze hover:text-white transition-colors">
                Get directions
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

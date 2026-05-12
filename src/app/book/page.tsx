import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FaWhatsapp, FaPhone } from 'react-icons/fa';
import { BUSINESS_HOURS } from '@/lib/business-hours';
import './booking.css';

/**
 * /book — multi-step booking wizard.
 *
 * The page itself is server-rendered (good for LCP + SEO chrome). The
 * wizard is a client component, lazy-loaded so we don't ship the
 * date/slot/form logic until the user actually lands here.
 *
 * The WhatsApp + Call CTAs at the top are intentional fallback paths —
 * keep them visible so users who don't want to fill the form can reach
 * us instantly.
 */
const BookingWizard = dynamic(
  () => import('@/components/booking/BookingWizard'),
  {
    loading: () => (
      <div className="booking-loading" role="status" aria-live="polite">
        <span className="booking-spinner" aria-hidden="true" />
        <span>Loading booking…</span>
      </div>
    ),
    ssr: false,
  },
);

export const metadata: Metadata = {
  title: 'Book Service — MBR Auto Services',
  description:
    'Book your luxury or exotic-car service at MBR Auto Services in Al Quoz, Dubai. Pick a service, pick a slot, and we will confirm right away.',
  alternates: {
    canonical: 'https://mbrme.com/book',
  },
};

export default function BookPage() {
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
            <BookingWizard />
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

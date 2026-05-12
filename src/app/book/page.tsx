import type { Metadata } from 'next';
import Link from 'next/link';
import { FaWhatsapp, FaPhone, FaCalendarAlt } from 'react-icons/fa';
import { BUSINESS_HOURS } from '@/lib/business-hours';

export const metadata: Metadata = {
  title: 'Book Service — MBR Auto Services',
  description:
    'Book your luxury or exotic-car service at MBR Auto Services in Al Quoz, Dubai. Online booking opens soon — chat with us or call to confirm a slot.',
  // Keep the placeholder out of search results until the real booking
  // experience lands. Re-enable when the booking widget ships.
  robots: { index: false, follow: false },
};

export default function BookPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="section-padding">
        <div className="container-luxury max-w-4xl">
          {/* Eyebrow */}
          <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-accent-bronze mb-5">
            Book Your Service
          </p>

          {/* Headline */}
          <h1 className="text-display font-light gradient-text mb-6 leading-tight">
            Online booking opens soon.
          </h1>

          <p className="text-subheading text-[var(--text-body)] max-w-2xl leading-relaxed mb-12">
            We&apos;re finishing the new booking experience right now. In the
            meantime, our team confirms appointments directly — usually within
            minutes during working hours.
          </p>

          {/* Primary CTAs — Chat / Call */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <a
              href="https://wa.me/+971565015800?text=Hello%20MBR%2C%20I%27d%20like%20to%20book%20a%20service%20appointment."
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-glass-btn liquid-glass-btn-primary inline-flex items-center justify-center gap-3"
            >
              <FaWhatsapp className="w-5 h-5" />
              <span>Chat to book</span>
            </a>
            <a
              href="tel:+971565015800"
              className="liquid-glass-btn liquid-glass-btn-secondary inline-flex items-center justify-center gap-3"
            >
              <FaPhone className="w-4 h-4" />
              <span>Call +971 56 501 5800</span>
            </a>
          </div>

          {/*
            Future booking experience mounts here. The other Claude session
            handling the booking system should render its widget/form into
            <section data-booking-mount>. Until then, the section renders as
            a soft "coming soon" card so the page doesn't feel empty.
          */}
          <section
            data-booking-mount
            className="glass-card p-10 md:p-12 text-center"
            aria-label="Booking widget — placeholder"
          >
            <FaCalendarAlt className="w-10 h-10 text-accent-bronze mx-auto mb-5 opacity-90" />
            <h2 className="text-heading font-light text-white mb-3">
              Direct online booking — coming soon
            </h2>
            <p className="text-body text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
              Pick a service, choose a slot, get an instant confirmation.
              We&apos;re currently building the calendar integration with our
              workshop. Until it ships, the fastest path is a quick chat or
              call — most appointments are confirmed the same day.
            </p>
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

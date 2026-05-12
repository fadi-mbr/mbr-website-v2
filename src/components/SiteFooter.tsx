import Link from 'next/link';
import Image from 'next/image';
import {
  FaInstagram,
  FaFacebook,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
} from 'react-icons/fa';
import { BUSINESS_HOURS } from '@/lib/business-hours';

const buildYear = new Date().getFullYear();

export default function SiteFooter() {
  return (
    <footer className="bg-[var(--surface-1)] border-t border-white/5 mt-0">
      <div className="container-luxury py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
          {/* Brand block */}
          <div className="flex flex-col items-start">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <Image
                src="/images/Logo_mark.svg"
                alt="MBR"
                width={32}
                height={34}
                className="opacity-90 group-hover:opacity-100 transition-opacity"
              />
              <span className="text-white text-lg tracking-[0.18em] uppercase font-light">
                MBR Auto
              </span>
            </Link>
            <p className="mt-5 text-sm leading-relaxed text-[var(--text-muted)] max-w-xs">
              Independent luxury & exotic-car workshop in Dubai. Ferrari,
              Lamborghini and Rolls-Royce owners trust us with their cars.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://www.instagram.com/mbr.auto/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="MBR on Instagram"
                className="w-9 h-9 rounded-full flex items-center justify-center border border-white/10 text-[var(--text-muted)] hover:text-white hover:border-white/30 transition-colors"
              >
                <FaInstagram className="w-4 h-4" />
              </a>
              <a
                href="https://www.facebook.com/mbrautoservices/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="MBR on Facebook"
                className="w-9 h-9 rounded-full flex items-center justify-center border border-white/10 text-[var(--text-muted)] hover:text-white hover:border-white/30 transition-colors"
              >
                <FaFacebook className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/+971565015800?text=Hello%20MBR,%20I%20need%20automotive%20service"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="MBR on WhatsApp"
                className="w-9 h-9 rounded-full flex items-center justify-center border border-white/10 text-[var(--text-muted)] hover:text-white hover:border-white/30 transition-colors"
              >
                <FaWhatsapp className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <nav aria-label="Footer navigation">
            <h2 className="text-xs uppercase tracking-[0.3em] text-accent-bronze mb-5">
              Explore
            </h2>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/#services" className="text-[var(--text-body)] hover:text-white transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/#reviews" className="text-[var(--text-body)] hover:text-white transition-colors">
                  Reviews
                </Link>
              </li>
              <li>
                <Link href="/#about" className="text-[var(--text-body)] hover:text-white transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="text-[var(--text-body)] hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li className="pt-3 mt-3 border-t border-white/5">
                <Link href="/privacy" className="text-[var(--text-muted)] hover:text-white transition-colors text-xs">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="text-[var(--text-muted)] hover:text-white transition-colors text-xs">
                  Cookies
                </Link>
              </li>
              <li>
                <Link href="/integrations-terms" className="text-[var(--text-muted)] hover:text-white transition-colors text-xs">
                  Integrations Terms
                </Link>
              </li>
            </ul>
          </nav>

          {/* Contact stub */}
          <div>
            <h2 className="text-xs uppercase tracking-[0.3em] text-accent-bronze mb-5">
              Visit
            </h2>
            <ul className="space-y-3 text-sm text-[var(--text-body)]">
              <li className="flex items-start gap-3">
                <FaMapMarkerAlt className="w-4 h-4 mt-1 text-[var(--text-muted)] flex-shrink-0" />
                <a
                  href="https://maps.app.goo.gl/gj9EXG4uchRBtZcE6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  16 8 St Al Quoz Industrial 4<br />Dubai, UAE
                </a>
              </li>
              <li className="flex items-start gap-3">
                <FaPhone className="w-4 h-4 mt-1 text-[var(--text-muted)] flex-shrink-0" />
                <a href="tel:+971565015800" className="hover:text-white transition-colors">
                  +971 56 501 5800
                </a>
              </li>
              <li className="flex items-start gap-3">
                <FaEnvelope className="w-4 h-4 mt-1 text-[var(--text-muted)] flex-shrink-0" />
                <a href="mailto:info@mbrme.com" className="hover:text-white transition-colors">
                  info@mbrme.com
                </a>
              </li>
              <li className="pt-3 mt-3 border-t border-white/5 text-xs text-[var(--text-muted)]">
                {BUSINESS_HOURS.displayDayRange} · {BUSINESS_HOURS.displayHours}<br />
                <span>{BUSINESS_HOURS.closedNote}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright row */}
        <div className="mt-14 pt-8 border-t border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-[var(--text-subtle)]">
          <div>
            © {buildYear} MBR Auto Services. All rights reserved.
          </div>
          <div className="tracking-[0.3em] uppercase">
            Making Better Rides
          </div>
        </div>
      </div>
    </footer>
  );
}

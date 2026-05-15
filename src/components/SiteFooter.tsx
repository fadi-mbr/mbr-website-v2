"use client";

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
import { triggerChat } from '@/lib/chat-cta';

const buildYear = new Date().getFullYear();

export default function SiteFooter() {
  return (
    <footer className="bg-[var(--surface-1)] border-t border-white/5 mt-0">
      {/* Final CTA row — Phase B addition. Closes the page with the same
          primary action the hero opens with. Bronze rule above/below
          gives the band a deliberate "this is the last move" feel. */}
      <div className="border-b border-white/5">
        <div className="container-luxury py-14 md:py-16 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <p className="text-eyebrow mb-3">Ready when you are</p>
            <p className="text-2xl md:text-3xl text-white font-light tracking-tight">
              The keys are yours.<br className="md:hidden" />
              <span className="hidden md:inline"> </span>
              The next move is ours.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => triggerChat('footer_final_cta')}
              className="liquid-glass-btn liquid-glass-btn-primary inline-flex items-center justify-center gap-3"
            >
              <FaWhatsapp className="w-5 h-5" />
              <span>Chat with us</span>
            </button>
            <Link
              href="/book"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm tracking-wide text-[var(--text-body)] hover:text-white border border-[var(--accent-bronze)]/40 hover:border-[var(--accent-bronze)] hover:bg-[var(--accent-bronze)]/10 transition-all duration-300"
            >
              <span>Book Directly</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="container-luxury py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
          {/* Brand block */}
          <div className="flex flex-col items-start">
            <Link href="/" className="inline-flex items-center group" aria-label="MBR Auto Services L.L.C.">
              <Image
                src="/images/MBR_Logo_horizontal.svg"
                alt="MBR Auto Services L.L.C."
                width={260}
                height={70}
                className="h-12 md:h-14 w-auto opacity-95 group-hover:opacity-100 transition-opacity"
              />
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
                <Link href="/about" className="text-[var(--text-body)] hover:text-white transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/workshop" className="text-[var(--text-body)] hover:text-white transition-colors">
                  Workshop
                </Link>
              </li>
              <li>
                <Link href="/#services" className="text-[var(--text-body)] hover:text-white transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/#why-mbr" className="text-[var(--text-body)] hover:text-white transition-colors">
                  Why MBR
                </Link>
              </li>
              <li>
                <Link href="/#reviews" className="text-[var(--text-body)] hover:text-white transition-colors">
                  Reviews
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

          {/* Contact + visit stub. Now includes a small workshop
              thumbnail anchored to Google Maps — a concrete visual at
              the end of the page reminding the visitor where we are. */}
          <div>
            <h2 className="text-xs uppercase tracking-[0.3em] text-accent-bronze mb-5">
              Visit
            </h2>

            {/* Workshop thumbnail → Maps */}
            <a
              href="https://maps.app.goo.gl/gj9EXG4uchRBtZcE6"
              target="_blank"
              rel="noopener noreferrer"
              className="group block relative overflow-hidden rounded-2xl border border-white/10 hover:border-[var(--accent-bronze)]/50 transition-colors duration-300 mb-5"
              aria-label="Open MBR Auto Services in Google Maps"
            >
              <div className="relative aspect-[16/9]">
                <Image
                  src="/images/hero-poster.jpg"
                  alt="MBR workshop. Al Quoz Industrial 4, Dubai"
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.75) 100%)',
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between gap-3">
                  <div className="text-white">
                    <p className="text-eyebrow text-[var(--accent-bronze)] mb-1">
                      Al Quoz Industrial 4
                    </p>
                    <p className="text-sm font-light tracking-tight">
                      Get directions →
                    </p>
                  </div>
                  <FaMapMarkerAlt className="w-4 h-4 text-white/80 flex-shrink-0" />
                </div>
              </div>
            </a>

            <ul className="space-y-3 text-sm text-[var(--text-body)]">
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

        {/* Copyright row — tagline upgraded to the brand voice (911Porsche
            via .font-marque), larger and centred. Was previously a tiny
            tail-end string easy to miss. */}
        <div className="mt-14 pt-8 border-t border-white/5">
          <div className="text-center mb-6">
            <p
              className="font-marque text-[var(--accent-bronze)] text-sm md:text-base tracking-[0.35em]"
              style={{ letterSpacing: '0.35em' }}
            >
              Making Better Rides
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-3 text-xs text-[var(--text-subtle)]">
            <div>
              © {buildYear} MBR Auto Services. All rights reserved.
            </div>
            <div className="tracking-wide">
              Al Quoz Industrial 4 · Dubai · UAE
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

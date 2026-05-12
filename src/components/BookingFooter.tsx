/**
 * BookingFooter — compact site footer used on the public /book page.
 *
 * Intentionally minimal vs. the homepage's <ContactSection>: this is a
 * single-row grid (contact | hours | links) that gives the booking form
 * just enough context (address, phone, hours) without competing with the
 * form itself.
 *
 * Not used on /book/agent (Chatwoot iframe surface) or /book/confirm
 * (system-response landing page) — both stay bare.
 */

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BUSINESS_HOURS } from '@/lib/business-hours';

export default function BookingFooter() {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-950 text-neutral-400">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
          {/* Contact */}
          <div>
            <Image
              src="/images/Logo_horizontal.svg"
              alt="MBR Making Better Rides"
              width={140}
              height={45}
              className="h-7 w-auto opacity-90 mb-3"
            />
            <p className="text-xs text-neutral-500 mb-3">
              Premium auto service, Dubai.
            </p>
            <address className="not-italic text-xs leading-relaxed">
              <p>16 8 St Al Qouz Ind.fourth, Al Quoz, Dubai</p>
              <p className="mt-2">
                <a
                  href="tel:+971565015800"
                  className="hover:text-[#b08d57] transition-colors"
                >
                  +971 56 501 5800
                </a>
                <span className="mx-2 text-neutral-700">·</span>
                <a
                  href="https://wa.me/+971565015800?text=Hello%20MBR"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#b08d57] transition-colors"
                >
                  WhatsApp
                </a>
              </p>
            </address>
          </div>

          {/* Hours */}
          <div>
            <h3 className="text-xs uppercase tracking-wide text-[#b08d57] mb-2">
              Working hours
            </h3>
            <p className="text-xs leading-relaxed">
              {BUSINESS_HOURS.displayDayRange},{' '}
              {BUSINESS_HOURS.displayHours}
            </p>
            <p className="text-xs leading-relaxed mt-1 text-neutral-500">
              {BUSINESS_HOURS.closedNote}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-xs uppercase tracking-wide text-[#b08d57] mb-2">
              Legal
            </h3>
            <ul className="space-y-1 text-xs">
              <li>
                <Link
                  href="/privacy-policy"
                  className="hover:text-[#b08d57] transition-colors"
                >
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link
                  href="/cookie-policy"
                  className="hover:text-[#b08d57] transition-colors"
                >
                  Cookie policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-neutral-900 text-xs text-neutral-600">
          © MBR Auto Services
        </div>
      </div>
    </footer>
  );
}

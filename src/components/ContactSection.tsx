"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaPhone,
  FaWhatsapp,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaInstagram,
  FaFacebook,
} from 'react-icons/fa';
import { HiOutlineChatBubbleLeftRight } from 'react-icons/hi2';
import {
  trackWhatsAppClick,
  trackPhoneCall,
  trackMapClick,
  trackSocialMediaClick,
  trackEmailClick,
} from '@/lib/analytics';
import { triggerChat, openLiveChat } from '@/lib/chat-cta';
import { BUSINESS_HOURS, getWeeklyHours } from '@/lib/business-hours';
import SectionMarker from './SectionMarker';

const WORKING_HOURS = getWeeklyHours();

interface LocationData {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  placeId: string;
  googleMapsUrl: string;
  embedUrl: string;
}

export default function ContactSection() {
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        const response = await fetch('/api/location');
        const result = await response.json();
        if (result.success && result.data) {
          setLocationData(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch location data:', error);
      }
    };
    fetchLocationData();
  }, []);

  return (
    <section
      id="contact"
      className="relative py-24 md:py-32 bg-black overflow-hidden"
    >
      <div className="container-luxury">
        <SectionMarker
          number="07"
          eyebrow="Visit"
          headline="Four ways in. One workshop."
          body="Pick whichever is fastest for you. WhatsApp and live chat reach the team instantly during working hours; phone and email are always available."
        />

        {/* Row 1 — four channels, equal width. WhatsApp keeps a green
            gradient so it reads as the warmest path, but Live Chat is
            a true peer (the Chatwoot widget already lives at app level —
            this card just gives it a real surface in the contact UI). */}
        <div className="mt-16 md:mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* WhatsApp */}
          <a
            href="https://wa.me/+971565015800?text=Hello%20MBR,%20I%20need%20automotive%20service"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsAppClick('contact_primary', 'WhatsApp')}
            className="group relative overflow-hidden rounded-2xl border border-white/10 hover:border-[var(--primary)]/50 transition-all duration-300 p-6 md:p-7"
            style={{
              background:
                'linear-gradient(135deg, rgba(34,197,94,0.10) 0%, rgba(0,0,0,0) 60%), var(--surface-2)',
            }}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
              style={{
                background: 'linear-gradient(145deg, #25D366, #128C7E)',
                boxShadow: '0 8px 20px rgba(37,211,102,0.30)',
              }}
            >
              <FaWhatsapp className="w-5 h-5 text-white" />
            </div>
            <p className="text-eyebrow mb-2">WhatsApp</p>
            <p className="text-lg md:text-xl text-white font-light leading-tight mb-1">
              +971 56 501 5800
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Quick quotes, booking, after-hours messages.
            </p>
          </a>

          {/* Live Chat — Chatwoot widget. Uses openLiveChat (not the
              generic triggerChat) so the visitor who explicitly asked
              for web chat always gets the web chat — the helper waits
              for the SDK to finish loading rather than silently routing
              to WhatsApp on a slow first paint. */}
          <button
            type="button"
            onClick={() =>
              openLiveChat('contact_section_live_chat', () => {
                // SDK never came up — fall back to a friendly nudge.
                // (Chatwoot ad-blocked or failed to load.)
                alert(
                  'Live chat is taking a moment to load. WhatsApp or call us in the meantime. Both reach the team instantly.',
                );
              })
            }
            className="group text-left relative overflow-hidden rounded-2xl border border-white/10 hover:border-[var(--primary)]/50 transition-all duration-300 p-6 md:p-7"
            style={{
              background:
                'linear-gradient(135deg, rgba(227,6,19,0.08) 0%, rgba(0,0,0,0) 60%), var(--surface-2)',
            }}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
              style={{
                background: 'linear-gradient(145deg, #1a1a1a, #0a0a0a)',
                border: '1px solid var(--primary)',
                boxShadow: '0 8px 20px rgba(227,6,19,0.20)',
              }}
            >
              <HiOutlineChatBubbleLeftRight className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <p className="text-eyebrow mb-2">Live Chat</p>
            <p className="text-lg md:text-xl text-white font-light leading-tight mb-1">
              MBR Connect
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Web chat. Replies straight to our team during working hours.
            </p>
          </button>

          {/* Call */}
          <a
            href="tel:8006272886"
            onClick={() => trackPhoneCall('contact_section', '8006272886')}
            className="group relative overflow-hidden rounded-2xl border border-white/10 hover:border-white/25 transition-colors duration-300 p-6 md:p-7 bg-[var(--surface-2)]"
          >
            <div className="w-11 h-11 rounded-full flex items-center justify-center mb-5 bg-black/40 border border-white/10">
              <FaPhone className="w-4 h-4 text-[var(--accent-bronze)]" />
            </div>
            <p className="text-eyebrow mb-2">Call</p>
            <p className="text-lg md:text-xl text-white font-light leading-tight mb-1">
              800-MBRAuto
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Toll-free within the UAE.
            </p>
          </a>

          {/* Email */}
          <a
            href="mailto:info@mbrme.com"
            onClick={() => trackEmailClick('contact_section', 'info@mbrme.com')}
            className="group relative overflow-hidden rounded-2xl border border-white/10 hover:border-white/25 transition-colors duration-300 p-6 md:p-7 bg-[var(--surface-2)]"
          >
            <div className="w-11 h-11 rounded-full flex items-center justify-center mb-5 bg-black/40 border border-white/10">
              <FaEnvelope className="w-4 h-4 text-[var(--accent-bronze)]" />
            </div>
            <p className="text-eyebrow mb-2">Email</p>
            <p className="text-lg md:text-xl text-white font-light leading-tight mb-1">
              info@mbrme.com
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Service inquiries &amp; quotes. Replies during working hours.
            </p>
          </a>
        </div>

        {/* Row 2 — Visit + Hours, 50/50 split on desktop. */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visit / Location with embedded map */}
          <div className="rounded-2xl border border-white/10 bg-[var(--surface-2)] p-6 md:p-8 flex flex-col">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-eyebrow mb-2">Visit</p>
                <p className="text-lg md:text-xl text-white font-light leading-snug">
                  16 8 St Al Quoz Industrial 4<br />
                  Dubai, UAE
                </p>
              </div>
              <FaMapMarkerAlt className="w-5 h-5 text-[var(--accent-bronze)]" />
            </div>

            <div className="aspect-video bg-black rounded-xl overflow-hidden mb-5 relative">
              {locationData ? (
                <iframe
                  src={locationData.embedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 transition-all duration-700 hover:grayscale"
                  title="MBR Auto Services location"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div
                    className="animate-spin rounded-full h-7 w-7 border-b-2"
                    style={{ borderColor: 'var(--primary)' }}
                  />
                </div>
              )}
            </div>

            <a
              href={
                locationData?.googleMapsUrl ||
                'https://maps.app.goo.gl/gj9EXG4uchRBtZcE6'
              }
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackMapClick('contact_section_map')}
              className="self-start inline-flex items-center text-eyebrow text-white border-b border-[var(--accent-bronze)] pb-1 hover:text-[var(--accent-bronze)] transition-colors"
            >
              Get directions →
            </a>
          </div>

          {/* Hours — after-hours surface promoted ABOVE the day grid */}
          <div className="rounded-2xl border border-white/10 bg-[var(--surface-2)] p-6 md:p-8 flex flex-col">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-eyebrow mb-2">Hours</p>
                <p className="text-lg md:text-xl text-white font-light leading-snug">
                  {BUSINESS_HOURS.displayDayRange}
                  <br />
                  {BUSINESS_HOURS.displayHours}
                </p>
              </div>
              <FaClock className="w-5 h-5 text-[var(--accent-bronze)]" />
            </div>

            {/* After-hours emergency — only place in this section with
                .has-shimmer. The kinetic moment in the contact card. */}
            <a
              href="https://wa.me/+971565015800?text=Hello%20MBR%2C%20I%20need%20after-hours%20assistance"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackWhatsAppClick(
                  'contact_section_emergency',
                  'After-hours WhatsApp',
                )
              }
              className="has-shimmer relative overflow-hidden rounded-xl p-5 mb-6 flex items-center gap-4 border transition-colors duration-300 hover:border-[var(--accent-bronze)]"
              style={{
                borderColor: 'rgba(165,120,66,0.35)',
                background:
                  'linear-gradient(135deg, rgba(165,120,66,0.10) 0%, rgba(165,120,66,0.02) 100%)',
              }}
            >
              <div className="flex-1 relative z-10">
                <p className="text-eyebrow text-[var(--accent-bronze)] mb-1.5">
                  After-hours · Emergency
                </p>
                <p className="text-sm text-white leading-snug">
                  Outside working hours? WhatsApp the line below. We try to
                  respond the same evening.
                </p>
              </div>
              <FaWhatsapp className="w-5 h-5 text-[var(--accent-bronze)] flex-shrink-0 relative z-10" />
            </a>

            {/* Day-by-day grid */}
            <div className="space-y-2.5 mt-auto">
              {WORKING_HOURS.map((schedule) => (
                <div
                  key={schedule.day}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-[var(--text-body)]">{schedule.day}</span>
                  <span
                    className={
                      schedule.hours === 'Closed'
                        ? 'text-[var(--text-subtle)] italic'
                        : 'text-white'
                    }
                  >
                    {schedule.hours}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Social row — minimal, no third CTA competing. */}
        <motion.div
          className="mt-16 flex justify-center items-center gap-4 motion-calm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-eyebrow text-[var(--text-subtle)]">Follow</p>
          <a
            href="https://www.instagram.com/mbr.auto/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MBR on Instagram"
            className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10 text-[var(--text-muted)] hover:text-white hover:border-white/30 transition-colors"
            onClick={() => trackSocialMediaClick('instagram', 'contact_section')}
          >
            <FaInstagram className="w-4 h-4" />
          </a>
          <a
            href="https://www.facebook.com/mbrautoservices/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MBR on Facebook"
            className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10 text-[var(--text-muted)] hover:text-white hover:border-white/30 transition-colors"
            onClick={() => trackSocialMediaClick('facebook', 'contact_section')}
          >
            <FaFacebook className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

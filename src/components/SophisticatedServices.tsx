"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  FaCalendarAlt,
  FaWhatsapp,
  FaCogs,
  FaBolt,
  FaWrench,
  FaOilCan,
} from 'react-icons/fa';
import type { IconType } from 'react-icons';
import { trackServiceClick } from '@/lib/analytics';
import { triggerChat } from '@/lib/chat-cta';
import SectionMarker from './SectionMarker';
import PremiumBrandsCarousel from './PremiumBrandsCarousel';

type ServiceSlab = {
  title: string;
  subtitle: string;
  tiers: string[];
  description: string;
  features: string[];
  image: string;
  icon: IconType;
  externalLink?: { url: string; label: string };
};

const services: ServiceSlab[] = [
  {
    title: 'Mechanical Repairs',
    subtitle: 'Engine & Transmission',
    tiers: ['Supercar', 'Ultra-Luxury', 'Luxury & Sport'],
    description:
      'Engine, transmission, clutch and brake work for Ferrari, Lamborghini, Porsche and the wider luxury lineup. Routine service to full rebuilds, carried out with OEM-level tooling and genuine parts.',
    features: [
      'Engine Diagnostics',
      'Transmission Service',
      'Brake Systems',
      'Clutch Repair',
    ],
    image: '/images/mbr_mechanic.webp',
    icon: FaCogs,
  },
  {
    title: 'Electrical & Diagnostics',
    subtitle: 'Advanced & Exotic Systems',
    tiers: ['Supercar', 'Ultra-Luxury'],
    description:
      'OEM-level diagnostic equipment for every electrical system, including the Leonardo platform purpose-built for Ferrari, Lamborghini and the wider exotic-car lineup. From battery and alternator work to deep ECU diagnostics, we read, code and repair to manufacturer-level precision.',
    features: [
      'Leonardo Exotic Diagnostics',
      'ECU Coding & Reset',
      'Battery & Alternator',
      'Wiring & Comfort Systems',
    ],
    image: '/images/mbr_electrical.webp',
    icon: FaBolt,
    externalLink: {
      url: 'https://www.leonardodiagnostictool.com/',
      label: 'About the Leonardo platform',
    },
  },
  {
    title: 'Suspension & Steering',
    subtitle: 'Precision Handling',
    tiers: ['Supercar', 'Ultra-Luxury'],
    description:
      'Air-suspension service, alignment, ride-height calibration and steering work for ultra-luxury and supercar chassis. The fine handling owners pay for, recovered and preserved.',
    features: [
      'Wheel Alignment',
      'Air Suspension',
      'Steering Systems',
      'Suspension Tuning',
    ],
    image: '/images/mbr_suspension.webp',
    icon: FaWrench,
  },
  {
    title: 'Preventive Maintenance',
    subtitle: 'Scheduled Care',
    tiers: ['Supercar', 'Ultra-Luxury', 'Luxury & Sport'],
    description:
      'Manufacturer-schedule servicing, fluid changes, AC service and pre-purchase inspections for luxury and exotic vehicles. Detailed inspections, transparent pricing, full service history.',
    features: [
      'Oil & Fluid Service',
      'AC Service',
      'Filter Replacement',
      'Pre-purchase Inspections',
    ],
    image: '/images/mbr_maintainence.webp',
    icon: FaOilCan,
  },
];

function ServiceSlabRow({
  service,
  index,
}: {
  service: ServiceSlab;
  index: number;
}) {
  const flipped = index % 2 === 1; // odd rows reverse layout
  const sourceKey = `service_card_${service.title.toLowerCase().replace(/\s+/g, '_')}`;
  const Icon = service.icon;

  return (
    <motion.article
      className="group grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      {/* Image */}
      <div
        className={`lg:col-span-7 relative overflow-hidden rounded-3xl border border-white/5 ${
          flipped ? 'lg:order-2' : ''
        }`}
      >
        <div className="relative aspect-[16/10]">
          <Image
            src={service.image}
            alt={`${service.title} — ${service.subtitle} | MBR Auto Services Dubai`}
            fill
            sizes="(min-width: 1024px) 54vw, (min-width: 768px) 90vw, 100vw"
            // Phase C perf: first slab is above-the-fold on desktop;
            // prioritise its decode. Subsequent slabs lazy-load.
            priority={index === 0}
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
          {/* Bottom gradient for caption legibility + subtle red wash from
              the trailing corner — anchors the brand without being loud. */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.65) 100%), radial-gradient(circle at 100% 100%, rgba(227,6,19,0.18) 0%, transparent 50%)',
            }}
          />

          {/* Icon medallion */}
          <div className="absolute top-6 left-6">
            <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center transition-all duration-300 group-hover:border-[var(--primary)]/60 group-hover:glow-red">
              <Icon className="w-5 h-5 text-white group-hover:text-[var(--text-brand-red)] transition-colors" />
            </div>
          </div>

          {/* Service number watermark — Fraunces serif numeral, oversized,
              subtle. Renders like a chapter mark on a photo, not a stamped
              chassis number. */}
          <div className="absolute bottom-4 right-6 font-display text-white/25 select-none text-5xl md:text-6xl font-light leading-none">
            {String(index + 1).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className={`lg:col-span-5 ${flipped ? 'lg:order-1 lg:text-right' : ''}`}
      >
        {/* Tier eyebrow */}
        <p
          className={`text-eyebrow mb-4 ${flipped ? 'lg:justify-end' : ''}`}
        >
          {service.tiers.join(' · ')}
        </p>

        {/* Title (serif) + subtitle (sans, sub-deck) */}
        <h3 className="font-display text-3xl md:text-4xl lg:text-5xl font-light text-white leading-[1.1] tracking-[-0.02em] mb-3">
          {service.title}
        </h3>
        <p className="text-xs md:text-sm uppercase text-[var(--accent-bronze)] mb-5 tracking-[0.2em] font-medium">
          {service.subtitle}
        </p>

        {/* Body */}
        <p className="text-body text-[var(--text-body)] leading-relaxed mb-6">
          {service.description}
        </p>

        {/* Feature list */}
        <ul
          className={`grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 mb-7 text-sm text-[var(--text-muted)] ${
            flipped ? 'lg:[&_li]:justify-end lg:[&_li]:flex-row-reverse' : ''
          }`}
        >
          {service.features.map((f) => (
            <li key={f} className="flex items-center gap-3">
              <span
                className="block w-1 h-1 rounded-full bg-[var(--accent-bronze)] flex-shrink-0"
                aria-hidden="true"
              />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        {/* External reference (Leonardo, etc.) */}
        {service.externalLink && (
          <a
            href={service.externalLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center text-eyebrow text-[var(--text-muted)] hover:text-white transition-colors mb-7 ${
              flipped ? 'lg:flex-row-reverse' : ''
            }`}
          >
            <span>{service.externalLink.label}</span>
            <span className={flipped ? 'mr-2' : 'ml-2'} aria-hidden="true">
              →
            </span>
          </a>
        )}

        {/* CTAs */}
        <div
          className={`flex flex-col sm:flex-row gap-3 ${
            flipped ? 'lg:justify-end' : ''
          }`}
        >
          <button
            type="button"
            className="liquid-glass-btn liquid-glass-btn-primary inline-flex items-center justify-center gap-2"
            onClick={() => {
              trackServiceClick(service.title, service.title, 'chat');
              triggerChat(
                sourceKey,
                `Hello MBR, I need ${service.title.toLowerCase()}`,
              );
            }}
          >
            <FaWhatsapp className="w-4 h-4" />
            <span>Chat with us</span>
          </button>

          <Link
            href="/book"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm tracking-wide text-[var(--text-body)] hover:text-white border border-[var(--accent-bronze)]/40 hover:border-[var(--accent-bronze)] hover:bg-[var(--accent-bronze)]/10 transition-all duration-300"
            onClick={() => trackServiceClick(service.title, service.title, 'book_link')}
          >
            <FaCalendarAlt className="w-3.5 h-3.5" />
            <span>Book Directly</span>
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

export default function SophisticatedServices() {
  // Carousel ribbon sits between slabs 2 and 3 — anchors the brand
  // hierarchy mid-section without becoming its own moment.
  const RIBBON_AFTER_INDEX = 1;

  return (
    <section
      id="services"
      className="relative py-24 md:py-32 bg-black overflow-hidden"
    >
      {/* Calm background — subtle red bloom from the lower-right only.
          Phase A removed the multi-pulse circles that competed with content. */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle at 100% 100%, rgba(227,6,19,0.05) 0%, transparent 55%)',
        }}
      />

      <div className="relative container-luxury">
        <SectionMarker
          number="02"
          eyebrow="Craft"
          headline="Workshop-grade work on every marque we touch."
          body="Engine, electrical, chassis and maintenance — performed with OEM-level diagnostics, the Leonardo exotic-car platform, and genuine OEM parts."
        />
      </div>

      {/* Alternating slabs */}
      <div className="relative container-luxury mt-20 md:mt-28 space-y-24 md:space-y-32">
        {services.map((service, i) => (
          <React.Fragment key={service.title}>
            <ServiceSlabRow service={service} index={i} />
            {i === RIBBON_AFTER_INDEX && (
              <div className="-mx-6 md:mx-0">
                <PremiumBrandsCarousel />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}

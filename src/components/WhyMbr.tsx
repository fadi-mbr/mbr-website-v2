"use client";

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaShieldAlt,
  FaCog,
  FaHandshake,
  FaMicrochip,
  FaTools,
} from 'react-icons/fa';
import SectionMarker from './SectionMarker';

/* Three editorial stats. Tabular Fraunces numerals render as a clean
 * 3-up row — better than a stretched 4-up with a hollow fourth slot. */
const STATS = [
  { value: '4.9★', label: 'Google rating' },
  { value: '5,000+', label: 'Owners trust us' },
  { value: '100%', label: 'Workmanship guarantee' },
];

const PILLARS = [
  {
    icon: FaShieldAlt,
    title: 'Independent expertise',
    body:
      'Dealership-level work without the dealership markup. The team has worked inside the same marques the dealer principals service.',
  },
  {
    icon: FaCog,
    title: 'Genuine OEM parts',
    body:
      'Every component traced to the original supplier. No aftermarket substitutions on engine, drivetrain, or safety-critical systems unless you ask.',
  },
  {
    icon: FaHandshake,
    title: 'Transparent pricing',
    body:
      'Quote first, approve before we lift a spanner. Itemised invoice covering labour, parts, consumables. No surprise lines at handover.',
  },
];

/*
 * Three credibility anchors — each rendered as a tall, centred card with
 * a prominent badge medallion at the top. With years claims gone these
 * are the proof points that carry the weight of the section.
 */
type Certification = {
  name: string;
  description: string;
  logo?: string;
  icon?: typeof FaMicrochip;
  href?: string;
};

const CERTIFICATIONS: Certification[] = [
  {
    name: 'Bosch Authorised Service',
    description:
      'Certified Bosch service centre. Diagnostic tooling and OE-spec parts straight from the supplier network that builds the parts in your car.',
    logo: '/images/Bosch_Logo24.webp',
  },
  {
    name: 'Leonardo Exotic Diagnostics',
    description:
      'OEM-grade diagnostics on Ferrari, Lamborghini and McLaren. The same toolchain factory technicians use.',
    icon: FaMicrochip,
    href: 'https://www.leonardodiagnostictool.com/',
  },
  {
    name: 'OEM-Level Tooling',
    description:
      'Genuine torque specs, factory procedures, and original-equipment parts. No shortcuts on cars that don\'t forgive them.',
    icon: FaTools,
  },
];

export default function WhyMbr() {
  return (
    <section
      id="why-mbr"
      className="relative py-24 md:py-32 bg-black overflow-hidden"
    >
      {/* Subtle red bloom in the lower-left, balanced with the Services
          section's lower-right bloom for a calm, anchored backdrop. */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle at 0% 100%, rgba(227,6,19,0.06) 0%, transparent 55%)',
        }}
      />

      <div className="relative container-luxury">
        <SectionMarker
          number="04"
          eyebrow="Why MBR"
          headline="Independent expertise on the cars Dubai cares about."
          body="An independent workshop chosen by the owners who could go anywhere. Bosch tooling, exotic-car diagnostics, and the discipline of doing things to factory spec."
        />

        {/* Stat strip — Fraunces serif tabular numerals, no card chrome,
            tight 3-up so the figures carry the editorial weight. */}
        <motion.div
          className="mt-20 md:mt-24 grid grid-cols-1 md:grid-cols-3 gap-y-12 gap-x-8 md:gap-x-12 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center motion-calm">
              <div className="text-numeric mb-3">{stat.value}</div>
              <div
                className="block h-px w-10 mx-auto mb-3"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, var(--accent-bronze), transparent)',
                }}
                aria-hidden="true"
              />
              <div className="text-eyebrow">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Pillars — what we believe. Full-width 3-up, sober card chrome
            (var(--surface-2) + white/10 border + rounded-2xl), Fraunces
            serif titles, sans body. */}
        <motion.div
          className="mt-20 md:mt-24 motion-calm"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-eyebrow mb-8 md:mb-10 text-center">What Sets Us Apart</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className="p-7 md:p-8 rounded-2xl border border-white/10 bg-[var(--surface-2)] hover:border-white/25 transition-colors duration-300"
              >
                <pillar.icon className="w-6 h-6 text-[var(--primary)] mb-5" />
                <h3 className="font-display text-xl md:text-2xl text-white font-light leading-tight tracking-[-0.01em] mb-3">
                  {pillar.title}
                </h3>
                <p className="text-sm text-[var(--text-body)] leading-relaxed">
                  {pillar.body}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Cert wall — credibility anchor. Full-width 3-up with PROMINENT
            badge medallions (3x bigger than the prior nested cards), tall
            cards, centred content. Bronze gradient surface so they read as
            "the proof" distinct from the white-bordered pillars above. */}
        <motion.div
          className="mt-20 md:mt-24"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-eyebrow mb-8 md:mb-10 text-center">
            Certifications &amp; Tooling
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {CERTIFICATIONS.map((cert) => {
              const Inner = (
                <div
                  className="group h-full flex flex-col items-center text-center p-8 md:p-9 rounded-2xl border transition-all duration-300 hover:border-[var(--accent-bronze)]"
                  style={{
                    borderColor: 'rgba(165,120,66,0.28)',
                    background:
                      'linear-gradient(180deg, rgba(165,120,66,0.10) 0%, rgba(165,120,66,0.02) 60%, var(--surface-2) 100%)',
                  }}
                >
                  {/* Badge medallion — large, centred */}
                  <div
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-105"
                    style={{
                      background:
                        'linear-gradient(145deg, rgba(165,120,66,0.28), rgba(165,120,66,0.06))',
                      border: '1px solid rgba(165,120,66,0.55)',
                      boxShadow:
                        '0 8px 28px rgba(165,120,66,0.18), inset 0 1px 0 rgba(255,255,255,0.06)',
                    }}
                  >
                    {cert.logo ? (
                      <Image
                        src={cert.logo}
                        alt={cert.name}
                        width={56}
                        height={56}
                        className="object-contain"
                      />
                    ) : cert.icon ? (
                      <cert.icon className="w-9 h-9 text-[var(--accent-bronze)]" />
                    ) : null}
                  </div>

                  {/* Bronze hairline */}
                  <div
                    className="h-px w-10 mb-5"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent, var(--accent-bronze), transparent)',
                    }}
                    aria-hidden="true"
                  />

                  <h3 className="font-display text-xl md:text-2xl text-white font-light leading-tight tracking-[-0.01em] mb-3 max-w-[14rem]">
                    {cert.name}
                  </h3>
                  <p className="text-sm text-[var(--text-body)] leading-relaxed max-w-xs">
                    {cert.description}
                  </p>

                  {cert.href && (
                    <span className="mt-5 text-eyebrow text-[var(--accent-bronze)] group-hover:text-white transition-colors">
                      Learn more →
                    </span>
                  )}
                </div>
              );

              return cert.href ? (
                <Link
                  key={cert.name}
                  href={cert.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-full"
                  aria-label={`${cert.name}, external link`}
                >
                  {Inner}
                </Link>
              ) : (
                <div key={cert.name} className="h-full">
                  {Inner}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

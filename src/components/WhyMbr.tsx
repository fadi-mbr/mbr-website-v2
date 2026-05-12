"use client";

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaShieldAlt,
  FaCog,
  FaHandshake,
  FaCheckCircle,
} from 'react-icons/fa';
import SectionMarker from './SectionMarker';

const STATS = [
  { value: '15+', label: 'Years' },
  { value: '5,000+', label: 'Owners' },
  { value: '10,000+', label: 'Services' },
  { value: '100%', label: 'Guarantee' },
];

const CERTIFICATIONS = [
  {
    name: 'Bosch Authorised Service',
    description:
      'Certified Bosch service centre — diagnostic tooling and OE-spec parts straight from the supplier network.',
    logo: '/images/Bosch_Logo24.webp' as string | undefined,
    href: undefined as string | undefined,
  },
  {
    name: 'Leonardo Exotic Diagnostics',
    description:
      'OEM-grade diagnostics on Ferrari, Lamborghini and McLaren — the same toolchain factory technicians use.',
    logo: undefined,
    href: 'https://www.leonardodiagnostictool.com/',
  },
  {
    name: 'OEM-Level Tooling',
    description:
      'Genuine torque specs, factory procedures, and original-equipment parts. No shortcuts on cars that don\'t forgive them.',
    logo: undefined,
    href: undefined,
  },
];

const PILLARS = [
  {
    icon: FaShieldAlt,
    title: 'Independent expertise',
    body:
      'Dealership-level work without the dealership markup. A decade-plus inside the same marques the dealer principals service.',
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
      'Quote first, approve before we lift a spanner. Itemised invoice covering labour, parts, consumables — no surprise lines at handover.',
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
          headline="Fifteen years on the cars Dubai cares about."
          body="An independent workshop chosen by the owners who could go anywhere. Bosch tooling, exotic-car diagnostics, and the discipline of doing things to factory spec."
        />

        {/* Stat strip — 911Porsche numerals, no card wrapping. Tabular
            figures keep the column edges aligned. */}
        <motion.div
          className="mt-20 md:mt-24 grid grid-cols-2 md:grid-cols-4 gap-y-12 gap-x-6 md:gap-x-10"
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

        {/* 2-column treatment: certifications left, pillars right. */}
        <div className="mt-24 md:mt-28 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Certifications */}
          <div>
            <p className="text-eyebrow mb-8">Certifications &amp; Tooling</p>
            <div className="space-y-5">
              {CERTIFICATIONS.map((cert) => {
                const Inner = (
                  <div className="flex items-start gap-5 p-6 md:p-7 rounded-2xl border border-[var(--accent-bronze)]/20 bg-[color:var(--accent-bronze-soft)] hover:border-[var(--accent-bronze)]/50 transition-colors duration-300">
                    <div
                      className="shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-full"
                      style={{
                        background:
                          'linear-gradient(145deg, rgba(165,120,66,0.22), rgba(165,120,66,0.04))',
                        border: '1px solid rgba(165,120,66,0.45)',
                      }}
                    >
                      {cert.logo ? (
                        <Image
                          src={cert.logo}
                          alt={cert.name}
                          width={28}
                          height={28}
                          className="object-contain"
                        />
                      ) : (
                        <FaCheckCircle className="w-5 h-5 text-[var(--accent-bronze)]" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg text-white font-light leading-tight mb-1.5">
                        {cert.name}
                      </h3>
                      <p className="text-sm text-[var(--text-body)] leading-relaxed">
                        {cert.description}
                      </p>
                    </div>
                  </div>
                );

                return cert.href ? (
                  <Link
                    key={cert.name}
                    href={cert.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                    aria-label={`Open ${cert.name} (external)`}
                  >
                    {Inner}
                  </Link>
                ) : (
                  <div key={cert.name}>{Inner}</div>
                );
              })}
            </div>
          </div>

          {/* Pillars */}
          <div className="motion-calm">
            <p className="text-eyebrow mb-8">What Sets Us Apart</p>
            <div className="space-y-5">
              {PILLARS.map((pillar) => (
                <div
                  key={pillar.title}
                  className="p-6 md:p-7 rounded-2xl border border-white/8 bg-[var(--surface-2)] hover:border-white/20 transition-colors duration-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <pillar.icon className="w-5 h-5 text-[var(--primary)]" />
                    <h3 className="text-base md:text-lg text-white font-light leading-tight">
                      {pillar.title}
                    </h3>
                  </div>
                  <p className="text-sm text-[var(--text-body)] leading-relaxed">
                    {pillar.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

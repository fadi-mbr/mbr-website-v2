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

const STATS = [
  { value: '15+', label: 'Years', sub: 'Excellence in Dubai' },
  { value: '5,000+', label: 'Owners', sub: 'Across the UAE' },
  { value: '10,000+', label: 'Services', sub: 'Completed to spec' },
  { value: '100%', label: 'Quality', sub: 'Workmanship guarantee' },
];

const CERTIFICATIONS = [
  {
    name: 'Bosch Authorised Service',
    description:
      'Certified Bosch service centre — diagnostic tooling and OE-spec parts straight from the supplier network that builds the parts in your car.',
    logo: '/images/Bosch_Logo24.webp',
    href: undefined as string | undefined,
  },
  {
    name: 'Leonardo Exotic Diagnostics',
    description:
      'OEM-grade diagnostics on Ferrari, Lamborghini, McLaren and other exotics — the same toolchain factory technicians use.',
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
      'Dealership-level work without the dealership markup. The team has spent over a decade inside the same marques the dealer principals service.',
  },
  {
    icon: FaCog,
    title: 'Genuine OEM parts',
    body:
      'Every component traced to the original supplier. No aftermarket substitutions on engine, drivetrain or safety-critical systems unless you ask.',
  },
  {
    icon: FaHandshake,
    title: 'Transparent pricing',
    body:
      'Quote first, approve before we lift a spanner. Itemised invoice covering labour, parts, and consumables — no surprise lines at handover.',
  },
];

export default function WhyMbr() {
  return (
    <section id="why-mbr" className="section-padding bg-black vibrant-bg-gradient">
      <div className="container-luxury">
        {/* Header */}
        <motion.div
          className="content-block text-center mb-16 md:mb-20"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-accent-bronze mb-4">
            Why MBR
          </p>
          <h2 className="text-display font-light gradient-text mb-6 leading-tight">
            Workshop a Ferrari owner trusts.
          </h2>
          <p className="text-subheading text-[var(--text-body)] max-w-3xl mx-auto leading-relaxed">
            Fifteen years of independent service on the cars Dubai cares about.
            Bosch tooling, exotic-car diagnostics, and the discipline of
            doing things to factory spec.
          </p>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16 md:mb-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="glass-card p-6 md:p-8 text-center hover:glow-red transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
            >
              <div className="text-4xl md:text-5xl font-light gradient-text-vibrant mb-3">
                {stat.value}
              </div>
              <div className="text-base md:text-lg text-luxury-silver mb-1">
                {stat.label}
              </div>
              <div className="text-xs md:text-sm text-[var(--text-muted)]">
                {stat.sub}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Certifications row — bronze badges */}
        <motion.div
          className="mb-16 md:mb-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-xs uppercase tracking-[0.3em] text-accent-bronze text-center mb-10">
            Certifications &amp; Tooling
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CERTIFICATIONS.map((cert) => {
              const Inner = (
                <div className="glass-card h-full p-7 md:p-8 flex flex-col items-start gap-4 transition-all duration-300 hover:glow-red border border-[var(--accent-bronze)]/15">
                  <div
                    className="inline-flex items-center justify-center w-12 h-12 rounded-full"
                    style={{
                      background:
                        'linear-gradient(145deg, rgba(165,120,66,0.18), rgba(165,120,66,0.04))',
                      border: '1px solid rgba(165,120,66,0.4)',
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
                      <FaCheckCircle className="w-5 h-5 text-accent-bronze" />
                    )}
                  </div>
                  <h3 className="text-subheading text-white font-light leading-tight">
                    {cert.name}
                  </h3>
                  <p className="text-body text-[var(--text-body)] leading-relaxed">
                    {cert.description}
                  </p>
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
        </motion.div>

        {/* What sets us apart — 3 pillars */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-xs uppercase tracking-[0.3em] text-accent-bronze text-center mb-10">
            What Sets Us Apart
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className="glass-card p-7 md:p-8 hover:glow-red transition-all duration-300"
              >
                <pillar.icon className="w-7 h-7 text-[var(--primary)] mb-5" />
                <h3 className="text-subheading text-white font-light mb-3 leading-tight">
                  {pillar.title}
                </h3>
                <p className="text-body text-[var(--text-body)] leading-relaxed">
                  {pillar.body}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

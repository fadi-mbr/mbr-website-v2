"use client";

import Image from 'next/image';
import { motion } from 'framer-motion';
import SectionMarker from './SectionMarker';
import { MARQUE_NOTES } from '@/lib/marque-notes';

/**
 * BrandsStrip — short, static, above-the-fold trust beat.
 *
 * Phase B revamp: full-color brand marks (no more grayscale wash) with
 * a hover-revealed tooltip pulling from src/lib/marque-notes.ts. Tier
 * labels in 911Porsche sit below the logos as a quiet hierarchy cue.
 * The full 12-mark carousel lives inside Services — this is the
 * editorial above-the-fold beat.
 */
const TOP_MARKS = [
  { name: 'Ferrari', slug: 'ferrari', src: '/images/brands/ferrari.svg' },
  { name: 'Lamborghini', slug: 'lamborghini', src: '/images/brands/lamborghini.svg' },
  { name: 'Rolls-Royce', slug: 'rolls-royce', src: '/images/brands/rolls-royce.svg' },
  { name: 'Bentley', slug: 'bentley', src: '/images/brands/bentley.svg' },
  { name: 'McLaren', slug: 'mclaren', src: '/images/brands/mclaren.svg' },
  { name: 'Porsche', slug: 'porsche', src: '/images/brands/porsche.svg' },
];

export default function BrandsStrip() {
  return (
    <section
      id="trusted-brands"
      aria-label="Marques we service"
      className="relative py-20 md:py-24 bg-[var(--surface-1)] border-y border-white/5 overflow-hidden"
    >
      {/* Subtle red bottom radial — anchors the strip to the brand red
          without being loud. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 110%, rgba(227,6,19,0.08) 0%, transparent 55%)',
        }}
        aria-hidden="true"
      />

      <div className="relative container-luxury">
        <SectionMarker
          number="01"
          eyebrow="Marques"
          headline="The cars we know."
          body="A working list of the marques we routinely service. Hover for what we typically handle on each."
        />

        {/* Logo grid */}
        <div className="mt-16 md:mt-20 grid grid-cols-3 md:grid-cols-6 gap-y-10 md:gap-y-12 gap-x-6">
          {TOP_MARKS.map((mark, i) => {
            const note = MARQUE_NOTES[mark.slug];
            return (
              <motion.div
                key={mark.name}
                className="group relative flex flex-col items-center"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.05 + i * 0.06, ease: 'easeOut' }}
              >
                <div className="relative flex h-20 md:h-24 items-center justify-center">
                  <Image
                    src={mark.src}
                    alt={mark.name}
                    width={180}
                    height={96}
                    className="h-16 md:h-20 w-auto object-contain transition-all duration-500 group-hover:scale-[1.06]"
                    priority={i < 3}
                  />
                </div>

                {/* Marque name + tier (always visible) */}
                <p className="mt-4 text-sm md:text-base text-white tracking-wide">{mark.name}</p>
                {note && (
                  <p className="text-eyebrow text-[0.65rem] md:text-[0.7rem] tracking-[0.2em] mt-1 text-[var(--text-muted)] group-hover:text-[var(--accent-bronze)] transition-colors">
                    {note.tier}
                  </p>
                )}

                {/* Hover note */}
                {note && (
                  <p className="mt-2 text-xs text-[var(--text-subtle)] leading-snug text-center max-w-[220px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {note.note}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Tier band */}
        <div className="mt-14 md:mt-16 flex flex-wrap items-center justify-center gap-x-6 md:gap-x-10 gap-y-3 text-eyebrow text-[var(--text-muted)]">
          <span>Supercar</span>
          <span className="text-[var(--accent-bronze)]" aria-hidden="true">·</span>
          <span>Ultra-Luxury</span>
          <span className="text-[var(--accent-bronze)]" aria-hidden="true">·</span>
          <span>Luxury &amp; Sport</span>
        </div>
      </div>
    </section>
  );
}

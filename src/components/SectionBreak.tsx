"use client";

import Image from 'next/image';
import { motion } from 'framer-motion';

/**
 * SectionBreak — full-bleed photographic interrupt between major sections.
 *
 * McLaren MSO / Apple end-of-section pattern: use a big editorial photo
 * with overlaid 911Porsche copy as visual punctuation between content
 * blocks. Not informational density — pacing.
 *
 * Two variants:
 *   - `variant="bold"` (default): 60vh tall, large centered headline in
 *     911Porsche over the image. Used between Services and Our Workshop.
 *   - `variant="slim"`: 28vh tall, single line of address-style copy
 *     above a small CTA. Used between Reviews and Contact.
 */

type Variant = 'bold' | 'slim';

interface SectionBreakProps {
  image: string;
  alt: string;
  headline: string;
  subline?: string;
  ctaHref?: string;
  ctaLabel?: string;
  variant?: Variant;
}

export default function SectionBreak({
  image,
  alt,
  headline,
  subline,
  ctaHref,
  ctaLabel,
  variant = 'bold',
}: SectionBreakProps) {
  const heightClass =
    variant === 'bold'
      ? 'h-[60vh] min-h-[420px] md:min-h-[520px]'
      : 'h-[28vh] min-h-[220px] md:min-h-[280px]';

  /*
   * Bold variant: large Fraunces serif headline (sentence-case for the
   * film-title feel — no uppercase tracking that would read as stencil).
   * Slim variant: smaller Fraunces serif for the address-ribbon — also
   * sentence case so it reads like an editorial pull, not a stencil sign.
   */
  const headlineClass =
    variant === 'bold'
      ? 'font-display text-white text-4xl md:text-6xl lg:text-7xl leading-[1.05] tracking-[-0.02em] font-light'
      : 'font-display text-white text-2xl md:text-3xl tracking-[-0.01em] font-light';

  return (
    <section
      className={`relative w-full overflow-hidden ${heightClass}`}
      aria-label={headline}
    >
      <Image
        src={image}
        alt={alt}
        fill
        priority={false}
        sizes="100vw"
        className="object-cover"
      />

      {/* Dual gradient overlay — deepens the bottom for legibility, hints a
          red brand wash from the top-right corner so it doesn't read as a
          generic stock photo. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 35%, rgba(0,0,0,0.85) 100%), radial-gradient(circle at 80% 0%, rgba(227,6,19,0.18) 0%, transparent 55%)',
        }}
      />

      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      >
        <h2 className={headlineClass}>{headline}</h2>

        {subline && (
          <p className="mt-5 text-sm md:text-base text-[var(--text-body)] font-light tracking-wide max-w-xl">
            {subline}
          </p>
        )}

        {ctaHref && ctaLabel && (
          <a
            href={ctaHref}
            target={ctaHref.startsWith('http') ? '_blank' : undefined}
            rel={ctaHref.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="mt-6 text-eyebrow text-white border-b border-[var(--accent-bronze)] pb-1 hover:text-[var(--accent-bronze)] transition-colors"
          >
            {ctaLabel} →
          </a>
        )}
      </motion.div>
    </section>
  );
}

import { motion } from 'framer-motion';

/**
 * SectionMarker — editorial chapter header for every major homepage section.
 *
 * Combines three typographic moments:
 *   - Numeric chapter ("01")  — 911Porsche, muted color, tracked
 *   - Eyebrow label ("MARQUES") — 911Porsche, bronze, generous tracking
 *   - Headline ("Trusted by owners of the finest marques.") — Inter Display,
 *     light weight, tight letter-spacing
 *
 * A hairline bronze rule sits between the eyebrow and the headline to give
 * the marker visual weight without competing with the content below.
 *
 * Animations: a subtle slide-up reveal on viewport entry. Respects
 * prefers-reduced-motion via the global media query in globals.css.
 *
 * Usage:
 *   <SectionMarker
 *     number="02"
 *     eyebrow="Craft"
 *     headline="Workshop-grade work on every marque we touch."
 *   />
 */

type Align = 'left' | 'center';

interface SectionMarkerProps {
  /** Two-character chapter marker, e.g. "01", "02", "03". */
  number: string;
  /** Short label that sits below the chapter marker. */
  eyebrow: string;
  /** Section headline. Rendered as <h2>. */
  headline: string;
  /** Optional sub-headline / supporting paragraph. */
  body?: string;
  /** Layout alignment. Default "center". */
  align?: Align;
  /** Hide the bronze hairline divider. Default false (divider shown). */
  noDivider?: boolean;
  /** Optional className override on the outermost wrapper. */
  className?: string;
}

export default function SectionMarker({
  number,
  eyebrow,
  headline,
  body,
  align = 'center',
  noDivider = false,
  className = '',
}: SectionMarkerProps) {
  const alignClasses =
    align === 'center'
      ? 'items-center text-center mx-auto'
      : 'items-start text-left';

  return (
    <motion.div
      className={`flex flex-col ${alignClasses} ${className}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      {/* Chapter marker */}
      <div className="text-marker mb-3">{number}</div>

      {/* Eyebrow */}
      <div className="text-eyebrow mb-5">{eyebrow}</div>

      {/* Optional bronze hairline */}
      {!noDivider && (
        <div
          className={`h-px mb-8 ${align === 'center' ? 'w-12' : 'w-16'}`}
          style={{
            background:
              'linear-gradient(90deg, transparent, var(--accent-bronze), transparent)',
          }}
          aria-hidden="true"
        />
      )}

      {/* Headline */}
      <h2 className="text-display font-light text-white leading-tight max-w-3xl">
        {headline}
      </h2>

      {/* Optional body */}
      {body && (
        <p className="mt-6 text-subheading text-[var(--text-body)] leading-relaxed max-w-2xl">
          {body}
        </p>
      )}
    </motion.div>
  );
}

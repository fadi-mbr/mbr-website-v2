"use client";

import Image from 'next/image';
import { motion } from 'framer-motion';

/**
 * Brands strip — short, static, above-the-fold trust beat.
 *
 * Six top marks only; the full 12-brand carousel lives inside Services
 * (PremiumBrandsCarousel) for visitors who want the breadth. This strip
 * exists for the half-second scan as the visitor scrolls past the hero.
 */
const TOP_MARKS = [
  { name: 'Ferrari', src: '/images/brands/ferrari.svg' },
  { name: 'Lamborghini', src: '/images/brands/lamborghini.svg' },
  { name: 'Rolls-Royce', src: '/images/brands/rolls-royce.svg' },
  { name: 'Bentley', src: '/images/brands/bentley.svg' },
  { name: 'McLaren', src: '/images/brands/mclaren.svg' },
  { name: 'Porsche', src: '/images/brands/porsche.svg' },
];

export default function BrandsStrip() {
  return (
    <section
      id="trusted-brands"
      aria-label="Brands we service"
      className="py-12 md:py-16 bg-[var(--surface-1)] border-y border-white/5"
    >
      <div className="container-luxury">
        <motion.p
          className="text-[0.7rem] md:text-xs uppercase tracking-[0.35em] text-accent-bronze text-center mb-8 md:mb-10"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Trusted by owners of
        </motion.p>

        <motion.div
          className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8 md:gap-x-16 lg:gap-x-20"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          {TOP_MARKS.map((mark, i) => (
            <motion.div
              key={mark.name}
              className="relative h-10 md:h-12 w-auto opacity-70 hover:opacity-100 transition-opacity duration-300"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 0.7, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.06 }}
              title={mark.name}
            >
              <Image
                src={mark.src}
                alt={mark.name}
                width={120}
                height={48}
                className="h-10 md:h-12 w-auto object-contain"
                style={{ filter: 'grayscale(1) brightness(2.2)' }}
                priority={i < 3}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

/**
 * Luxury car brands serviced by MBR.
 *
 * Order matters: the user-facing prioritization leads with the
 * supercars and ultra-luxury marques (Ferrari, Lamborghini,
 * Rolls-Royce) before the German luxury and British SUV tier.
 * Mainstream brands (Tesla, Lexus) were intentionally removed.
 * MBR's positioning is luxury and exotic-car focused.
 */
const luxuryBrands = [
  { name: "Ferrari",       slug: "ferrari",       tier: "supercar",     logo: "/images/brands/ferrari.svg",       keywords: "Ferrari repair Dubai, Ferrari service UAE, Ferrari maintenance, Ferrari mechanic Dubai" },
  { name: "Lamborghini",   slug: "lamborghini",   tier: "supercar",     logo: "/images/brands/lamborghini.svg",   keywords: "Lamborghini repair Dubai, Lamborghini service UAE, Lamborghini maintenance, Lamborghini mechanic Dubai" },
  { name: "Rolls-Royce",   slug: "rolls-royce",   tier: "ultra-luxury", logo: "/images/brands/rolls-royce.svg",   keywords: "Rolls-Royce repair Dubai, Rolls-Royce service UAE, Rolls Royce maintenance Dubai" },
  { name: "Bentley",       slug: "bentley",       tier: "ultra-luxury", logo: "/images/brands/bentley.svg",       keywords: "Bentley repair Dubai, Bentley service UAE, Bentley maintenance Dubai" },
  { name: "McLaren",       slug: "mclaren",       tier: "supercar",     logo: "/images/brands/mclaren.svg",       keywords: "McLaren repair Dubai, McLaren service UAE, McLaren maintenance Dubai" },
  { name: "Maserati",      slug: "maserati",      tier: "luxury-gt",    logo: "/images/brands/maserati.svg",      keywords: "Maserati repair Dubai, Maserati service UAE, Maserati maintenance Dubai" },
  { name: "Porsche",       slug: "porsche",       tier: "luxury-sport", logo: "/images/brands/porsche.svg",       keywords: "Porsche repair Dubai, Porsche service UAE, Porsche maintenance Dubai" },
  { name: "Mercedes-Benz", slug: "mercedes-benz", tier: "luxury",       logo: "/images/brands/mercedes-benz.svg", keywords: "Mercedes repair Dubai, Mercedes service UAE, Mercedes-Benz maintenance, Mercedes AMG service Dubai" },
  { name: "BMW",           slug: "bmw",           tier: "luxury",       logo: "/images/brands/bmw.svg",           keywords: "BMW repair Dubai, BMW service UAE, BMW M-series service Dubai" },
  { name: "Audi",          slug: "audi",          tier: "luxury",       logo: "/images/brands/audi.svg",          keywords: "Audi repair Dubai, Audi service UAE, Audi RS service Dubai" },
  { name: "Range Rover",   slug: "land-rover",    tier: "luxury-suv",   logo: "/images/brands/land-rover.svg",    keywords: "Range Rover repair Dubai, Land Rover service UAE, Range Rover maintenance Dubai" },
  { name: "Jaguar",        slug: "jaguar",        tier: "luxury",       logo: "/images/brands/jaguar.svg",        keywords: "Jaguar repair Dubai, Jaguar service UAE, Jaguar maintenance Dubai" },
] as const;

type Brand = typeof luxuryBrands[number];

// Duplicate for seamless infinite scroll
const carouselBrands: Brand[] = [...luxuryBrands, ...luxuryBrands];

function BrandLogo({ brand }: { brand: Brand }) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div className="text-base font-light tracking-[0.18em] uppercase text-black/80 text-center px-2">
        {brand.name}
      </div>
    );
  }

  return (
    <Image
      src={brand.logo}
      alt={`${brand.name} repair and service in Dubai, UAE | MBR Auto Services`}
      width={140}
      height={70}
      className="object-contain w-auto h-auto max-w-[70%] max-h-[70%] opacity-100 group-hover:scale-[1.04] transition-transform duration-300"
      onError={() => setImageError(true)}
    />
  );
}

export default function PremiumBrandsCarousel() {
  return (
    /*
     * Slim brand ribbon — used inside SophisticatedServices between
     * slabs 2 and 3. Theme: no own section header (the parent Services
     * section's SectionMarker carries the title), no own background
     * wash, no tier-caption block (already covered by BrandsStrip at
     * the top of the page). Just the marquee carousel + the editorial
     * pull-quote close. Vertical footprint ~50% of the old version.
     */
    <section
      id="premium-brands"
      aria-label="Marques serviced"
      className="relative py-12 md:py-14 overflow-hidden"
    >
      <div className="relative container-luxury">
        {/* Infinite scroll marquee — smaller cards, slower scroll cadence */}
        <div className="relative overflow-hidden" aria-hidden="true">
          {/* Edge fades */}
          <div className="absolute left-0 top-0 bottom-0 w-24 md:w-32 bg-gradient-to-r from-black via-black to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 md:w-32 bg-gradient-to-l from-black via-black to-transparent z-10 pointer-events-none" />

          <div className="flex gap-6 md:gap-8 brand-carousel-scroll">
            {carouselBrands.map((brand, index) => (
              <motion.div
                key={`${brand.slug}-${index}`}
                className="flex-shrink-0 group"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: (index % luxuryBrands.length) * 0.03 }}
                viewport={{ once: true }}
              >
                <div className="w-32 h-20 md:w-36 md:h-24 flex items-center justify-center p-3 opacity-80 hover:opacity-100 transition-opacity duration-300">
                  <BrandLogo brand={brand} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Editorial pull-quote — closes the brand ribbon with one
            confident line instead of a wall of SEO paragraphs. The
            dense copy is preserved below in sr-only so crawlers still
            see the marque keywords. */}
        <motion.div
          className="mt-14 md:mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
          viewport={{ once: true }}
        >
          {/* Bronze hairline above the quote */}
          <div
            className="h-px w-24 mx-auto mb-7 md:mb-9"
            style={{
              background:
                'linear-gradient(90deg, transparent, var(--accent-bronze), transparent)',
            }}
            aria-hidden="true"
          />
          <blockquote className="max-w-3xl mx-auto">
            <p className="font-display text-2xl md:text-4xl lg:text-5xl text-white font-light leading-[1.1] tracking-[-0.02em] mb-5">
              Different badges. Same standard.
            </p>
            <footer className="text-eyebrow text-[var(--text-muted)]">
              Bosch toolchain · Leonardo exotic diagnostics · Genuine OEM parts
            </footer>
          </blockquote>
        </motion.div>

        {/* Crawler-only marque inventory. Keeps the SEO long-tail
            coverage we used to render visibly — now invisible to
            visitors but still present in the rendered HTML. */}
        <div className="sr-only">
          <h3>Luxury car brands serviced in Dubai, UAE by MBR Auto Services</h3>
          <p>
            MBR Auto Services counts Ferrari, Lamborghini, and Rolls-Royce owners
            among its regular customers in Dubai, alongside Bentley, McLaren,
            Maserati, Porsche, Mercedes-Benz, BMW, Audi, Range Rover, and Jaguar.
            Every service is carried out with OEM-level diagnostic equipment,
            including the Leonardo exotic-car diagnostic platform, and genuine OEM
            parts. An independent workshop in Dubai with Bosch-authorised
            certification, our team handles engine and transmission work,
            electrical and ECU diagnostics, suspension and brake service, and
            preventive maintenance. Scheduled service intervals, pre-purchase
            inspections, and accident repairs are all delivered to the same
            workshop standard.
          </p>
          <ul>
            {luxuryBrands.map((brand) => (
              <li key={brand.slug}>{brand.keywords}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

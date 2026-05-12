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
    <section id="premium-brands" className="relative py-20 bg-black overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-600/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/[0.03] rounded-full blur-3xl"></div>
      </div>

      <div className="relative container-luxury">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-accent-bronze mb-4">
            Marques We Care For
          </p>
          <h2 className="text-display font-light gradient-text mb-6 tracking-tight">
            Ferrari, Lamborghini, Rolls-Royce &amp; the World&rsquo;s Finest
          </h2>
          <p className="text-subheading text-body-enhanced max-w-3xl mx-auto leading-relaxed">
            From Maranello to Crewe to Stuttgart, MBR is trusted by owners of the exotic,
            supercar, ultra-luxury, and luxury marques driven across Dubai. OEM-level
            diagnostic equipment, genuine OEM parts, Bosch-authorised workshop.
          </p>
        </motion.div>

        {/* Infinite Scrolling Carousel */}
        <div className="relative overflow-hidden" aria-label="Luxury car brands serviced">
          {/* Gradient Overlays for fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black via-black to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black via-black to-transparent z-10 pointer-events-none"></div>

          {/* Carousel Container */}
          <div className="flex gap-8 brand-carousel-scroll">
            {carouselBrands.map((brand, index) => (
              <motion.div
                key={`${brand.slug}-${index}`}
                className="flex-shrink-0 group"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: (index % luxuryBrands.length) * 0.04 }}
                viewport={{ once: true }}
              >
                <div className="glass-card-brand-logo w-48 h-32 flex items-center justify-center p-4 transition-all duration-500 overflow-hidden">
                  <BrandLogo brand={brand} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tier Captions */}
        <motion.div
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          viewport={{ once: true }}
        >
          {[
            { label: "Exotic & Supercars", brands: "Ferrari · Lamborghini · McLaren" },
            { label: "Ultra-luxury", brands: "Rolls-Royce · Bentley" },
            { label: "Luxury & Sport", brands: "Porsche · Maserati · Mercedes · BMW · Audi" },
            { label: "Luxury SUV", brands: "Range Rover · Jaguar" },
          ].map((tier) => (
            <div key={tier.label} className="px-2">
              <div className="text-[0.7rem] md:text-xs uppercase tracking-[0.2em] text-accent-bronze mb-2 font-medium">{tier.label}</div>
              <div className="text-sm md:text-base text-white/80 leading-relaxed font-light">{tier.brands}</div>
            </div>
          ))}
        </motion.div>

        {/* SEO-Friendly Content Section */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="glass-card-premium p-8 max-w-4xl mx-auto">
            <h3 className="text-heading font-light text-white mb-4">
              Experienced with every luxury and exotic marque
            </h3>
            <p className="text-body-enhanced leading-relaxed mb-6">
              MBR Auto Services counts Ferrari, Lamborghini, and Rolls-Royce owners among its
              regular customers in Dubai, alongside Bentley, McLaren, Maserati, Porsche,
              Mercedes-Benz, BMW, Audi, Range Rover, and Jaguar. Every service is carried out
              with OEM-level diagnostic equipment, including the Leonardo exotic-car diagnostic
              platform, and genuine OEM parts.
            </p>
            <p className="text-body-enhanced leading-relaxed">
              An independent workshop in Dubai with Bosch-authorised certification, our team handles
              engine and transmission work, electrical and ECU diagnostics, suspension and
              brake service, and preventive maintenance. Scheduled service intervals,
              pre-purchase inspections, and accident repairs are all delivered to the same
              workshop standard.
            </p>
          </div>
        </motion.div>

        {/* Brand List for SEO (Hidden visually, accessible to search engines) */}
        <div className="sr-only">
          <h3>Luxury car brands serviced in Dubai, UAE by MBR Auto Services</h3>
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

"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

// Premium car brands data with local logo paths
// All logos are hosted locally in /public/images/brands/
const premiumBrands = [
  {
    name: "Mercedes-Benz",
    slug: "mercedes-benz",
    keywords: "Mercedes repair Dubai, Mercedes service UAE, Mercedes-Benz maintenance",
    logo: "/images/brands/mercedes-benz.png",
    color: "#00ADEF"
  },
  {
    name: "BMW",
    slug: "bmw",
    keywords: "BMW repair Dubai, BMW service UAE, BMW maintenance",
    logo: "/images/brands/bmw.png",
    color: "#1C69D4"
  },
  {
    name: "Audi",
    slug: "audi",
    keywords: "Audi repair Dubai, Audi service UAE, Audi maintenance",
    logo: "/images/brands/audi.png",
    color: "#BB0A30"
  },
  {
    name: "Porsche",
    slug: "porsche",
    keywords: "Porsche repair Dubai, Porsche service UAE, Porsche maintenance",
    logo: "/images/brands/porsche.png",
    color: "#000000"
  },
  {
    name: "Range Rover",
    slug: "range-rover",
    keywords: "Range Rover repair Dubai, Range Rover service UAE",
    logo: "/images/brands/range-rover.png",
    color: "#005A2B"
  },
  {
    name: "Land Rover",
    slug: "land-rover",
    keywords: "Land Rover repair Dubai, Land Rover service UAE",
    logo: "/images/brands/land-rover.png",
    color: "#005A2B"
  },
  {
    name: "Lexus",
    slug: "lexus",
    keywords: "Lexus repair Dubai, Lexus service UAE, Lexus maintenance",
    logo: "/images/brands/lexus.png",
    color: "#000000"
  },
  {
    name: "Jaguar",
    slug: "jaguar",
    keywords: "Jaguar repair Dubai, Jaguar service UAE, Jaguar maintenance",
    logo: "/images/brands/jaguar.png",
    color: "#000000"
  },
  {
    name: "Maserati",
    slug: "maserati",
    keywords: "Maserati repair Dubai, Maserati service UAE",
    logo: "/images/brands/maserati.png",
    color: "#0C2340"
  },
  {
    name: "Bentley",
    slug: "bentley",
    keywords: "Bentley repair Dubai, Bentley service UAE",
    logo: "/images/brands/bentley.png",
    color: "#000000"
  },
  {
    name: "Rolls-Royce",
    slug: "rolls-royce",
    keywords: "Rolls-Royce repair Dubai, Rolls-Royce service UAE",
    logo: "/images/brands/rolls-royce.png",
    color: "#000000"
  },
  {
    name: "Lamborghini",
    slug: "lamborghini",
    keywords: "Lamborghini repair Dubai, Lamborghini service UAE",
    logo: "/images/brands/lamborghini.png",
    color: "#FFB800"
  },
  {
    name: "Ferrari",
    slug: "ferrari",
    keywords: "Ferrari repair Dubai, Ferrari service UAE",
    logo: "/images/brands/ferrari.png",
    color: "#DC143C"
  },
  {
    name: "McLaren",
    slug: "mclaren",
    keywords: "McLaren repair Dubai, McLaren service UAE",
    logo: "/images/brands/mclaren.png",
    color: "#FF8000"
  },
  {
    name: "Tesla",
    slug: "tesla",
    keywords: "Tesla repair Dubai, Tesla service UAE, Tesla maintenance",
    logo: "/images/brands/tesla.png",
    color: "#E31937"
  }
];

// Duplicate brands for seamless infinite scroll
const duplicatedBrands = [...premiumBrands, ...premiumBrands];

// Brand logo component with fallback
function BrandLogo({ brand }: { brand: typeof premiumBrands[0] }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {imageError ? (
        // Fallback to text if image fails to load
        <div 
          className="text-sm font-light tracking-wider opacity-80 group-hover:opacity-100 transition-opacity duration-300 text-center px-2"
          style={{ 
            color: brand.color !== '#000000' ? brand.color : '#ffffff',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
          }}
        >
          {brand.name}
        </div>
      ) : (
        <Image
          src={brand.logo}
          alt={`${brand.name} repair and service in Dubai, UAE`}
          width={160}
          height={80}
          className="object-contain opacity-80 group-hover:opacity-100 transition-opacity duration-300"
          onError={() => setImageError(true)}
          unoptimized={true}
        />
      )}
    </div>
  );
}

export default function PremiumBrandsCarousel() {
  return (
    <section id="premium-brands" className="relative py-20 bg-black overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-600/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/3 rounded-full blur-3xl"></div>
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
          <h2 className="text-display font-light gradient-text mb-6 tracking-tight">
            Premium Car Brands We Service
          </h2>
          <p className="text-subheading text-body-enhanced max-w-3xl mx-auto leading-relaxed">
            Expert service and repair for all luxury and premium car brands in Dubai, UAE.
            Our certified technicians have extensive experience with the world&apos;s finest automotive marques.
          </p>
        </motion.div>

        {/* Infinite Scrolling Carousel */}
        <div className="relative overflow-hidden">
          {/* Gradient Overlays for fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black via-black to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black via-black to-transparent z-10 pointer-events-none"></div>

          {/* Carousel Container */}
          <div className="flex gap-8 brand-carousel-scroll">
            {duplicatedBrands.map((brand, index) => (
              <motion.div
                key={`${brand.slug}-${index}`}
                className="flex-shrink-0 group"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <div className="glass-card-brand-logo w-48 h-32 flex items-center justify-center p-6 transition-all duration-500 group">
                  {/* Brand Logo from GitHub dataset */}
                  <BrandLogo brand={brand} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

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
              Expert Service for Every Premium Brand
            </h3>
            <p className="text-body-enhanced leading-relaxed mb-6">
              At MBR Auto Services, we specialize in servicing and repairing all premium and luxury car brands 
              available in Dubai and the UAE. Whether you drive a Mercedes-Benz, BMW, Audi, Porsche, Range Rover, 
              Lexus, Jaguar, Maserati, Bentley, Rolls-Royce, Lamborghini, Ferrari, McLaren, or any other premium 
              vehicle, our certified technicians have the expertise and genuine parts to keep your luxury car 
              performing at its best.
            </p>
            <p className="text-body-enhanced leading-relaxed">
              With 15+ years of experience and Bosch authorized service certification, we provide comprehensive 
              mechanical repairs, electrical diagnostics, suspension services, and preventive maintenance for all 
              premium car brands. Trust MBR for expert luxury car service in Dubai.
            </p>
          </div>
        </motion.div>

        {/* Brand List for SEO (Hidden visually, but accessible to search engines) */}
        <div className="sr-only">
          <h3>Premium Car Brands Serviced in Dubai, UAE</h3>
          <ul>
            {premiumBrands.map((brand) => (
              <li key={brand.slug}>
                {brand.name} repair Dubai, {brand.name} service UAE, {brand.name} maintenance Dubai
              </li>
            ))}
          </ul>
        </div>
      </div>

    </section>
  );
}


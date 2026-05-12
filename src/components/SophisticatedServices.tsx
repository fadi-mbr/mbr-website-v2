"use client";

import React from 'react';
import { motion, Variants } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FaCalendarAlt, FaWhatsapp, FaCogs, FaBolt, FaWrench, FaOilCan } from 'react-icons/fa';
import { trackWhatsAppClick, trackServiceClick } from '@/lib/analytics';
import { triggerChat } from '@/lib/chat-cta';
import PremiumBrandsCarousel from './PremiumBrandsCarousel';

const services = [
  {
    title: "Mechanical Repairs",
    subtitle: "Engine & Transmission",
    description: "Engine, transmission, clutch and brake work for Ferrari, Lamborghini, Porsche and the wider luxury lineup. Routine service to full rebuilds, carried out with OEM-level tooling and genuine parts.",
    features: ["Engine Diagnostics", "Transmission Service", "Brake Systems", "Clutch Repair"],
    image: "/images/mbr_mechanic.webp",
    icon: FaCogs,
    color: "from-blue-600/20 to-blue-800/20"
  },
  {
    title: "Electrical & Diagnostics",
    subtitle: "Advanced & Exotic Systems",
    description: "OEM-level diagnostic equipment for every electrical system, including the Leonardo platform purpose-built for Ferrari, Lamborghini and the wider exotic-car lineup. From battery and alternator work to deep ECU diagnostics, we read, code and repair to manufacturer-level precision.",
    features: ["Leonardo Exotic Diagnostics", "ECU Coding & Reset", "Battery & Alternator", "Wiring & Comfort Systems"],
    image: "/images/mbr_electrical.webp",
    icon: FaBolt,
    color: "from-yellow-600/20 to-orange-600/20",
    externalLink: { url: "https://www.leonardodiagnostictool.com/", label: "About the Leonardo platform" }
  },
  {
    title: "Suspension & Steering",
    subtitle: "Precision Handling",
    description: "Air-suspension service, alignment, ride-height calibration and steering work for ultra-luxury and supercar chassis. The fine handling owners pay for, recovered and preserved.",
    features: ["Wheel Alignment", "Air Suspension", "Steering Systems", "Suspension Tuning"],
    image: "/images/mbr_suspension.webp",
    icon: FaWrench,
    color: "from-purple-600/20 to-indigo-600/20"
  },
  {
    title: "Preventive Maintenance",
    subtitle: "Scheduled Care",
    description: "Manufacturer-schedule servicing, fluid changes, AC service and pre-purchase inspections for luxury and exotic vehicles. Detailed inspections, transparent pricing, full service history.",
    features: ["Oil & Fluid Service", "AC Service", "Filter Replacement", "Pre-purchase Inspections"],
    image: "/images/mbr_maintainence.webp",
    icon: FaOilCan,
    color: "from-green-600/20 to-emerald-600/20"
  }
];

export default function SophisticatedServices() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.4, 0, 0.2, 1] as [number, number, number, number]
      }
    }
  };

  return (
    <section id="services" className="relative py-24 bg-black overflow-hidden vibrant-bg-gradient">

      {/* Background Elements - Enhanced */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative container-luxury">

        {/* Section Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <h2 className="text-display font-light gradient-text mb-6 tracking-tight">
            Luxury, Exotic &amp; Supercar Services
          </h2>
          <p className="text-subheading text-body-enhanced max-w-3xl mx-auto leading-relaxed mb-10">
            Engine, transmission, electrical and chassis work, performed with OEM-level
            diagnostics, the Leonardo exotic-car platform, and genuine OEM parts. Trusted by
            Ferrari, Lamborghini, and Rolls-Royce owners; experienced with Bentley, Porsche,
            and the German luxury lineup.
          </p>

          {/* Tier pill row — anchors services to the brand hierarchy */}
          <div className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[0.7rem] md:text-xs uppercase tracking-[0.25em] text-accent-bronze">
            <span>Supercar</span>
            <span className="text-white/20" aria-hidden="true">·</span>
            <span>Ultra-Luxury</span>
            <span className="text-white/20" aria-hidden="true">·</span>
            <span>Luxury &amp; Sport</span>
            <span className="text-white/20" aria-hidden="true">·</span>
            <span className="text-[var(--text-muted)] normal-case tracking-normal italic">
              same workshop, same craft
            </span>
          </div>
        </motion.div>

        {/* Services Grid */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              className="group"
              variants={itemVariants}
              whileHover={{ y: -10 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative overflow-hidden glass-card hover:glow-red transition-all duration-500">

                {/* Service Image */}
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={service.image}
                    alt={`${service.title} - ${service.subtitle} | Premium Car Service Dubai, UAE | MBR Auto Services`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />

                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${service.color} to-transparent opacity-60`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Service Icon */}
                  <div className="absolute top-6 left-6">
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-red-600/20 group-hover:border-red-500/40 group-hover:glow-red transition-all duration-300">
                      <service.icon className="w-6 h-6 text-white group-hover:text-red-400 transition-colors duration-300" />
                    </div>
                  </div>

                  {/* Quick Action */}
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <a
                      href={`https://wa.me/+971565015800?text=Hello%20MBR,%20I%20need%20${encodeURIComponent(service.title.toLowerCase())}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center hover:bg-green-500 transition-colors duration-300"
                      onClick={() => {
                        trackWhatsAppClick('services_sophisticated_quick', '', service.title);
                        trackServiceClick(service.title, service.title, 'whatsapp_quick');
                      }}
                    >
                      <FaWhatsapp className="w-6 h-6 text-white" />
                    </a>
                  </div>
                </div>

                {/* Service Content */}
                <div className="p-8 glass-content">
                  <div className="mb-6">
                    <h3 className="text-2xl font-light text-white mb-2">
                      {service.title}
                    </h3>
                    <p className="text-red-400 font-medium text-sm uppercase tracking-wider">
                      {service.subtitle}
                    </p>
                  </div>

                  <p className="text-body-enhanced leading-relaxed mb-6">
                    {service.description}
                  </p>

                  {/* Features */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-muted-enhanced">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600 mr-3 flex-shrink-0"></div>
                        {feature}
                      </div>
                    ))}
                  </div>

                  {/* Optional external reference (e.g. Leonardo Diagnostic Tool) */}
                  {'externalLink' in service && service.externalLink && (
                    <a
                      href={service.externalLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs uppercase tracking-[0.2em] text-accent-bronze hover:text-white transition-colors duration-300 mb-6"
                    >
                      {service.externalLink.label}
                      <span className="ml-2" aria-hidden="true">&rarr;</span>
                    </a>
                  )}

                  {/* Action Buttons — Chat with us / Book Directly */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      className="flex-1 liquid-glass-btn liquid-glass-btn-primary inline-flex items-center justify-center gap-2"
                      onClick={() => {
                        trackServiceClick(service.title, service.title, 'chat');
                        triggerChat(
                          `service_card_${service.title.toLowerCase().replace(/\s+/g, '_')}`,
                          `Hello MBR, I need ${service.title.toLowerCase()}`,
                        );
                      }}
                    >
                      <FaWhatsapp className="w-4 h-4" />
                      <span>Chat with us</span>
                    </button>

                    <Link
                      href="/book"
                      className="flex-1 liquid-glass-btn liquid-glass-btn-secondary inline-flex items-center justify-center gap-2"
                      onClick={() => trackServiceClick(service.title, service.title, 'book_link')}
                    >
                      <FaCalendarAlt className="w-4 h-4" />
                      <span>Book Directly</span>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>

      {/* Brands we service — full 12-mark carousel, anchored to the services
          they map to. The short BrandsStrip above the fold introduces the
          marques; this is the full breadth for visitors who want to scan. */}
      <PremiumBrandsCarousel />
    </section>
  );
}
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const services = [
  {
    title: "Mechanical Repairs",
    description: "Engine, transmission, brakes, and comprehensive mechanical solutions.",
    image: "/images/mbr_mechanic.webp",
  },
  {
    title: "Electrical & Diagnostics",
    description: "Advanced diagnostics, battery, alternator, and electrical systems.",
    image: "/images/mbr_electrical.webp",
  },
  {
    title: "Suspension & Steering",
    description: "Precision alignment, suspension, and steering system services.",
    image: "/images/mbr_suspension.webp",
  },
  {
    title: "Maintenance Services",
    description: "Oil changes, AC service, and comprehensive vehicle maintenance.",
    image: "/images/mbr_maintainence.webp",
  },
];

export default function ServicesSection() {
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

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <section id="services" className="section-horizontal section-dark">
      <div className="container-luxury">

        {/* Section Header */}
        <motion.div
          className="content-block mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <h2 className="text-display text-center mb-6">
            Premium Automotive Services
          </h2>
          <p className="text-body text-center max-w-2xl mx-auto">
            Professional car care with cutting-edge diagnostics and genuine parts.
            Experience excellence in every service, backed by years of expertise.
          </p>
        </motion.div>

        {/* Services Grid */}
        <motion.div
          className="grid-two"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              className="group cursor-pointer"
              variants={itemVariants}
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <div className="glass-card h-full overflow-hidden">

                {/* Service Image */}
                <div className="relative h-64 mb-6 overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                {/* Service Content */}
                <div className="p-6">
                  <h3 className="text-heading mb-4 text-white group-hover:text-gray-100 transition-colors">
                    {service.title}
                  </h3>

                  <p className="text-body text-muted-enhanced mb-6 leading-relaxed">
                    {service.description}
                  </p>

                  {/* Service Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href={`https://wa.me/+971565015800?text=Hello%20MBR,%20I%20need%20${encodeURIComponent(service.title.toLowerCase())}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="liquid-glass-btn liquid-glass-btn-primary flex-1"
                    >
                      Book Service
                    </a>

                    <button className="liquid-glass-btn liquid-glass-btn-secondary flex-1">
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bosch Partnership */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center space-x-6 p-8 glass-card-premium">
            <Image
              src="/images/Bosch_Logo24.webp"
              alt="Bosch Authorized Service"
              width={120}
              height={60}
              className="opacity-80"
            />
            <div className="text-left">
              <h3 className="text-subheading text-white mb-2">
                Bosch Authorized Service
              </h3>
              <p className="text-caption text-muted-enhanced">
                Certified quality and genuine parts
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { FaArrowRight, FaWhatsapp, FaCogs, FaBolt, FaWrench, FaOilCan } from 'react-icons/fa';

const services = [
  {
    title: "Mechanical Repairs",
    subtitle: "Engine & Transmission",
    description: "Complete mechanical solutions from engine diagnostics to transmission rebuilds. Our certified technicians handle everything from routine maintenance to complex repairs with precision and expertise.",
    features: ["Engine Diagnostics", "Transmission Service", "Brake Systems", "Clutch Repair"],
    image: "/images/mbr_mechanic.webp",
    icon: FaCogs,
    color: "from-blue-600/20 to-blue-800/20"
  },
  {
    title: "Electrical & Diagnostics",
    subtitle: "Advanced Systems",
    description: "State-of-the-art diagnostic equipment for all electrical systems. From battery issues to complex ECU problems, we diagnose and repair with manufacturer-level precision.",
    features: ["ECU Diagnostics", "Battery & Alternator", "Wiring Repair", "Computer Systems"],
    image: "/images/mbr_electrical.jpg",
    icon: FaBolt,
    color: "from-yellow-600/20 to-orange-600/20"
  },
  {
    title: "Suspension & Steering",
    subtitle: "Precision Handling",
    description: "Professional wheel alignment, suspension tuning, and steering system services. Experience smooth, controlled driving with our precision alignment and suspension expertise.",
    features: ["Wheel Alignment", "Shock Absorbers", "Steering Systems", "Suspension Tuning"],
    image: "/images/mbr_suspension.webp",
    icon: FaWrench,
    color: "from-purple-600/20 to-indigo-600/20"
  },
  {
    title: "Maintenance Services",
    subtitle: "Preventive Care",
    description: "Comprehensive vehicle maintenance to keep your car running at peak performance. Regular service intervals, quality parts, and detailed inspections for long-term reliability.",
    features: ["Oil Changes", "AC Service", "Filter Replacement", "Fluid Checks"],
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

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
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
    <section id="services" className="relative py-24 bg-black overflow-hidden">

      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-600/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/3 rounded-full blur-3xl"></div>
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
          <h2 className="text-5xl md:text-6xl font-extralight text-white mb-8 tracking-tight">
            Premium Services
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Comprehensive automotive solutions backed by 15+ years of expertise,
            certified technicians, and state-of-the-art equipment.
          </p>
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
              <div className="relative overflow-hidden glass-card glass-shimmer">

                {/* Service Image */}
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />

                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${service.color} to-transparent opacity-60`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Service Icon */}
                  <div className="absolute top-6 left-6">
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                      <service.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {/* Quick Action */}
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <a
                      href={`https://wa.me/+971565015800?text=Hello%20MBR,%20I%20need%20${encodeURIComponent(service.title.toLowerCase())}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center hover:bg-green-500 transition-colors duration-300"
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

                  <p className="text-gray-300 leading-relaxed mb-6">
                    {service.description}
                  </p>

                  {/* Features */}
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600 mr-3"></div>
                        {feature}
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href={`https://wa.me/+971565015800?text=Hello%20MBR,%20I%20need%20${encodeURIComponent(service.title.toLowerCase())}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 group/btn relative px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-medium text-center rounded-none overflow-hidden transition-all duration-300 hover:scale-105"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                      <span className="relative">Book Service</span>
                    </a>

                    <button className="flex-1 group/btn px-6 py-3 border border-white/30 text-white font-medium rounded-none hover:border-white/50 hover:bg-white/10 transition-all duration-300 flex items-center justify-center space-x-2">
                      <span>Learn More</span>
                      <FaArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bosch Partnership - Enhanced */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8 glass-card-premium p-6 md:p-8">
            <Image
              src="/images/Bosch_Logo24.webp"
              alt="Bosch Authorized Service"
              width={120}
              height={60}
              className="opacity-80"
            />
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-light text-white mb-3">
                Bosch Authorized Service Partner
              </h3>
              <p className="text-gray-400 mb-4">
                Certified quality, genuine parts, and manufacturer-level diagnostics
              </p>
              <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-6 text-sm text-gray-500">
                <span>• Genuine Parts</span>
                <span>• Certified Technicians</span>
                <span>• Warranty Coverage</span>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
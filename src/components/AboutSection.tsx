"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { FaAward, FaUsers, FaCog, FaShieldAlt } from 'react-icons/fa';
import { trackWhatsAppClick } from '@/lib/analytics';

const achievements = [
  {
    icon: FaAward,
    number: "15+",
    label: "Years Excellence",
    description: "Serving Dubai's automotive community"
  },
  {
    icon: FaUsers,
    number: "5000+",
    label: "Satisfied Customers",
    description: "Trust built through quality service"
  },
  {
    icon: FaCog,
    number: "10000+",
    label: "Services Completed",
    description: "Professional automotive solutions"
  },
  {
    icon: FaShieldAlt,
    number: "100%",
    label: "Quality Guarantee",
    description: "Standing behind our work"
  }
];

const certifications = [
  {
    title: "Bosch Authorised Service",
    description: "Certified for premium diagnostic equipment and genuine parts.",
    image: "/images/Bosch_Logo24.webp",
    link: null,
  },
  {
    title: "Leonardo Exotic-Car Diagnostics",
    description: "Specialist diagnostic platform purpose-built for Ferrari, Lamborghini and the wider exotic and supercar lineup.",
    image: "/images/mbr_electrical.webp",
    link: "https://www.leonardodiagnostictool.com/",
    linkLabel: "leonardodiagnostictool.com",
  },
];

export default function AboutSection() {
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
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section id="about" className="section-horizontal section-elevated vibrant-bg-gradient">
      <div className="container-luxury">

        {/* Section Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <h2 className="text-display font-light gradient-text mb-8 tracking-tight">
            About MBR Auto Services
          </h2>
          <p className="text-subheading text-body-enhanced max-w-3xl mx-auto leading-relaxed">
            Dubai&apos;s independent luxury and exotic-car workshop. Trusted by Ferrari,
            Lamborghini, and Rolls-Royce owners, and experienced with Bentley, McLaren,
            Maserati, Porsche, and the German luxury marques. Fifteen years in Al Quoz,
            Bosch-authorised, with the Leonardo exotic-car diagnostic platform and genuine
            OEM parts.
          </p>
        </motion.div>

        {/* Main About Content */}
        <motion.div
          className="grid-two gap-12 mb-20"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >

          {/* Story & Mission */}
          <motion.div
            className="space-y-8"
            variants={itemVariants}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div>
              <h3 className="text-heading font-light text-white mb-6">Our Story</h3>
              <p className="text-body text-body-enhanced leading-relaxed mb-6">
                What began as a small workshop in Al Quoz has grown into a trusted name across
                Dubai. Over fifteen years we&apos;ve cared for everything from daily-driven
                luxury sedans to the exotics, supercars and ultra-luxury vehicles Dubai is
                famous for.
              </p>
              <p className="text-body text-body-enhanced leading-relaxed">
                Today our regulars include Ferrari, Lamborghini, and Rolls-Royce owners
                alongside the German luxury and British SUV crowd. Every car is served with
                the same principle: treat each vehicle as if it were our own.
              </p>
            </div>

            <div>
              <h3 className="text-heading font-light text-white mb-6">Our Mission</h3>
              <p className="text-body text-body-enhanced leading-relaxed">
                Independent expertise for owners who want dealership-grade work without the
                dealership runaround. Genuine OEM parts, OEM-level diagnostics including the
                Leonardo exotic-car platform, transparent pricing, and a workshop process
                built around the cars our customers actually drive.
              </p>
            </div>
          </motion.div>

          {/* Workshop Image */}
          <motion.div
            className="relative"
            variants={itemVariants}
          >
            <div className="relative h-96 overflow-hidden rounded-3xl">
              <Image
                src="/images/mbr_mechanic.webp"
                alt="MBR Auto Services Workshop - State-of-the-Art Premium Car Repair Facility in Al Quoz, Dubai, UAE"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

              {/* Overlay Content */}
              <div className="absolute bottom-6 left-6 right-6">
                <h4 className="text-subheading font-medium text-white mb-2">
                  State-of-the-Art Facility
                </h4>
                <p className="text-body text-white/90">
                  Modern equipment meets traditional expertise in our Al Quoz workshop
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Achievements Grid */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-20"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.label}
              className="text-center"
              variants={itemVariants}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="glass-card glass-shimmer p-8 h-full hover:glow-red transition-all duration-300">
                <achievement.icon className="w-10 h-10 text-primary mx-auto mb-6 group-hover:scale-110 transition-transform duration-300" />
                <div className="text-4xl font-light gradient-text-vibrant mb-3">
                  {achievement.number}
                </div>
                <h4 className="text-subheading font-medium text-white mb-2">
                  {achievement.label}
                </h4>
                <p className="text-body text-muted-enhanced">
                  {achievement.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Certifications & Partnerships */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-12">
            <h3 className="text-heading font-light text-center mb-6 text-white">
              Certified Excellence
            </h3>
            <p className="text-subheading text-center text-body-enhanced max-w-3xl mx-auto">
              Our certifications and partnerships ensure you receive the highest
              standard of automotive care available in Dubai.
            </p>
          </div>

          <div className="grid-two gap-8">
            {certifications.map((cert, index) => (
              <motion.div
                key={cert.title}
                className="glass-card p-8 flex items-center space-x-6"
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="relative w-20 h-20 flex-shrink-0">
                  <Image
                    src={cert.image}
                    alt={`${cert.title} - Certified Premium Car Service Dubai, UAE | MBR Auto Services`}
                    fill
                    className="object-contain opacity-80"
                    sizes="80px"
                  />
                </div>
                <div>
                  <h4 className="text-subheading font-medium text-white mb-3">
                    {cert.title}
                  </h4>
                  <p className="text-body text-body-enhanced leading-relaxed mb-2">
                    {cert.description}
                  </p>
                  {cert.link && (
                    <a
                      href={cert.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs uppercase tracking-[0.2em] text-luxury-gold hover:text-white transition-colors duration-300"
                    >
                      {cert.linkLabel}
                      <span className="ml-2" aria-hidden="true">&rarr;</span>
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="glass-card-premium glass-shimmer p-10 inline-block max-w-2xl">
            <h3 className="text-heading font-light text-white mb-6">
              Ready to Experience the Difference?
            </h3>
            <p className="text-subheading text-body-enhanced mb-8 leading-relaxed">
              Join thousands of satisfied customers who trust MBR Auto Services
              with their valuable vehicles.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://wa.me/+971565015800?text=Hello%20MBR,%20I%20would%20like%20to%20learn%20more%20about%20your%20services"
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass-btn liquid-glass-btn-primary"
                onClick={() => trackWhatsAppClick('about_section', 'Get Started')}
              >
                Get Started
              </a>
              <a
                href="#services"
                className="liquid-glass-btn liquid-glass-btn-secondary"
              >
                View Services
              </a>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
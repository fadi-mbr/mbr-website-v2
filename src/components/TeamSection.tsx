"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { FaInstagram, FaLinkedin, FaAward, FaUsers, FaHandshake } from 'react-icons/fa';
import { type TeamMember } from '@/lib/team-data';

interface TeamSectionProps {
  teamMembers: TeamMember[];
}

const teamStats = [
  {
    icon: FaAward,
    number: "15+",
    label: "Years Experience",
    description: "Industry expertise"
  },
  {
    icon: FaUsers,
    number: "8+",
    label: "Expert Technicians",
    description: "Certified professionals"
  },
  {
    icon: FaHandshake,
    number: "5000+",
    label: "Happy Customers",
    description: "Trusted relationships"
  }
];

export default function TeamSection({ teamMembers }: TeamSectionProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const getSocialIcon = (socialType?: string) => {
    switch (socialType) {
      case 'instagram':
        return FaInstagram;
      case 'linkedin':
        return FaLinkedin;
      default:
        return null;
    }
  };

  return (
    <section id="team" className="relative py-24 bg-gradient-to-b from-black via-black to-gray-950 overflow-hidden">

      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-red-600/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-white/3 rounded-full blur-3xl"></div>
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
            Meet Our Expert Team
          </h2>
          <p className="text-xl text-body-enhanced max-w-3xl mx-auto leading-relaxed">
            Passionate automotive professionals dedicated to delivering exceptional service
            and building lasting relationships with every customer.
          </p>
        </motion.div>

        {/* Team Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          viewport={{ once: true }}
        >
          {teamStats.map((stat, index) => (
            <div
              key={stat.label}
              className="text-center group"
            >
              <div className="glass-card p-8">
                <stat.icon className="w-12 h-12 text-red-600 mx-auto mb-6" />
                <div className="text-4xl font-light text-white mb-2">
                  {stat.number}
                </div>
                <h3 className="text-lg text-luxury-silver mb-2">
                  {stat.label}
                </h3>
                <p className="text-sm text-muted-enhanced">
                  {stat.description}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Team Members Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {teamMembers.map((member, index) => {
            const SocialIcon = getSocialIcon(member.socialType);

            return (
              <motion.div
                key={member.name}
                className="group"
                variants={itemVariants}
                whileHover={{ y: -10 }}
                transition={{ duration: 0.5 }}
              >
                <div className="glass-card overflow-hidden">

                  {/* Member Photo */}
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Social Link */}
                    {SocialIcon && member.socialUrl && (
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <a
                          href={member.socialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors duration-300"
                        >
                          <SocialIcon className="w-5 h-5 text-white" />
                        </a>
                      </div>
                    )}

                    {/* Position Badge */}
                    <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="bg-red-600/90 backdrop-blur-sm rounded-full px-3 py-1 text-center">
                        <span className="text-white text-sm font-medium">
                          {member.position}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Member Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-light text-white mb-2">
                      {member.name}
                    </h3>
                    <p className="text-red-400 font-medium text-sm uppercase tracking-wider mb-4">
                      {member.position}
                    </p>
                    <p className="text-muted-enhanced text-sm leading-relaxed">
                      {member.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Team CTA */}
        <motion.div
          className="text-center mt-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="inline-block glass-card-premium p-8">
            <h3 className="text-2xl font-light text-white mb-4">
              Experience the MBR Difference
            </h3>
            <p className="text-muted-enhanced mb-6 max-w-2xl">
              Our team of certified professionals is ready to provide you with
              exceptional automotive service and personalized care for your vehicle.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://wa.me/+971565015800?text=Hello%20MBR,%20I%20would%20like%20to%20meet%20your%20team%20and%20discuss%20my%20vehicle%20needs"
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass-btn liquid-glass-btn-primary liquid-glass-btn-large"
              >
                Meet Our Team
              </a>
              <a
                href="#contact"
                className="liquid-glass-btn liquid-glass-btn-secondary liquid-glass-btn-large"
              >
                Visit Our Workshop
              </a>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
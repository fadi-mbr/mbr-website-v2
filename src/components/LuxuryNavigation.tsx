"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  FaCog,
  FaAward,
  FaUsers,
  FaEnvelope,
  FaBars,
  FaTimes
} from 'react-icons/fa';

interface NavigationProps {
  currentSection?: string;
}

const navigationItems = [
  {
    id: 'services',
    label: 'Services',
    icon: FaCog,
    description: 'Premium Care',
  },
  {
    id: 'excellence',
    label: 'Excellence',
    icon: FaAward,
    description: 'Our Standards',
  },
  {
    id: 'team',
    label: 'Team',
    icon: FaUsers,
    description: 'Expert Technicians',
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: FaEnvelope,
    description: 'Get in Touch',
  },
];

export default function LuxuryNavigation({ currentSection = 'services' }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.6,
        ease: "easeOut"
      }
    })
  };

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrollY > 50
          ? 'bg-black/95 backdrop-blur-xl border-b border-gold/30'
          : 'bg-black/80 backdrop-blur-lg'
      }`}
      variants={navVariants}
      initial="hidden"
      animate="visible"
      style={{
        boxShadow: scrollY > 50
          ? '0 4px 30px rgba(212, 175, 55, 0.1)'
          : '0 2px 20px rgba(0, 0, 0, 0.3)'
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <motion.div
            className="flex-shrink-0"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Link href="/" className="flex items-center">
              <Image
                src="/images/Logo_horizontal.svg"
                alt="MBR Auto Services"
                width={160}
                height={50}
                className="h-10 w-auto opacity-95"
                priority
              />
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-8">
              {navigationItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  custom={index}
                  className="group relative"
                >
                  <Link
                    href={`#${item.id}`}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 hover:bg-white/5"
                  >
                    {/* Icon */}
                    <item.icon className="h-4 w-4 text-gray-400 group-hover:text-gold transition-colors duration-300" />

                    {/* Label */}
                    <div className="text-left">
                      <div className="text-sm font-medium text-white group-hover:text-gold transition-colors duration-300">
                        {item.label}
                      </div>
                      <div className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors duration-300">
                        {item.description}
                      </div>
                    </div>

                    {/* Active Indicator */}
                    {currentSection === item.id && (
                      <motion.div
                        className="absolute bottom-0 left-1/2 w-1 h-1 bg-gold rounded-full"
                        layoutId="activeIndicator"
                        style={{ transform: 'translateX(-50%)' }}
                      />
                    )}
                  </Link>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 rounded-lg border border-transparent group-hover:border-gold/20 transition-all duration-300 pointer-events-none" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <motion.a
              href="https://wa.me/+971565015800?text=Hello%20MBR,%20I%20need%20premium%20automotive%20service"
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-glass-btn liquid-glass-btn-secondary liquid-glass-btn-small"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="luxury-text">Book Service</span>
            </motion.a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className="liquid-glass-control"
              whileTap={{ scale: 0.95 }}
            >
              {isOpen ? (
                <FaTimes className="h-5 w-5 text-white" />
              ) : (
                <FaBars className="h-5 w-5 text-white" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <motion.div
          className={`md:hidden ${isOpen ? 'block' : 'hidden'}`}
          initial={{ opacity: 0, height: 0 }}
          animate={{
            opacity: isOpen ? 1 : 0,
            height: isOpen ? 'auto' : 0
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="px-2 pt-2 pb-6 space-y-2 bg-black/95 border-t border-gold/20">
            {navigationItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={`#${item.id}`}
                  className="flex items-center space-x-4 px-4 py-3 rounded-lg transition-all duration-300 hover:bg-white/5"
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-white font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </Link>
              </motion.div>
            ))}

            {/* Mobile CTA */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="pt-4"
            >
              <a
                href="https://wa.me/+971565015800?text=Hello%20MBR,%20I%20need%20premium%20automotive%20service"
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass-btn liquid-glass-btn-secondary block w-full text-center"
              >
                <span className="luxury-text">Book Premium Service</span>
              </a>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Elegant bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent"></div>
    </motion.nav>
  );
}
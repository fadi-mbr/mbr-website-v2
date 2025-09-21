"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  FaCog,
  FaChartLine,
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
    gauge: 95, // Service availability percentage
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: FaChartLine,
    gauge: 98, // Customer satisfaction
  },
  {
    id: 'team',
    label: 'Team',
    icon: FaUsers,
    gauge: 87, // Team capacity
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: FaEnvelope,
    gauge: 100, // Availability
  },
];

export default function DashboardNavigation({ currentSection = 'services' }: NavigationProps) {
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
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
        ease: "easeOut"
      }
    })
  };

  return (
    <motion.nav
      className={`nav-dashboard fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrollY > 50 ? 'bg-black/95' : 'bg-black/80'
      }`}
      variants={navVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.div
            className="flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Link href="/" className="flex items-center">
              <Image
                src="/images/Logo_horizontal.svg"
                alt="MBR Auto Services"
                width={180}
                height={60}
                className="h-12 w-auto"
                priority
              />
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigationItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  custom={index}
                  className="nav-item group"
                >
                  <Link
                    href={`#${item.id}`}
                    className="flex items-center space-x-2 relative"
                  >
                    {/* Icon with Gauge */}
                    <div className="relative">
                      <item.icon className="h-5 w-5" />
                      {/* Mini Gauge Indicator */}
                      <div className="absolute -bottom-1 -right-1 w-3 h-3">
                        <svg className="w-3 h-3 transform -rotate-90" viewBox="0 0 20 20">
                          <circle
                            cx="10"
                            cy="10"
                            r="8"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="transparent"
                            opacity="0.3"
                          />
                          <circle
                            cx="10"
                            cy="10"
                            r="8"
                            stroke="var(--hud-blue)"
                            strokeWidth="2"
                            fill="transparent"
                            strokeDasharray={`${item.gauge * 0.5} 50`}
                            className="transition-all duration-500"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Label */}
                    <span className="text-sm font-medium tracking-wide">
                      {item.label}
                    </span>

                    {/* Gauge Value */}
                    <span className="hud-text text-xs">
                      {item.gauge}%
                    </span>

                    {/* Hover Indicator */}
                    <div className="nav-indicator"></div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <motion.a
              href="https://wa.me/+971565015800?text=Hello%20MBR,%20I%20need%20automotive%20service"
              target="_blank"
              rel="noopener noreferrer"
              className="hud-element px-6 py-2 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="hud-text">Book Service</span>
            </motion.a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className="hud-element p-2 rounded-md"
              whileTap={{ scale: 0.95 }}
            >
              {isOpen ? (
                <FaTimes className="h-6 w-6 text-white" />
              ) : (
                <FaBars className="h-6 w-6 text-white" />
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
          <div className="px-2 pt-2 pb-3 space-y-1 bg-black/90 border-t border-gray-800">
            {navigationItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={`#${item.id}`}
                  className="nav-item flex items-center space-x-3 block px-3 py-2 text-base font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  <span className="hud-text text-sm ml-auto">
                    {item.gauge}%
                  </span>
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
                href="https://wa.me/+971565015800?text=Hello%20MBR,%20I%20need%20automotive%20service"
                target="_blank"
                rel="noopener noreferrer"
                className="hud-element block w-full text-center px-4 py-2 text-sm font-medium rounded-lg"
              >
                <span className="hud-text">Book Service via WhatsApp</span>
              </a>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Dashboard Grid Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-px opacity-30">
        <div className="h-full bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
      </div>
    </motion.nav>
  );
}
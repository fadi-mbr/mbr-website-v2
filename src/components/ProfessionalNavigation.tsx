"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { trackNavigation } from '@/lib/analytics';

interface NavigationProps {
  currentSection?: string;
}

/* Post-Wave-2 section ids:
 *   - trusted-brands (BrandsStrip)
 *   - services       (SophisticatedServices)
 *   - workshop       (OurWorkshop)
 *   - why-mbr        (WhyMbr)
 *   - reviews        (SophisticatedReviews)
 *   - contact        (ContactSection)
 * The pre-revamp "about" and "team" anchors are gone — they were folded
 * into Why MBR. The nav reflects the current information architecture. */
const navigationItems = [
  { id: 'services', label: 'Services' },
  { id: 'workshop', label: 'Workshop' },
  { id: 'why-mbr', label: 'Why MBR' },
  { id: 'team', label: 'Team' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'contact', label: 'Contact' },
];

export default function ProfessionalNavigation({ currentSection = 'home' }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      
      // Detect active section based on scroll position
      const sections = navigationItems.map(item => {
        const element = document.getElementById(item.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          return {
            id: item.id,
            top: rect.top,
            bottom: rect.bottom,
          };
        }
        return null;
      }).filter(Boolean);

      const current = sections.find(
        section => section && section.top <= 100 && section.bottom >= 100
      );
      
      if (current) {
        setActiveSection(current.id);
      } else if (window.scrollY < 100) {
        setActiveSection('');
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      className={`nav-luxury-enhanced ${scrolled ? 'nav-scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container-luxury">
        <div className="flex items-center justify-between h-20">

          {/* Logo with enhanced hover effect */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Link href="/" className="flex-shrink-0 relative group">
            <Image
              src="/images/Logo_horizontal.svg"
              alt="MBR Making Better Rides - Premium Car Repair Dubai, Luxury Auto Service UAE"
              width={140}
              height={45}
                className="logo-md opacity-95 transition-all duration-300 group-hover:opacity-100 group-hover:brightness-110"
              priority
            />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
          </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.4 }}
              >
                <Link
                href={`#${item.id}`}
                  className={`nav-link-enhanced ${activeSection === item.id ? 'nav-link-active' : ''}`}
                  onClick={() => trackNavigation(item.id, 'desktop')}
              >
                  <span className="nav-link-text">{item.label}</span>
                  <motion.div
                    className="nav-link-underline"
                    initial={false}
                    animate={{
                      width: activeSection === item.id ? '100%' : '0%',
                      opacity: activeSection === item.id ? 1 : 0
                    }}
                    transition={{ duration: 0.3 }}
                  />
              </Link>
              </motion.div>
            ))}
          </div>

          {/* Persistent Enquire CTA.
              Anchors to the Contact section so the visitor picks their
              channel (WhatsApp, live chat, call, email, visit). The
              floating Chatwoot launcher remains available at all times
              for one-click chat on desktop. */}
          <motion.div
            className="hidden md:block"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <Link
              href="/#contact"
              onClick={() => trackNavigation('contact', 'desktop_enquire')}
              className="liquid-glass-btn liquid-glass-btn-primary liquid-glass-btn-small has-shimmer uppercase inline-block"
              style={{ letterSpacing: '0.18em', fontSize: '0.78rem' }}
            >
              Enquire
            </Link>
          </motion.div>

          {/* Mobile Menu Button */}
          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-white hover:text-red-400 transition-colors relative z-50"
            aria-label="Toggle menu"
            whileTap={{ scale: 0.9 }}
          >
            <div className="relative w-6 h-6">
              <motion.svg
                className="w-6 h-6 absolute inset-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
                initial={false}
                animate={isOpen ? { rotate: 90 } : { rotate: 0 }}
                transition={{ duration: 0.3 }}
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
              </motion.svg>
            </div>
          </motion.button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
        {isOpen && (
          <motion.div
              className="md:hidden py-6 border-t border-white/20 backdrop-blur-xl bg-black/50"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
              <div className="space-y-2">
                {navigationItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.1, duration: 0.2 }}
                  >
                <Link
                  href={`#${item.id}`}
                      className={`block nav-link-mobile ${activeSection === item.id ? 'nav-link-mobile-active' : ''}`}
                  onClick={() => {
                    setIsOpen(false);
                    trackNavigation(item.id, 'mobile');
                  }}
                >
                  {item.label}
                </Link>
                  </motion.div>
              ))}

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.2 }}
                  className="pt-4"
                >
              <Link
                href="/#contact"
                className="block w-full liquid-glass-btn liquid-glass-btn-primary text-center has-shimmer uppercase"
                style={{ letterSpacing: '0.18em', fontSize: '0.85rem' }}
                onClick={() => {
                  setIsOpen(false);
                  trackNavigation('contact', 'mobile_enquire');
                }}
              >
                Enquire
              </Link>
                </motion.div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
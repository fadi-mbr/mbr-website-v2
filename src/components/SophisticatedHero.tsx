"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  FaVolumeUp,
  FaVolumeMute,
  FaPlay,
  FaPause,
  FaStar,
  FaGoogle,
  FaInstagram,
  FaFacebook,
  FaMapMarkerAlt,
  FaWhatsapp,
  FaCalendarAlt,
} from 'react-icons/fa';
import { useGoogleReviews } from './GoogleReviewsHook';
import { isShopOpen } from '@/lib/business-hours';
import { triggerChat } from '@/lib/chat-cta';
import CountUp from './CountUp';

interface SophisticatedHeroProps {
  googleReviews?: {
    overallRating: number;
    totalReviews: number;
  };
}

export default function SophisticatedHero({
  googleReviews = { overallRating: 4.9, totalReviews: 883 }
}: SophisticatedHeroProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch live Google Reviews data
  const { data: reviewsData, loading: reviewsLoading } = useGoogleReviews();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);
      setIsOpen(isShopOpen(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="relative">
      {/* Full Screen Video Section */}
      <section className="relative w-full h-screen overflow-hidden">
        {/* Video Background */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          poster="/images/hero-poster.jpg"
          className="absolute top-0 left-0 w-full h-full object-cover"
        >
          <source
            src="https://cdn.mbrme.com/video_1_714a98022b6341a8b723dc3105772546.mp4"
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>

        {/* Minimal Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />

        {/* Subtle Corner Elements */}
        <motion.div
          className="absolute top-8 left-8 z-20"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 0.6, x: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <Image
            src="/images/MBR_Logo_shield.svg"
            alt="MBR Auto Services. Luxury and Exotic Car Workshop, Dubai"
            width={56}
            height={56}
            className="opacity-75 w-12 h-12 md:w-14 md:h-14"
          />
        </motion.div>

        {/* Status Indicator - Top Right */}
        <motion.div
          className="absolute top-8 right-8 z-20"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          {isOpen ? (
            <div className="backdrop-blur-sm bg-black/20 border border-white/10 rounded-full px-4 py-2 flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-white text-sm font-light">Open Now</span>
              <div className="text-white/60 text-xs">
                {currentTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Asia/Dubai',
                })}
              </div>
            </div>
          ) : (
            <a
              href="https://wa.me/+971565015800?text=Hello%20MBR%2C%20I%20need%20after-hours%20assistance"
              target="_blank"
              rel="noopener noreferrer"
              className="group backdrop-blur-sm bg-black/30 border border-white/15 hover:border-[var(--primary)]/50 rounded-full px-4 py-2 flex items-center gap-3 transition-colors"
              aria-label="Closed now. WhatsApp for after-hours assistance"
            >
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-white text-sm font-light">Closed</span>
              <span className="hidden sm:inline text-white/40 text-xs">·</span>
              <span className="hidden sm:inline text-accent-bronze text-xs uppercase tracking-[0.18em] group-hover:text-white transition-colors">
                WhatsApp after-hours
              </span>
            </a>
          )}
        </motion.div>

        {/* Video Controls - Bottom Right */}
        <motion.div
          className="absolute bottom-8 right-8 z-20 flex space-x-3"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.8 }}
        >
          <button
            onClick={togglePlay}
            className="liquid-glass-control"
            aria-label={isPlaying ? "Pause video" : "Play video"}
          >
            {isPlaying ? <FaPause className="w-4 h-4" /> : <FaPlay className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleMute}
            className="liquid-glass-control"
            aria-label={isMuted ? "Unmute video" : "Mute video"}
          >
            {isMuted ? <FaVolumeMute className="w-4 h-4" /> : <FaVolumeUp className="w-4 h-4" />}
          </button>
        </motion.div>

        {/* Reviews Badge & Instagram - Bottom Left */}
        <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-3">
          {/* Instagram Icon */}
          <motion.a
            href="https://www.instagram.com/mbr.auto/"
            target="_blank"
            rel="noopener noreferrer"
            className="backdrop-blur-sm bg-black/30 border border-white/20 rounded-full p-3 md:p-4 flex items-center justify-center shadow-lg hover:bg-black/40 transition-all duration-300 hover:scale-110"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.3, duration: 0.8 }}
            aria-label="Follow us on Instagram"
          >
            <FaInstagram className="text-pink-500 text-xl md:text-2xl" />
          </motion.a>

          {/* Google Reviews Badge */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 0.8 }}
        >
          <div className="backdrop-blur-sm bg-black/30 border border-white/20 rounded-3xl p-3 md:p-4 flex items-center space-x-2 md:space-x-3 shadow-lg max-w-full overflow-hidden">
            <div className="flex items-center space-x-1 md:space-x-2">
              <FaGoogle className="text-red-500 text-sm md:text-base" />
              <FaStar className="text-star-gold text-sm md:text-base" />
              <span className="text-white font-bold text-sm md:text-lg">
                {reviewsLoading ? '4.9' : (reviewsData?.overallRating || googleReviews?.overallRating || 4.9)}
              </span>
            </div>
            <div className="text-left">
              <div className="text-white font-semibold text-xs md:text-sm">
                {reviewsLoading ? '883' : (reviewsData?.totalReviews || googleReviews?.totalReviews || 883).toLocaleString()}
              </div>
              <div className="text-red-400 text-xs font-medium uppercase tracking-wide">
                Reviews
              </div>
            </div>
          </div>
        </motion.div>
        </div>
      </section>

      {/* Subtle Relocation Note */}
      <a
        href="https://maps.app.goo.gl/gj9EXG4uchRBtZcE6"
        target="_blank"
        rel="noopener noreferrer"
        className="group block bg-black border-t border-white/5 hover:bg-white/[0.02] transition-colors duration-300"
        aria-label="Get directions to our new location in Al Quoz Industrial 4"
      >
        <div className="container-luxury flex items-center justify-center gap-2 py-3 text-xs md:text-sm text-white/50 group-hover:text-white/80 transition-colors duration-300">
          <FaMapMarkerAlt className="w-3 h-3 text-[#E30613]/70 group-hover:text-[#E30613] transition-colors" />
          <span className="font-light tracking-wide">
            Now relocated to Al Quoz Industrial 4 &middot; Dubai
          </span>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true">&rarr;</span>
        </div>
      </a>

      {/* Content Section Below Video */}
      <section className="relative bg-gradient-to-b from-black via-black to-gray-950 py-20 vibrant-bg-gradient">
        <div className="container-luxury">

          {/* Main Hero Content — wordmark is already in the video corner;
              we don't repeat it here. */}
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <div className="max-w-4xl mx-auto">
              <p className="text-eyebrow mb-5">
                Trusted by Ferrari · Lamborghini · Rolls-Royce owners
              </p>
              <h1 className="font-display text-white font-light mb-6 leading-[1.05] tracking-[-0.025em] text-[clamp(2.5rem,6vw,5rem)]">
                Service that lives up <br className="hidden md:inline" />
                to the badge.
              </h1>
              <p className="text-subheading text-[var(--text-body)] mb-10 leading-relaxed max-w-2xl mx-auto">
                Independent luxury &amp; exotic-car workshop in Dubai.
                Bosch-authorised, Leonardo-equipped, OEM parts only.
              </p>

              {/* Tabular stat strip — Fraunces serif numerals, four beats.
                  This is the brand-anchor moment under the headline. */}
              <div className="mt-2 mb-12 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 md:gap-x-4 max-w-3xl mx-auto motion-calm">
                {[
                  { to: 4.9, decimals: 1, suffix: '★', label: 'Google rating' },
                  { to: 5000, suffix: '+', label: 'Cars serviced' },
                  { to: 12, suffix: '+', label: 'Marques' },
                  { to: 100, suffix: '%', label: 'OEM parts' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center flex flex-col items-center">
                    <div
                      className="font-display font-light text-white leading-none tracking-tight"
                      style={{
                        fontSize: 'clamp(2.25rem, 4.5vw, 3.5rem)',
                        fontFeatureSettings: '"tnum" 1, "lnum" 1',
                      }}
                    >
                      <CountUp to={stat.to} decimals={stat.decimals ?? 0} />
                      <span className="text-[var(--primary)]">{stat.suffix}</span>
                    </div>
                    <div
                      className="h-px w-8 mt-3 mb-2"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent, var(--accent-bronze) 50%, transparent)',
                      }}
                      aria-hidden="true"
                    />
                    <div className="text-eyebrow text-[0.65rem] md:text-[0.75rem]">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dual primary CTAs — Chat is the dominant action; Book is a
                ghost option (bronze-bordered, smaller, less colour). */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center items-stretch sm:items-center mb-12">
              <button
                type="button"
                onClick={() => triggerChat('hero_primary')}
                className="liquid-glass-btn liquid-glass-btn-primary liquid-glass-btn-large has-shimmer inline-flex items-center justify-center gap-3"
              >
                <FaWhatsapp className="w-5 h-5" />
                <span>Chat with us</span>
              </button>

              <Link
                href="/book"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm tracking-wide text-[var(--text-body)] hover:text-white border border-[var(--accent-bronze)]/40 hover:border-[var(--accent-bronze)] hover:bg-[var(--accent-bronze)]/10 transition-all duration-300"
              >
                <FaCalendarAlt className="w-3.5 h-3.5" />
                <span>Book Directly</span>
              </Link>
            </div>

            {/* Credentials ticker — slow 60s horizontal scroll, uppercase
                Geist sans (via .text-eyebrow), bronze dot separators, fades
                at edges. Soft brand-voice signal without competing with the
                main copy above. */}
            <div className="relative overflow-hidden mb-12 -mx-6 md:mx-0">
              <div
                className="pointer-events-none absolute inset-y-0 left-0 w-12 md:w-24 z-10"
                style={{ background: 'linear-gradient(90deg, var(--background), transparent)' }}
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute inset-y-0 right-0 w-12 md:w-24 z-10"
                style={{ background: 'linear-gradient(-90deg, var(--background), transparent)' }}
                aria-hidden="true"
              />
              <div className="flex hero-credential-track" aria-hidden="true">
                {[0, 1].map((dupKey) => (
                  <div key={dupKey} className="flex shrink-0 items-center gap-14 md:gap-20 pr-14 md:pr-20 text-eyebrow text-[var(--text-subtle)] opacity-70" style={{ fontSize: '0.6rem', letterSpacing: '0.32em' }}>
                    <span>Bosch Authorised</span>
                    <span className="text-[var(--primary)]">·</span>
                    <span>Leonardo Diagnostics</span>
                    <span className="text-[var(--primary)]">·</span>
                    <span>OEM-Level Tooling</span>
                    <span className="text-[var(--primary)]">·</span>
                    <span>Genuine OEM Parts</span>
                    <span className="text-[var(--primary)]">·</span>
                    <span>Independent Workshop</span>
                    <span className="text-[var(--primary)]">·</span>
                    <span>Al Quoz Industrial 4</span>
                    <span className="text-[var(--primary)]">·</span>
                  </div>
                ))}
              </div>
              <span className="sr-only">
                Bosch Authorised, Leonardo Diagnostics, OEM-Level Tooling, Genuine OEM Parts, Independent Workshop, Al Quoz Industrial 4.
              </span>
            </div>

            {/* Social Media Links */}
            <motion.div
              className="flex justify-center items-center gap-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
              viewport={{ once: true }}
            >
              <a
                href="https://www.instagram.com/mbr.auto/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center w-12 h-12 rounded-full glass-card hover:bg-white/10 transition-all duration-300 hover:scale-110"
                aria-label="Follow us on Instagram"
              >
                <FaInstagram className="w-5 h-5 text-pink-500 group-hover:text-pink-400 transition-colors" />
              </a>
              <a
                href="https://www.facebook.com/mbrautoservices/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center w-12 h-12 rounded-full glass-card hover:bg-white/10 transition-all duration-300 hover:scale-110"
                aria-label="Follow us on Facebook"
              >
                <FaFacebook className="w-5 h-5 text-blue-500 group-hover:text-blue-400 transition-colors" />
              </a>
            </motion.div>

            {/* Scroll cue — horizontal hairline + 911Porsche SCROLL label.
                Replaces the bouncing chevron. The hairline animates its
                left edge inward on hover (subtle, intentional). */}
            <motion.a
              href="#trusted-brands"
              className="mt-16 inline-flex items-center gap-4 text-[var(--text-muted)] hover:text-white transition-colors group"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.8 }}
              aria-label="Scroll to the next section"
            >
              <span className="block h-px w-12 md:w-20 bg-[var(--text-muted)] group-hover:bg-[var(--accent-bronze)] transition-colors duration-300" />
              <span className="text-marker group-hover:text-white transition-colors">
                Scroll
              </span>
              <span className="block h-px w-12 md:w-20 bg-[var(--text-muted)] group-hover:bg-[var(--accent-bronze)] transition-colors duration-300" />
            </motion.a>
          </motion.div>

          {/* Wave 2/B note: the old hero stat grid (15+ / 5,000+) and the
              Bosch Partnership highlight block both moved into the dedicated
              WhyMbr section. We don't repeat them here — keeps the hero
              breathing and pushes the visitor into the section scroll. */}
        </div>
      </section>
    </div>
  );
}
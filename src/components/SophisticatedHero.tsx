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

interface SophisticatedHeroProps {
  googleReviews?: {
    overallRating: number;
    totalReviews: number;
  };
}

export default function SophisticatedHero({
  googleReviews = { overallRating: 4.8, totalReviews: 883 }
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
            src="/images/Logo_horizontal.svg"
            alt="MBR Making Better Rides - Premium Car Repair Dubai, Luxury Auto Service UAE"
            width={140}
            height={32}
            className="logo-sm opacity-60"
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
              aria-label="Closed now — WhatsApp for after-hours assistance"
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
                {reviewsLoading ? '4.8' : (reviewsData?.overallRating || googleReviews?.overallRating || 4.8)}
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
              <h1 className="text-display font-light gradient-text mb-8 leading-tight">
                Dubai&rsquo;s Independent Luxury &amp; Exotic-Car Workshop
              </h1>
              <p className="text-subheading text-[var(--text-body)] mb-12 leading-relaxed max-w-2xl mx-auto">
                Bosch-authorised. Leonardo exotic diagnostics. OEM-level
                tooling and genuine OEM parts. Fifteen years in Al Quoz
                Industrial 4.
              </p>
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

            {/* Credentials ticker — slow 60s horizontal scroll, 911Porsche
                lettering, fades at edges. Soft brand-voice signal without
                competing with the main copy above. */}
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
                  <div key={dupKey} className="flex shrink-0 items-center gap-12 md:gap-16 pr-12 md:pr-16 text-eyebrow text-[var(--text-muted)]">
                    <span>Bosch Authorised</span>
                    <span className="text-[var(--accent-bronze)]">·</span>
                    <span>Leonardo Diagnostics</span>
                    <span className="text-[var(--accent-bronze)]">·</span>
                    <span>OEM-Level Tooling</span>
                    <span className="text-[var(--accent-bronze)]">·</span>
                    <span>15+ Years</span>
                    <span className="text-[var(--accent-bronze)]">·</span>
                    <span>5,000+ Owners</span>
                    <span className="text-[var(--accent-bronze)]">·</span>
                    <span>Al Quoz Industrial 4</span>
                    <span className="text-[var(--accent-bronze)]">·</span>
                  </div>
                ))}
              </div>
              <span className="sr-only">
                Bosch Authorised, Leonardo Diagnostics, OEM-Level Tooling, 15+ years, 5,000+ owners, Al Quoz Industrial 4.
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

          {/* Key Highlights Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            viewport={{ once: true }}
          >
            <div className="text-center group cursor-pointer">
              <div className="glass-card has-shimmer p-8 hover:glow-red transition-all duration-300">
                <div className="text-4xl font-light gradient-text-vibrant mb-4">15+</div>
                <div className="text-lg text-luxury-silver mb-2">Years</div>
                <div className="text-sm text-muted-enhanced">Excellence in Dubai</div>
              </div>
            </div>

            <div className="text-center group cursor-pointer">
              <div className="glass-card has-shimmer p-8 hover:glow-red transition-all duration-300">
                <div className="text-4xl font-light gradient-text-vibrant mb-4">5000+</div>
                <div className="text-lg text-luxury-silver mb-2">Customers</div>
                <div className="text-sm text-muted-enhanced">Trust Our Service</div>
              </div>
            </div>
          </motion.div>

          {/* Bosch Partnership Highlight */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 glass-card-premium p-6 md:p-8">
              <Image
                src="/images/Bosch_Logo24.webp"
                alt="Bosch Authorized Service Partner - Certified Premium Car Service Dubai, UAE | MBR Auto Services"
                width={120}
                height={64}
                className="h-12 md:h-16 w-auto opacity-80"
              />
              <div className="text-center md:text-left">
                <h3 className="text-lg md:text-xl font-light text-white mb-2">
                  Bosch Authorized Service Center
                </h3>
                <p className="text-sm md:text-base text-muted-enhanced">
                  Certified quality and genuine parts guarantee
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </section>
    </div>
  );
}
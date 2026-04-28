"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { FaVolumeUp, FaVolumeMute, FaPlay, FaPause, FaStar, FaGoogle, FaInstagram, FaFacebook, FaMapMarkerAlt } from 'react-icons/fa';
import { useGoogleReviews } from './GoogleReviewsHook';
import { trackWhatsAppClick } from '@/lib/analytics';

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

  // Calculate business status
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);
      const hour = now.getHours();
      const minute = now.getMinutes();
      const day = now.getDay();
      // Monday-Saturday 8:30-19:30, Sunday closed
      if (day === 0) {
        setIsOpen(false);
      } else {
        // Check if current time is between 8:30 AM and 7:30 PM
        const currentMinutes = hour * 60 + minute;
        const openMinutes = 8 * 60 + 30; // 8:30 AM
        const closeMinutes = 19 * 60 + 30; // 7:30 PM
        setIsOpen(currentMinutes >= openMinutes && currentMinutes < closeMinutes);
      }
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
            className="h-8 w-auto opacity-60"
          />
        </motion.div>

        {/* Status Indicator - Top Right */}
        <motion.div
          className="absolute top-8 right-8 z-20"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <div className="backdrop-blur-sm bg-black/20 border border-white/10 rounded-full px-4 py-2 flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-white text-sm font-light">
              {isOpen ? 'Open Now' : 'Closed'}
            </span>
            <div className="text-white/60 text-xs">
              {currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Dubai'
              })}
            </div>
          </div>
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

        {/* Relocation Pill - Top Center */}
        <motion.a
          href="https://maps.app.goo.gl/gj9EXG4uchRBtZcE6"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-20 md:top-24 left-1/2 -translate-x-1/2 z-20 max-w-[90vw] backdrop-blur-sm bg-black/30 border border-white/20 rounded-3xl md:rounded-full px-4 md:px-5 py-2 md:py-2.5 flex items-center gap-2 shadow-lg hover:bg-black/40 transition-all duration-300 hover:scale-105 group"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.8 }}
          aria-label="Get directions to our new location in Al Quoz Industrial 4"
        >
          <FaMapMarkerAlt className="flex-shrink-0 text-[#E30613] text-[0.9rem] md:text-[1.05rem]" />
          <span className="text-white font-light tracking-wide leading-snug text-center text-[0.9rem] md:text-[1.05rem]">
            Now relocated to Al Quoz Industrial 4 &middot; Dubai
          </span>
          <span className="text-white/50 group-hover:text-white transition-colors text-[0.9rem] md:text-[1.05rem]" aria-hidden="true">
            &rarr;
          </span>
        </motion.a>

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
              <FaStar className="text-luxury-gold text-sm md:text-base" />
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

      {/* Content Section Below Video */}
      <section className="relative bg-gradient-to-b from-black via-black to-gray-950 py-20 vibrant-bg-gradient">
        <div className="container-luxury">

          {/* Main Hero Content */}
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <div className="mb-8 flex justify-center">
              <Image
                src="/images/Logo_horizontal.svg"
                alt="MBR Making Better Rides - Premium Car Repair Dubai, Luxury Auto Service UAE"
                width={400}
                height={150}
                className="w-auto h-24 md:h-32 lg:h-40 object-contain filter brightness-100"
                priority
              />
            </div>
            <div className="max-w-4xl mx-auto">
              <p className="text-xl md:text-2xl font-light gradient-text mb-4">
                Expert Car Care in Dubai
              </p>
              <p className="text-lg text-muted-enhanced mb-12">
                Premium Automotive Excellence • Trusted by 5,000+ Customers • 15+ Years Experience
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
              <a
                href="https://wa.me/+971565015800?text=Hello%20MBR,%20I%20need%20premium%20automotive%20service"
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass-btn liquid-glass-btn-primary liquid-glass-btn-large"
                onClick={() => trackWhatsAppClick('hero_sophisticated', 'Book Premium Service')}
              >
                Book Premium Service
              </a>

              <a
                href="#services"
                className="liquid-glass-btn liquid-glass-btn-secondary liquid-glass-btn-large"
              >
                Explore Services
              </a>
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
          </motion.div>

          {/* Key Highlights Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            viewport={{ once: true }}
          >
            <div className="text-center group cursor-pointer">
              <div className="glass-card glass-shimmer p-8 hover:glow-red transition-all duration-300">
                <div className="text-4xl font-light gradient-text-vibrant mb-4">15+</div>
                <div className="text-lg text-luxury-silver mb-2">Years</div>
                <div className="text-sm text-muted-enhanced">Excellence in Dubai</div>
              </div>
            </div>

            <div className="text-center group cursor-pointer">
              <div className="glass-card glass-shimmer p-8 hover:glow-red transition-all duration-300">
                <div className="text-4xl font-light gradient-text-vibrant mb-4">5000+</div>
                <div className="text-lg text-luxury-silver mb-2">Customers</div>
                <div className="text-sm text-muted-enhanced">Trust Our Service</div>
              </div>
            </div>

            <div className="text-center group cursor-pointer">
              <div className="glass-card glass-shimmer p-8 hover:glow-red transition-all duration-300">
                <div className="text-4xl font-light gradient-text-vibrant mb-4">24/7</div>
                <div className="text-lg text-luxury-silver mb-2">Emergency</div>
                <div className="text-sm text-muted-enhanced">Support Available</div>
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
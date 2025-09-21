"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { FaVolumeUp, FaVolumeMute, FaPlay, FaPause, FaStar, FaGoogle } from 'react-icons/fa';
import { useGoogleReviews } from './GoogleReviewsHook';

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
      const day = now.getDay();
      // Monday-Saturday 8:30-19:30, Sunday closed
      if (day === 0) {
        setIsOpen(false);
      } else {
        setIsOpen(hour >= 8 && hour < 19);
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
            alt="MBR Auto Services"
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

        {/* Reviews Badge - Bottom Left */}
        <motion.div
          className="absolute bottom-4 left-4 z-20"
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
      </section>

      {/* Content Section Below Video */}
      <section className="relative bg-gradient-to-b from-black via-black to-gray-950 py-20">
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
                alt="MBR Auto Services"
                width={400}
                height={150}
                className="w-auto h-24 md:h-32 lg:h-40 object-contain filter brightness-100"
                priority
              />
            </div>
            <div className="max-w-4xl mx-auto">
              <p className="text-xl md:text-2xl font-light text-body-enhanced mb-4">
                Expert Car Care in Dubai
              </p>
              <p className="text-lg text-muted-enhanced mb-12">
                Premium Automotive Excellence • Trusted by 5,000+ Customers • 15+ Years Experience
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <a
                href="https://wa.me/+971565015800?text=Hello%20MBR,%20I%20need%20premium%20automotive%20service"
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass-btn liquid-glass-btn-primary liquid-glass-btn-large"
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
              <div className="glass-card p-8">
                <div className="text-4xl font-light text-white mb-4">15+</div>
                <div className="text-lg text-luxury-silver mb-2">Years</div>
                <div className="text-sm text-muted-enhanced">Excellence in Dubai</div>
              </div>
            </div>

            <div className="text-center group cursor-pointer">
              <div className="glass-card p-8">
                <div className="text-4xl font-light text-white mb-4">5000+</div>
                <div className="text-lg text-luxury-silver mb-2">Customers</div>
                <div className="text-sm text-muted-enhanced">Trust Our Service</div>
              </div>
            </div>

            <div className="text-center group cursor-pointer">
              <div className="glass-card p-8">
                <div className="text-4xl font-light text-white mb-4">24/7</div>
                <div className="text-lg text-luxury-silver mb-2">Support</div>
                <div className="text-sm text-muted-enhanced">Always Available</div>
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
                alt="Bosch Authorized Service"
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
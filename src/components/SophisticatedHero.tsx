"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { FaVolumeUp, FaVolumeMute, FaPlay, FaPause, FaStar } from 'react-icons/fa';

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
            className="backdrop-blur-sm bg-black/20 border border-white/20 rounded-full p-3 text-white hover:bg-black/40 transition-all duration-300"
            aria-label={isPlaying ? "Pause video" : "Play video"}
          >
            {isPlaying ? <FaPause className="w-4 h-4" /> : <FaPlay className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleMute}
            className="backdrop-blur-sm bg-black/20 border border-white/20 rounded-full p-3 text-white hover:bg-black/40 transition-all duration-300"
            aria-label={isMuted ? "Unmute video" : "Mute video"}
          >
            {isMuted ? <FaVolumeMute className="w-4 h-4" /> : <FaVolumeUp className="w-4 h-4" />}
          </button>
        </motion.div>

        {/* Reviews Badge - Bottom Left */}
        <motion.div
          className="absolute bottom-8 left-8 z-20"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 0.8 }}
        >
          <div className="backdrop-blur-sm bg-black/20 border border-white/10 rounded-2xl p-4 flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <FaStar className="text-yellow-400 text-lg" />
              <span className="text-white font-semibold text-lg">
                {googleReviews?.overallRating || 4.8}
              </span>
            </div>
            <div className="text-white/80 text-sm">
              {(googleReviews?.totalReviews || 883).toLocaleString()} reviews
            </div>
          </div>
        </motion.div>
      </section>

      {/* Content Section Below Video */}
      <section className="relative bg-gradient-to-b from-black via-gray-900 to-black py-20">
        <div className="container-luxury">

          {/* Main Hero Content */}
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <h1 className="text-6xl md:text-8xl font-extralight text-white mb-8 tracking-tight">
              Making Better Rides
            </h1>
            <div className="max-w-4xl mx-auto">
              <p className="text-xl md:text-2xl font-light text-gray-300 mb-4">
                Expert Car Care in Dubai
              </p>
              <p className="text-lg text-gray-400 mb-12">
                Premium Automotive Excellence • Trusted by 5,000+ Customers • 15+ Years Experience
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <a
                href="https://wa.me/+971565015800?text=Hello%20MBR,%20I%20need%20premium%20automotive%20service"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white font-medium text-lg rounded-none overflow-hidden transition-all duration-500 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <span className="relative">Book Premium Service</span>
              </a>

              <a
                href="#services"
                className="group px-8 py-4 border-2 border-white/30 text-white font-medium text-lg rounded-none backdrop-blur-sm hover:border-white/60 hover:bg-white/10 transition-all duration-500"
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
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:border-white/20 transition-all duration-500 hover:scale-105">
                <div className="text-4xl font-light text-white mb-4">15+</div>
                <div className="text-lg text-gray-300 mb-2">Years</div>
                <div className="text-sm text-gray-500">Excellence in Dubai</div>
              </div>
            </div>

            <div className="text-center group cursor-pointer">
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:border-white/20 transition-all duration-500 hover:scale-105">
                <div className="text-4xl font-light text-white mb-4">5000+</div>
                <div className="text-lg text-gray-300 mb-2">Customers</div>
                <div className="text-sm text-gray-500">Trust Our Service</div>
              </div>
            </div>

            <div className="text-center group cursor-pointer">
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:border-white/20 transition-all duration-500 hover:scale-105">
                <div className="text-4xl font-light text-white mb-4">24/7</div>
                <div className="text-lg text-gray-300 mb-2">Support</div>
                <div className="text-sm text-gray-500">Always Available</div>
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
            <div className="inline-flex items-center space-x-6 bg-gradient-to-r from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-white/10 p-8 rounded-3xl">
              <Image
                src="/images/Bosch_Logo24.webp"
                alt="Bosch Authorized Service"
                width={120}
                height={64}
                className="h-16 w-auto opacity-80"
              />
              <div className="text-left">
                <h3 className="text-xl font-light text-white mb-2">
                  Bosch Authorized Service Center
                </h3>
                <p className="text-gray-400">
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
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  FaVolumeUp,
  FaVolumeMute,
  FaStar,
  FaClock,
  FaPhone,
  FaMapMarkerAlt,
  FaAward
} from 'react-icons/fa';

interface LuxuryHeroProps {
  googleReviews?: {
    overallRating: number;
    totalReviews: number;
  };
}

export default function LuxuryHero({
  googleReviews = { overallRating: 4.8, totalReviews: 883 }
}: LuxuryHeroProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2
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

  return (
    <motion.div
      className="relative w-full h-screen bg-black overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Main Content Grid */}
      <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 gap-4 p-6 z-10">

        {/* Top Left: Logo */}
        <motion.div
          className="col-span-4 row-span-1 flex items-center"
          variants={itemVariants}
        >
          <div className="luxury-panel p-4 w-full">
            <Image
              src="/images/Logo_horizontal.svg"
              alt="MBR Auto Services"
              width={200}
              height={80}
              className="h-12 w-auto opacity-90"
              priority
            />
          </div>
        </motion.div>

        {/* Top Right: Reviews & Status */}
        <motion.div
          className="col-span-4 col-start-9 row-span-1 flex items-center justify-end"
          variants={itemVariants}
        >
          <div className="luxury-panel p-4 flex items-center space-x-6">
            {/* Google Reviews */}
            <div className="text-center">
              <div className="flex items-center space-x-1 mb-1">
                <FaStar className="text-yellow-400 text-sm" />
                <span className="luxury-text font-semibold">
                  {googleReviews?.overallRating || 4.8}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                {googleReviews?.totalReviews || 883} reviews
              </div>
            </div>

            {/* Status */}
            <div className="text-center">
              <div className="flex items-center space-x-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="luxury-text text-sm">{isOpen ? 'Open' : 'Closed'}</span>
              </div>
              <div className="text-xs text-gray-400">
                {currentTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Asia/Dubai'
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Center: Video Showcase */}
        <motion.div
          className="col-span-6 col-start-4 row-span-4 row-start-2 relative"
          variants={itemVariants}
        >
          {/* Video Container with Elegant Frame */}
          <div className="relative w-full h-full rounded-3xl overflow-hidden border-2 border-gold shadow-2xl">
            <video
              ref={videoRef}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="object-cover w-full h-full"
            >
              <source src="https://cdn.mbrme.com/video_1_714a98022b6341a8b723dc3105772546.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Elegant Video Controls */}
            <div className="absolute bottom-4 right-4">
              <button
                onClick={toggleMute}
                className="luxury-panel p-3 rounded-full transition-all duration-300 hover:scale-110"
              >
                {isMuted ? (
                  <FaVolumeMute className="text-white text-sm" />
                ) : (
                  <FaVolumeUp className="text-white text-sm" />
                )}
              </button>
            </div>

            {/* Video Title Overlay */}
            <div className="absolute bottom-6 left-6">
              <h2 className="text-white text-lg font-light tracking-wide">
                Excellence in Motion
              </h2>
            </div>
          </div>
        </motion.div>

        {/* Left Side: Services Summary */}
        <motion.div
          className="col-span-3 row-span-4 row-start-2 flex flex-col justify-center"
          variants={itemVariants}
        >
          <div className="elegant-card p-6 space-y-6">
            <h3 className="luxury-text text-xl font-light mb-4">Premium Services</h3>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <FaAward className="text-gold text-sm" />
                <span className="text-white text-sm">Bosch Authorized</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-white text-sm">Mechanical Repairs</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-white text-sm">Electrical Diagnostics</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-white text-sm">Suspension & Steering</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <div className="text-center">
                <div className="luxury-text text-2xl font-light">15+</div>
                <div className="text-xs text-gray-400">Years Excellence</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Contact Information */}
        <motion.div
          className="col-span-3 col-start-10 row-span-4 row-start-2 flex flex-col justify-center"
          variants={itemVariants}
        >
          <div className="elegant-card p-6 space-y-6">
            <h3 className="luxury-text text-xl font-light mb-4">Get in Touch</h3>

            <div className="space-y-4">
              <a
                href="tel:8006272886"
                className="flex items-center space-x-3 group transition-all duration-300 hover:text-gold"
              >
                <FaPhone className="text-gold text-sm" />
                <div>
                  <div className="text-white text-sm group-hover:text-gold transition-colors">800-MBR-AUTO</div>
                  <div className="text-xs text-gray-400">24/7 Support</div>
                </div>
              </a>

              <a
                href="https://maps.app.goo.gl/6A6XeA4Nk4qD8MdRA"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 group transition-all duration-300 hover:text-gold"
              >
                <FaMapMarkerAlt className="text-gold text-sm" />
                <div>
                  <div className="text-white text-sm group-hover:text-gold transition-colors">Al Quoz Industrial 4</div>
                  <div className="text-xs text-gray-400">Dubai, UAE</div>
                </div>
              </a>

              <div className="flex items-center space-x-3">
                <FaClock className="text-gold text-sm" />
                <div>
                  <div className="text-white text-sm">Mon - Sat</div>
                  <div className="text-xs text-gray-400">8:30 AM - 7:30 PM</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <a
                href="https://wa.me/+971565015800?text=Hello%20MBR,%20I%20need%20premium%20automotive%20service"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                Book Service
              </a>
            </div>
          </div>
        </motion.div>

        {/* Bottom: Tagline */}
        <motion.div
          className="col-span-6 col-start-4 row-span-1 row-start-6 flex items-center justify-center"
          variants={itemVariants}
        >
          <div className="luxury-panel p-4 w-full text-center">
            <div className="mb-2 flex justify-center">
              <Image
                src="/images/Logo_horizontal.svg"
                alt="MBR Auto Services"
                width={200}
                height={75}
                className="w-auto h-12 object-contain filter brightness-100"
                priority
              />
            </div>
            <p className="text-gray-400 text-sm mt-1">
              Expert Car Care in Dubai • Premium Automotive Excellence
            </p>
          </div>
        </motion.div>

      </div>

      {/* Subtle Background Gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gradient-to-br from-gold/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-red-600/5 to-transparent rounded-full blur-3xl"></div>
      </div>
    </motion.div>
  );
}
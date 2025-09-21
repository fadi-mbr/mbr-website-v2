"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  FaVolumeUp,
  FaVolumeMute,
  FaPlay,
  FaPause,
  FaStar,
  FaClock,
  FaPhone,
  FaMapMarkerAlt
} from 'react-icons/fa';

interface HeroDashboardProps {
  googleReviews?: {
    overallRating: number;
    totalReviews: number;
  };
}

export default function HeroDashboard({
  googleReviews = { overallRating: 4.8, totalReviews: 883 }
}: HeroDashboardProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Calculate business status (simplified for demo)
  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    // Monday-Saturday 8:30-19:30, Sunday closed
    if (day === 0) {
      setIsOpen(false);
    } else {
      setIsOpen(hour >= 8 && hour < 19);
    }
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

  const hudVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.8,
        ease: "easeOut"
      }
    })
  };

  const gaugeVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        delay: 1,
        duration: 1,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
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

        {/* Dashboard Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50"></div>
      </div>

      {/* HUD Elements Container */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Top HUD Bar */}
        <motion.div
          className="absolute top-24 left-0 right-0 flex justify-between items-start p-6"
          variants={hudVariants}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          {/* Left HUD: Logo */}
          <div className="hud-element p-4 pointer-events-auto">
            <Image
              src="/images/Logo_horizontal.svg"
              alt="MBR Auto Services"
              width={200}
              height={80}
              className="h-16 w-auto opacity-90"
              priority
            />
          </div>

          {/* Right HUD: Performance Gauges */}
          <div className="flex space-x-4">
            {/* Reviews Gauge */}
            <motion.div
              className="gauge-container w-24 h-24 pointer-events-auto"
              variants={gaugeVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="text-center">
                <div className="gauge-value text-xl">{googleReviews.overallRating}</div>
                <div className="gauge-label">Rating</div>
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent"
                style={{
                  background: `conic-gradient(from 0deg, var(--hud-green) 0deg, var(--hud-green) ${(googleReviews.overallRating / 5) * 360}deg, transparent ${(googleReviews.overallRating / 5) * 360}deg)`
                }}
              />
            </motion.div>

            {/* Status Gauge */}
            <motion.div
              className="gauge-container w-24 h-24 pointer-events-auto"
              variants={gaugeVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="text-center">
                <div className={`gauge-value text-xl ${isOpen ? 'text-green-400' : 'text-red-400'}`}>
                  {isOpen ? 'ON' : 'OFF'}
                </div>
                <div className="gauge-label">Status</div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Center HUD: Main Dashboard */}
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center"
          variants={hudVariants}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          <div className="hud-element p-8 max-w-2xl pointer-events-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent">
              PERFORMANCE DASHBOARD
            </h1>
            <p className="hud-text text-lg md:text-xl mb-6">
              Making Better Rides • Expert Car Care in Dubai
            </p>

            {/* Live Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{googleReviews.totalReviews}</div>
                <div className="hud-text text-xs">Reviews</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">98%</div>
                <div className="hud-text text-xs">Satisfaction</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-400">15+</div>
                <div className="hud-text text-xs">Years</div>
              </div>
            </div>

            {/* CTA Button */}
            <motion.a
              href="https://wa.me/+971565015800?text=Hello%20MBR,%20I%20need%20automotive%20service"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gradient-to-r from-red-600 to-red-500 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              INITIATE SERVICE REQUEST
            </motion.a>
          </div>
        </motion.div>

        {/* Bottom HUD: Info Bar */}
        <motion.div
          className="absolute bottom-6 left-0 right-0 flex justify-center"
          variants={hudVariants}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          <div className="hud-element p-4 max-w-4xl w-full mx-4 pointer-events-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              {/* Hours */}
              <div className="flex items-center justify-center space-x-2">
                <FaClock className="text-blue-400" />
                <span className="hud-text text-sm">
                  {isOpen ? 'OPEN NOW' : 'CLOSED'}
                </span>
              </div>

              {/* Phone */}
              <div className="flex items-center justify-center space-x-2">
                <FaPhone className="text-blue-400" />
                <a href="tel:8006272886" className="hud-text text-sm hover:text-white transition-colors">
                  800-MBR-AUTO
                </a>
              </div>

              {/* Location */}
              <div className="flex items-center justify-center space-x-2">
                <FaMapMarkerAlt className="text-blue-400" />
                <a
                  href="https://maps.app.goo.gl/6A6XeA4Nk4qD8MdRA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hud-text text-sm hover:text-white transition-colors"
                >
                  AL QUOZ, DUBAI
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Video Controls */}
        <motion.div
          className="absolute bottom-6 left-6 flex space-x-2"
          variants={hudVariants}
          initial="hidden"
          animate="visible"
          custom={3}
        >
          <button
            onClick={togglePlay}
            className="hud-element p-3 rounded-full pointer-events-auto hover:scale-110 transition-transform"
          >
            {isPlaying ? <FaPause className="text-white" /> : <FaPlay className="text-white" />}
          </button>

          <button
            onClick={toggleMute}
            className="hud-element p-3 rounded-full pointer-events-auto hover:scale-110 transition-transform"
          >
            {isMuted ? <FaVolumeMute className="text-white" /> : <FaVolumeUp className="text-white" />}
          </button>
        </motion.div>

        {/* Diagnostic Lines */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Corner brackets */}
          <div className="absolute top-6 left-6 w-8 h-8 border-l-2 border-t-2 border-blue-400 opacity-50"></div>
          <div className="absolute top-6 right-6 w-8 h-8 border-r-2 border-t-2 border-blue-400 opacity-50"></div>
          <div className="absolute bottom-6 left-6 w-8 h-8 border-l-2 border-b-2 border-blue-400 opacity-50"></div>
          <div className="absolute bottom-6 right-6 w-8 h-8 border-r-2 border-b-2 border-blue-400 opacity-50"></div>

          {/* Scanning lines */}
          <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-30 animate-pulse"></div>
          <div className="absolute top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-400 to-transparent opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>
    </div>
  );
}
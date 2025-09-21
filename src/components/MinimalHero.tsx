"use client";

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

interface MinimalHeroProps {
  googleReviews?: {
    overallRating: number;
    totalReviews: number;
  };
}

export default function MinimalHero({
  googleReviews = { overallRating: 4.8, totalReviews: 883 }
}: MinimalHeroProps) {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        ease: "easeOut",
        delay: 0.5
      }
    }
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        delay: 1.2
      }
    }
  };

  return (
    <section className="hero-container">
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        className="hero-video"
      >
        <source
          src="https://cdn.mbrme.com/video_1_714a98022b6341a8b723dc3105772546.mp4"
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>

      {/* Subtle Overlay */}
      <div className="hero-overlay" />

      {/* Minimal Content Overlay */}
      <div className="hero-content">
        <div className="container-luxury">
          <motion.div
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            <h1 className="hero-title">
              Making Better Rides
            </h1>

            <p className="hero-subtitle">
              Expert Car Care in Dubai • Premium Automotive Excellence
            </p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              variants={buttonVariants}
              initial="hidden"
              animate="visible"
            >
              <a
                href="https://wa.me/+971565015800?text=Hello%20MBR,%20I%20need%20premium%20automotive%20service"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Book Service
              </a>

              <a
                href="#services"
                className="btn-secondary"
              >
                Our Services
              </a>
            </motion.div>

            {/* Reviews Badge - Minimal */}
            <motion.div
              className="mt-8 flex items-center justify-center space-x-4 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.8 }}
            >
              <div className="flex items-center space-x-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-white font-medium">
                  {googleReviews?.overallRating || 4.8}
                </span>
              </div>

              <div className="text-gray-300">
                {(googleReviews?.totalReviews || 883).toLocaleString()} reviews
              </div>

              <div className="text-gray-400">
                Google Reviews
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Video Controls - Minimal */}
      <motion.button
        onClick={toggleMute}
        className="absolute bottom-8 right-8 p-3 bg-black/50 backdrop-blur-sm border border-white/20 rounded-full text-white hover:bg-black/70 transition-all duration-300"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2, duration: 0.5 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isMuted ? "Unmute video" : "Mute video"}
      >
        {isMuted ? (
          <FaVolumeMute className="w-5 h-5" />
        ) : (
          <FaVolumeUp className="w-5 h-5" />
        )}
      </motion.button>

      {/* Logo Watermark - Subtle */}
      <motion.div
        className="absolute top-8 left-8 opacity-30"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 0.3, x: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
      >
        <img
          src="/images/Logo_horizontal.svg"
          alt="MBR Auto Services"
          className="h-6 w-auto"
        />
      </motion.div>
    </section>
  );
}
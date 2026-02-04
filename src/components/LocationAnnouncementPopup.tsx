"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaVolumeUp, FaVolumeMute, FaMapMarkerAlt } from 'react-icons/fa';

interface LocationAnnouncementPopupProps {
  onClose?: () => void;
}

export default function LocationAnnouncementPopup({ onClose }: LocationAnnouncementPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Small delay before showing popup for better UX
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleClose}
          />

          {/* Popup Container */}
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Popup Content */}
            <motion.div
              className="relative w-full max-w-4xl"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 100,
                delay: 0.1
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glass Card Frame */}
              <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-black/90 backdrop-blur-xl border border-white/20 shadow-2xl">

                {/* Decorative Top Border */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E30613] to-transparent" />

                {/* Close Button */}
                <motion.button
                  onClick={handleClose}
                  className="absolute top-3 right-3 md:top-4 md:right-4 z-50 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/80 hover:border-white/40 transition-all duration-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Close announcement"
                >
                  <FaTimes className="w-4 h-4 md:w-5 md:h-5" />
                </motion.button>

                {/* Video Container */}
                <div className="relative aspect-video bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    className="w-full h-full object-cover"
                  >
                    <source src="/videos/mbr-location-promo.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>

                  {/* Video Controls Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    {/* Mute/Unmute Button */}
                    <motion.button
                      onClick={toggleMute}
                      className="liquid-glass-control"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? (
                        <FaVolumeMute className="w-4 h-4" />
                      ) : (
                        <FaVolumeUp className="w-4 h-4" />
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* Bottom Content Area */}
                <div className="p-4 md:p-6 bg-gradient-to-b from-black/50 to-black/80">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                    {/* Location Info */}
                    <div className="flex items-start md:items-center gap-3">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#E30613]/20 border border-[#E30613]/40 flex items-center justify-center flex-shrink-0">
                        <FaMapMarkerAlt className="w-4 h-4 md:w-5 md:h-5 text-[#E30613]" />
                      </div>
                      <div>
                        <p className="text-sm md:text-base text-white/60 font-medium">New Location</p>
                        <p className="text-base md:text-lg text-white font-semibold">16 8 St Al Qouz Ind.fourth - Al Quoz - Dubai</p>
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex gap-3">
                      <a
                        href="https://maps.app.goo.gl/gj9EXG4uchRBtZcE6"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="liquid-glass-btn liquid-glass-btn-primary liquid-glass-btn-small flex-1 md:flex-none text-center"
                      >
                        Get Directions
                      </a>
                      <button
                        onClick={handleClose}
                        className="liquid-glass-btn liquid-glass-btn-secondary liquid-glass-btn-small flex-1 md:flex-none"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                </div>

                {/* Decorative Bottom Border */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>

              {/* Glow Effect Behind Card */}
              <div className="absolute -inset-4 -z-10 bg-[#E30613]/20 blur-3xl rounded-full opacity-50" />
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

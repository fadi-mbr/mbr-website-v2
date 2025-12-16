"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCookie, FaTimes, FaCog, FaCheck, FaTimes as FaX } from 'react-icons/fa';
import {
  getStoredConsent,
  saveConsent,
  acceptAllCookies,
  rejectAllCookies,
  saveCustomConsent,
  type CookieConsent,
  type ConsentStatus,
} from '@/lib/cookie-consent';

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState<CookieConsent>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    // Check if user has already given consent
    const stored = getStoredConsent();
    if (!stored) {
      // Show banner after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    } else {
      // User has already consented, don't show banner
      setIsVisible(false);
    }
  }, []);

  const handleAcceptAll = () => {
    acceptAllCookies();
    setIsVisible(false);
    // Reload page to apply consent changes
    window.location.reload();
  };

  const handleRejectAll = () => {
    rejectAllCookies();
    setIsVisible(false);
    // Reload page to apply consent changes
    window.location.reload();
  };

  const handleSavePreferences = () => {
    saveCustomConsent(consent);
    setIsVisible(false);
    setShowSettings(false);
    // Reload page to apply consent changes
    window.location.reload();
  };

  const toggleSetting = (key: keyof CookieConsent) => {
    if (key === 'necessary') return; // Cannot toggle necessary cookies
    setConsent((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div className="container-luxury max-w-6xl mx-auto">
            <div className="glass-card-premium p-6 md:p-8 relative">
              {/* Close button */}
              <button
                onClick={() => setIsVisible(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors duration-200"
                aria-label="Close cookie banner"
              >
                <FaTimes className="w-5 h-5" />
              </button>

              {!showSettings ? (
                // Main consent banner
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center">
                        <FaCookie className="w-6 h-6 text-red-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-light text-white mb-2">
                        Cookie Consent
                      </h3>
                      <p className="text-body-enhanced leading-relaxed mb-4">
                        We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
                        By clicking "Accept All", you consent to our use of cookies. You can also customize your preferences 
                        or reject non-essential cookies.
                      </p>
                      <p className="text-sm text-muted-enhanced mb-4">
                        <a
                          href="/privacy-policy"
                          className="text-red-400 hover:text-red-300 underline transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Privacy Policy
                        </a>
                        {' • '}
                        <a
                          href="/cookie-policy"
                          className="text-red-400 hover:text-red-300 underline transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Cookie Policy
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleAcceptAll}
                      className="flex-1 liquid-glass-btn liquid-glass-btn-primary"
                    >
                      Accept All
                    </button>
                    <button
                      onClick={() => setShowSettings(true)}
                      className="flex-1 liquid-glass-btn liquid-glass-btn-secondary flex items-center justify-center gap-2"
                    >
                      <FaCog className="w-4 h-4" />
                      Customize
                    </button>
                    <button
                      onClick={handleRejectAll}
                      className="flex-1 liquid-glass-btn liquid-glass-btn-secondary"
                    >
                      Reject All
                    </button>
                  </div>
                </div>
              ) : (
                // Cookie settings panel
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-light text-white">
                      Cookie Preferences
                    </h3>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="text-white/60 hover:text-white transition-colors duration-200"
                      aria-label="Close settings"
                    >
                      <FaX className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Necessary Cookies */}
                    <div className="glass-card-subtle p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="text-white font-medium mb-1">
                            Necessary Cookies
                          </h4>
                          <p className="text-sm text-body-enhanced">
                            Essential for the website to function properly. These cannot be disabled.
                          </p>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                          <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center">
                            <FaCheck className="w-5 h-5 text-green-400" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Analytics Cookies */}
                    <div className="glass-card-subtle p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">
                            Analytics Cookies
                          </h4>
                          <p className="text-sm text-body-enhanced">
                            Help us understand how visitors interact with our website (Google Analytics).
                          </p>
                        </div>
                        <button
                          onClick={() => toggleSetting('analytics')}
                          className={`flex-shrink-0 ml-4 w-14 h-8 rounded-full transition-colors duration-300 ${
                            consent.analytics
                              ? 'bg-red-600'
                              : 'bg-white/20'
                          } relative`}
                          aria-label="Toggle analytics cookies"
                        >
                          <span
                            className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${
                              consent.analytics ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Marketing Cookies */}
                    <div className="glass-card-subtle p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">
                            Marketing Cookies
                          </h4>
                          <p className="text-sm text-body-enhanced">
                            Used to deliver personalized advertisements and track campaign performance.
                          </p>
                        </div>
                        <button
                          onClick={() => toggleSetting('marketing')}
                          className={`flex-shrink-0 ml-4 w-14 h-8 rounded-full transition-colors duration-300 ${
                            consent.marketing
                              ? 'bg-red-600'
                              : 'bg-white/20'
                          } relative`}
                          aria-label="Toggle marketing cookies"
                        >
                          <span
                            className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${
                              consent.marketing ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Preferences Cookies */}
                    <div className="glass-card-subtle p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">
                            Preferences Cookies
                          </h4>
                          <p className="text-sm text-body-enhanced">
                            Remember your settings and preferences for a better experience.
                          </p>
                        </div>
                        <button
                          onClick={() => toggleSetting('preferences')}
                          className={`flex-shrink-0 ml-4 w-14 h-8 rounded-full transition-colors duration-300 ${
                            consent.preferences
                              ? 'bg-red-600'
                              : 'bg-white/20'
                          } relative`}
                          aria-label="Toggle preferences cookies"
                        >
                          <span
                            className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${
                              consent.preferences ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
                    <button
                      onClick={handleSavePreferences}
                      className="flex-1 liquid-glass-btn liquid-glass-btn-primary"
                    >
                      Save Preferences
                    </button>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="flex-1 liquid-glass-btn liquid-glass-btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


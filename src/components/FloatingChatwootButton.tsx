"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineChatBubbleLeftRight } from 'react-icons/hi2';

declare global {
  interface Window {
    chatwootSettings?: Record<string, unknown>;
    chatwootSDK?: { run: (opts: { websiteToken: string; baseUrl: string }) => void };
    $chatwoot?: {
      toggle: (state?: 'open' | 'close') => void;
      hasLoaded?: boolean;
    };
  }
}

const CHATWOOT_BASE = 'https://connect.mbrme.com';
const WIDGET_TOKEN = 'ppprcyphobX17t9VSPNnhU5U';

export default function FloatingChatwootButton() {
  const [ready, setReady] = useState(false);
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    // Configure Chatwoot to suppress its own launcher — we render our own.
    window.chatwootSettings = {
      hideMessageBubble: true,
      position: 'left',
      locale: 'en',
      type: 'standard',
    };

    // Load the SDK once
    const id = 'chatwoot-sdk';
    if (document.getElementById(id)) return;

    const script = document.createElement('script');
    script.id = id;
    script.src = `${CHATWOOT_BASE}/packs/js/sdk.js`;
    script.defer = true;
    script.async = true;
    script.onload = () => {
      window.chatwootSDK?.run({ websiteToken: WIDGET_TOKEN, baseUrl: CHATWOOT_BASE });
    };
    document.head.appendChild(script);

    // Listen for SDK ready + unread events
    const onReady = () => setReady(true);
    const onUnread = (e: Event) => {
      const ce = e as CustomEvent<{ unreadMessageCount?: number }>;
      setHasNew((ce.detail?.unreadMessageCount ?? 0) > 0);
    };
    window.addEventListener('chatwoot:ready', onReady);
    window.addEventListener('chatwoot:on-unread-message-count-changed', onUnread);

    // Race fallback: on a warm cache the SDK can finish booting and fire
    // `chatwoot:ready` before the listener above is attached. Poll briefly
    // for $chatwoot.hasLoaded so the button still appears.
    let attempts = 0;
    const poll = window.setInterval(() => {
      attempts += 1;
      if (window.$chatwoot?.hasLoaded || window.$chatwoot?.toggle) {
        setReady(true);
        window.clearInterval(poll);
        return;
      }
      if (attempts >= 40) {
        // ~10s — give up; widget genuinely failed to load (CSP, ad-block).
        window.clearInterval(poll);
      }
    }, 250);

    return () => {
      window.removeEventListener('chatwoot:ready', onReady);
      window.removeEventListener('chatwoot:on-unread-message-count-changed', onUnread);
      window.clearInterval(poll);
    };
  }, []);

  const handleClick = () => {
    // SDK queues calls internally — safe to toggle as soon as $chatwoot
    // is present, even before `chatwoot:ready` has fully fired.
    window.$chatwoot?.toggle?.('open');
  };

  return (
    <AnimatePresence>
      {ready && (
        <motion.button
          type="button"
          onClick={handleClick}
          // Desktop only — mobile keeps WhatsApp as the dominant CTA on the right.
          // On <md screens we suppress this entirely.
          className="hidden md:flex fixed bottom-8 left-8 z-50 group items-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ delay: 1.4, type: 'spring', stiffness: 200, damping: 18 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          aria-label="Open MBR Connect web chat"
        >
          <div className="relative">
            {/* Soft brand glow */}
            <div className="absolute inset-0 rounded-full blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-500"
                 style={{ backgroundColor: '#BC222D' }} />

            {/* Button core — luxury matte black with brand red border + icon */}
            <div className="relative w-16 h-16 rounded-full shadow-2xl flex items-center justify-center cursor-pointer transition-all duration-300 border"
                 style={{
                   background: 'linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)',
                   borderColor: '#BC222D',
                   boxShadow: '0 12px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(188,34,45,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
                 }}>
              <HiOutlineChatBubbleLeftRight
                className="w-7 h-7 transition-colors duration-300"
                style={{ color: '#BC222D' }}
              />

              {/* Subtle pulse ring — slower than WhatsApp's so they don't compete */}
              <motion.div
                className="absolute inset-0 rounded-full border"
                style={{ borderColor: '#BC222D' }}
                animate={{ scale: [1, 1.35, 1.35], opacity: [0.6, 0, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
              />

              {/* Unread badge */}
              {hasNew && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 ring-2 ring-black animate-pulse" />
              )}
            </div>

            {/* Tooltip — appears on the right since button is bottom-left */}
            <div className="absolute left-20 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="bg-black/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap shadow-xl border border-white/10">
                Live chat with our team
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-black/90 rotate-45 border-l border-t border-white/10" />
              </div>
            </div>
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

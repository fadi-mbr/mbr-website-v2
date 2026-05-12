"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';
import { WORKSHOP_PHOTOS } from '@/lib/workshop-photos';
import SectionMarker from './SectionMarker';

export default function OurWorkshop() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const open = useCallback((i: number) => setLightboxIndex(i), []);
  const close = useCallback(() => setLightboxIndex(null), []);
  const next = useCallback(
    () =>
      setLightboxIndex((i) =>
        i === null ? null : (i + 1) % WORKSHOP_PHOTOS.length,
      ),
    [],
  );
  const prev = useCallback(
    () =>
      setLightboxIndex((i) =>
        i === null
          ? null
          : (i - 1 + WORKSHOP_PHOTOS.length) % WORKSHOP_PHOTOS.length,
      ),
    [],
  );

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightboxIndex, close, next, prev]);

  if (WORKSHOP_PHOTOS.length === 0) {
    return (
      <section id="workshop" className="section-padding bg-black">
        <div className="container-luxury">
          <SectionMarker
            number="03"
            eyebrow="Inside MBR"
            headline="The bays. The tools. The cars."
            body="Workshop photography is on the way."
          />
        </div>
      </section>
    );
  }

  return (
    <section id="workshop" className="section-padding bg-[var(--surface-1)]">
      <div className="container-luxury">
        <SectionMarker
          number="03"
          eyebrow="Inside MBR"
          headline="The bays. The tools. The cars that come through."
          body="An honest look at where the work happens. Hover any tile for a one-line note."
        />

        {/* Photo grid */}
        <div className="mt-16 md:mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {WORKSHOP_PHOTOS.map((photo, i) => (
            <motion.button
              key={photo.src}
              type="button"
              onClick={() => open(i)}
              className={[
                'group relative block w-full overflow-hidden rounded-2xl border border-white/5',
                'bg-[var(--surface-2)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-black',
                'transition-all duration-500 hover:border-[var(--accent-bronze)]/50',
                photo.featured ? 'md:col-span-2 lg:col-span-2' : '',
              ].join(' ')}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              aria-label={`Open ${photo.caption}`}
            >
              <div
                className={
                  photo.aspect === '16/9'
                    ? 'aspect-video'
                    : photo.aspect === '1/1'
                      ? 'aspect-square'
                      : 'aspect-[4/3]'
                }
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes={
                    photo.featured
                      ? '(min-width: 1024px) 66vw, (min-width: 768px) 100vw, 100vw'
                      : '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw'
                  }
                  className="object-cover transition-transform duration-[1200ms] group-hover:scale-[1.05]"
                  // Phase C perf: `priority` (not just `loading="eager"`)
                  // tells next/image to preload the first tile; the rest
                  // lazy-load on intersection.
                  priority={i === 0}
                />
              </div>

              {/* Bottom gradient — slightly deeper on hover for the story
                  swap. Always-visible caption + metadata; story fades in. */}
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 p-5 md:p-7 transition-all duration-500"
                style={{
                  background:
                    'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.92) 100%)',
                }}
              >
                {photo.metadata && (
                  <span className="block text-eyebrow text-[var(--accent-bronze)] text-[0.6rem] md:text-[0.7rem] mb-2 tracking-[0.25em]">
                    {photo.metadata}
                  </span>
                )}

                {/* Caption + story stack — caption fades out on hover,
                    story fades in. Reserve roughly equal vertical space so
                    the card doesn't reflow. */}
                <div className="relative h-[2.5rem] md:h-[2.75rem]">
                  <span
                    className={[
                      'absolute inset-0 text-white text-base md:text-lg font-light tracking-tight transition-opacity duration-300',
                      photo.story ? 'group-hover:opacity-0' : '',
                    ].join(' ')}
                  >
                    {photo.caption}
                  </span>
                  {photo.story && (
                    <span className="absolute inset-0 text-[var(--text-body)] text-sm md:text-[0.95rem] leading-snug opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      {photo.story}
                    </span>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label="Workshop photo viewer"
          >
            {/* Close */}
            <button
              type="button"
              onClick={close}
              aria-label="Close viewer"
              className="absolute top-6 right-6 md:top-8 md:right-8 w-11 h-11 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/15 border border-white/15 transition-colors"
            >
              <FaTimes className="w-5 h-5 text-white" />
            </button>

            {/* Prev */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              aria-label="Previous photo"
              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/15 border border-white/15 transition-colors"
            >
              <FaChevronLeft className="w-4 h-4 text-white" />
            </button>

            {/* Next */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria-label="Next photo"
              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/15 border border-white/15 transition-colors"
            >
              <FaChevronRight className="w-4 h-4 text-white" />
            </button>

            <motion.div
              key={lightboxIndex}
              className="relative w-full h-full max-w-6xl max-h-[80vh] mx-4 md:mx-12 flex flex-col items-center justify-center"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-full">
                <Image
                  src={WORKSHOP_PHOTOS[lightboxIndex].src}
                  alt={WORKSHOP_PHOTOS[lightboxIndex].alt}
                  fill
                  sizes="100vw"
                  priority
                  className="object-contain"
                />
              </div>
              <div className="mt-5 text-center">
                {WORKSHOP_PHOTOS[lightboxIndex].metadata && (
                  <p className="text-eyebrow mb-2 text-[0.65rem] md:text-xs">
                    {WORKSHOP_PHOTOS[lightboxIndex].metadata}
                  </p>
                )}
                <p className="text-white text-lg md:text-xl font-light tracking-tight">
                  {WORKSHOP_PHOTOS[lightboxIndex].caption}
                </p>
                {WORKSHOP_PHOTOS[lightboxIndex].story && (
                  <p className="mt-2 text-sm text-[var(--text-body)] max-w-md mx-auto leading-snug">
                    {WORKSHOP_PHOTOS[lightboxIndex].story}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

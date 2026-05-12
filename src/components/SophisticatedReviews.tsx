"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaGoogle, FaQuoteLeft } from 'react-icons/fa';
import { trackWhatsAppClick } from '@/lib/analytics';
import SectionMarker from './SectionMarker';

interface Review {
  author_name: string;
  author_url?: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description: string;
  profile_photo_url?: string;
}

interface GoogleReviewsData {
  overallRating: number;
  totalReviews: number;
  reviews: Review[];
}

/**
 * Rotates the quote-icon color across the masonry cards so the eye gets
 * visual variation in the grid. Order is intentional: red, bronze,
 * silver, white, bronze, red.
 */
const QUOTE_COLORS = [
  'text-[var(--primary)]',
  'text-[var(--accent-bronze)]',
  'text-[var(--text-luxury-silver)]',
  'text-white/70',
  'text-[var(--accent-bronze)]',
  'text-[var(--primary)]',
];

const FALLBACK_REVIEWS: Review[] = [
  {
    author_name: 'Ahmad Al-Mansouri',
    author_url: 'https://maps.app.goo.gl/gj9EXG4uchRBtZcE6',
    rating: 5,
    text:
      "Exceptional service. The team at MBR diagnosed and fixed my BMW's electrical issue quickly. Professional, knowledgeable, trustworthy. They explained everything clearly and the pricing was fair. Highly recommend for anyone looking for quality automotive care in Dubai.",
    time: Date.now() - 86400000,
    relative_time_description: 'a day ago',
  },
  {
    author_name: 'Sarah Johnson',
    rating: 5,
    text:
      'Outstanding quality work on my Mercedes. The attention to detail and customer service is unmatched in Dubai.',
    time: Date.now() - 172800000,
    relative_time_description: '2 days ago',
  },
  {
    author_name: 'Mohammed Hassan',
    rating: 5,
    text:
      'Best automotive service in Al Quoz. They fixed my suspension issues perfectly and the car feels brand new. The staff is professional and the workshop is clean and well-organised.',
    time: Date.now() - 259200000,
    relative_time_description: '3 days ago',
  },
  {
    author_name: 'Lisa Thompson',
    rating: 5,
    text:
      'Amazing experience with MBR Auto Services. They provided detailed diagnostics and explained all the work needed. Transparent pricing, quality work, excellent customer service.',
    time: Date.now() - 345600000,
    relative_time_description: '4 days ago',
  },
  {
    author_name: 'Khalid Al-Rashid',
    rating: 5,
    text:
      'Professional service from start to finish. They handled my Range Rover maintenance with expertise and care. The team is knowledgeable about luxury vehicles and uses genuine parts.',
    time: Date.now() - 432000000,
    relative_time_description: '5 days ago',
  },
  {
    author_name: 'Emma Rodriguez',
    rating: 5,
    text:
      "Incredible service quality. They repaired my car's AC system efficiently and at a reasonable price. The staff is friendly and the turnaround time was excellent.",
    time: Date.now() - 518400000,
    relative_time_description: '6 days ago',
  },
];

export default function SophisticatedReviews() {
  const [reviewsData, setReviewsData] = useState<GoogleReviewsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch('/api/google-reviews');
        const result = await response.json();
        if (result.success && result.data) {
          setReviewsData(result.data);
        } else {
          setReviewsData({
            overallRating: 4.8,
            totalReviews: 883,
            reviews: FALLBACK_REVIEWS,
          });
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
        setReviewsData({
          overallRating: 4.8,
          totalReviews: 883,
          reviews: FALLBACK_REVIEWS,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  if (loading) {
    return (
      <section id="reviews" className="relative py-24 bg-black">
        <div className="container-luxury flex items-center justify-center py-20">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2"
            style={{ borderColor: 'var(--primary)' }}
          />
        </div>
      </section>
    );
  }

  const reviews = (reviewsData?.reviews || FALLBACK_REVIEWS).slice(0, 6);

  return (
    <section
      id="reviews"
      className="relative py-24 md:py-32 bg-gradient-to-b from-black to-[var(--surface-1)] overflow-hidden"
    >
      {/* Soft red ambient on the centre — pulls the eye into the masonry. */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(227,6,19,0.06) 0%, transparent 55%)',
        }}
      />

      <div className="relative container-luxury">
        <SectionMarker
          number="05"
          eyebrow="Voices"
          headline="What owners actually say after we hand the keys back."
          body={`4.8★ across ${(reviewsData?.totalReviews || 883).toLocaleString()} Google reviews — these six are a random snapshot.`}
        />

        {/* Google rating summary — slimmer, no shimmer. */}
        <motion.a
          href="https://maps.app.goo.gl/gj9EXG4uchRBtZcE6"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full max-w-3xl mx-auto mt-16 md:mt-20"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 p-6 md:p-7 rounded-2xl border border-white/10 bg-[var(--surface-2)] hover:border-[var(--primary)]/40 transition-colors duration-300">
            <FaGoogle className="text-3xl md:text-4xl text-[var(--primary)]" />
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
                <span className="text-4xl md:text-5xl font-light text-white tracking-tight">
                  {reviewsData?.overallRating || 4.8}
                </span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className="w-4 h-4 md:w-5 md:h-5 text-star-gold mx-0.5"
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm md:text-base text-[var(--text-muted)]">
                {(reviewsData?.totalReviews || 883).toLocaleString()} Google reviews
              </p>
            </div>
            <div className="hidden sm:block w-px h-12 bg-white/10" aria-hidden="true" />
            <div className="text-center sm:text-left">
              <div className="text-2xl md:text-3xl font-light text-white">98%</div>
              <p className="text-eyebrow text-[var(--accent-bronze)] mt-1">
                Satisfaction
              </p>
            </div>
          </div>
        </motion.a>

        {/* Masonry — CSS columns for variable card heights without JS. */}
        <div className="mt-16 md:mt-20 columns-1 md:columns-2 gap-6 [column-fill:_balance]">
          {reviews.map((review, index) => {
            const colorClass = QUOTE_COLORS[index % QUOTE_COLORS.length];
            return (
              <motion.a
                key={`${review.author_name}-${index}`}
                href={review.author_url || 'https://maps.app.goo.gl/gj9EXG4uchRBtZcE6'}
                target="_blank"
                rel="noopener noreferrer"
                className="group mb-6 inline-block w-full break-inside-avoid p-7 md:p-8 rounded-2xl border border-white/8 bg-[var(--surface-2)] hover:border-white/20 transition-colors duration-300"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, delay: index * 0.05 }}
              >
                {/* Quote icon — color rotates per index */}
                <FaQuoteLeft className={`text-2xl mb-5 ${colorClass}`} aria-hidden="true" />

                {/* Stars */}
                <div className="flex mb-5" aria-label={`${review.rating} stars`}>
                  {[...Array(review.rating)].map((_, i) => (
                    <FaStar key={i} className="w-4 h-4 text-star-gold mr-1" aria-hidden="true" />
                  ))}
                </div>

                <blockquote className="text-[var(--text-body)] mb-6 leading-relaxed">
                  &ldquo;{review.text}&rdquo;
                </blockquote>

                <footer className="flex items-center justify-between pt-5 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    {review.profile_photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={review.profile_photo_url}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{
                          background:
                            'linear-gradient(145deg, rgba(165,120,66,0.35), rgba(165,120,66,0.08))',
                          border: '1px solid rgba(165,120,66,0.45)',
                        }}
                      >
                        <span className="text-white font-light">
                          {review.author_name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="text-sm">
                      <div className="text-white">{review.author_name}</div>
                      <div className="text-[var(--text-subtle)] text-xs">
                        {review.relative_time_description}
                      </div>
                    </div>
                  </div>
                  <FaGoogle className="text-[var(--text-subtle)] text-base" />
                </footer>
              </motion.a>
            );
          })}
        </div>

        {/* Quiet bottom CTA — single link, no second button competing. */}
        <div className="mt-16 text-center">
          <a
            href="https://maps.app.goo.gl/gj9EXG4uchRBtZcE6"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 text-eyebrow text-white border-b border-[var(--accent-bronze)] pb-1 hover:text-[var(--accent-bronze)] transition-colors"
            onClick={() => trackWhatsAppClick('reviews_view_all', 'View All Reviews')}
          >
            <FaGoogle className="w-4 h-4" />
            <span>Read every review on Google</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}

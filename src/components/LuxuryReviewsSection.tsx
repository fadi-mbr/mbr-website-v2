"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { FaStar, FaGoogle, FaArrowLeft, FaArrowRight } from 'react-icons/fa';

interface Review {
  author_name: string;
  author_url?: string;
  rating: number;
  text: string;
  time: number;
  profile_photo_url?: string;
}

interface GoogleReviewsData {
  overallRating: number;
  totalReviews: number;
  reviews: Review[];
}

export default function LuxuryReviewsSection() {
  const [reviewsData, setReviewsData] = useState<GoogleReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentReview, setCurrentReview] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch('/api/google-reviews');
        const data = await response.json();
        setReviewsData(data);
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
        setReviewsData({
          overallRating: 4.8,
          totalReviews: 883,
          reviews: [
            {
              author_name: "Ahmad Al-Mansouri",
              rating: 5,
              text: "Exceptional service! The team at MBR diagnosed and fixed my BMW's electrical issue quickly. Professional, knowledgeable, and trustworthy.",
              time: Date.now() - 86400000
            },
            {
              author_name: "Sarah Johnson",
              rating: 5,
              text: "Outstanding quality work on my Mercedes. The attention to detail and customer service is unmatched in Dubai. Highly recommended!",
              time: Date.now() - 172800000
            }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const nextReview = () => {
    if (reviewsData && reviewsData.reviews && reviewsData.reviews.length > 0) {
      setCurrentReview((prev) => (prev + 1) % reviewsData.reviews.length);
    }
  };

  const prevReview = () => {
    if (reviewsData && reviewsData.reviews && reviewsData.reviews.length > 0) {
      setCurrentReview((prev) =>
        prev === 0 ? reviewsData.reviews.length - 1 : prev - 1
      );
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  if (loading) {
    return (
      <section id="reviews" className="section-horizontal section-dark">
        <div className="container-luxury">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="reviews" className="section-horizontal section-dark">
      <div className="container-luxury">

        {/* Section Header */}
        <motion.div
          className="content-block mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <h2 className="text-display text-center mb-6">
            Customer Excellence
          </h2>
          <p className="text-body text-center max-w-2xl mx-auto">
            Trusted by discerning vehicle owners across Dubai.
            Experience the difference of premium automotive care.
          </p>
        </motion.div>

        {/* Reviews Content */}
        <motion.div
          className="grid-two gap-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >

          {/* Google Reviews Summary */}
          <motion.div
            className="flex flex-col justify-center"
            variants={itemVariants}
          >
            <div className="card-minimal p-8 text-center">

              {/* Google Badge */}
              <div className="flex items-center justify-center mb-8">
                <FaGoogle className="text-4xl text-red-500 mr-4" />
                <span className="text-subheading text-white">Reviews</span>
              </div>

              {/* Rating Display */}
              <div className="mb-6">
                <div className="text-6xl font-light text-white mb-2">
                  {reviewsData?.overallRating || 4.8}
                </div>
                <div className="flex justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className="w-6 h-6 text-yellow-400 mx-1"
                    />
                  ))}
                </div>
                <p className="text-body text-muted-enhanced">
                  Based on {reviewsData?.totalReviews || 883} reviews
                </p>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-2 gap-6 mt-8">
                <div className="text-center">
                  <div className="text-2xl font-light text-white">98%</div>
                  <div className="text-caption text-muted-enhanced">Satisfaction</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-light text-white">15+</div>
                  <div className="text-caption text-muted-enhanced">Years Experience</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Featured Review */}
          <motion.div
            className="flex flex-col justify-center"
            variants={itemVariants}
          >
            {reviewsData && reviewsData.reviews && reviewsData.reviews.length > 0 && (
              <div className="card-minimal p-8 relative">

                {/* Review Navigation */}
                <div className="flex justify-between items-center mb-6">
                  <button
                    onClick={prevReview}
                    className="liquid-glass-nav"
                    aria-label="Previous review"
                  >
                    <FaArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="flex space-x-2">
                    {reviewsData.reviews && reviewsData.reviews.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentReview(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentReview ? 'bg-primary' : 'bg-gray-600'
                        }`}
                        aria-label={`Go to review ${index + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={nextReview}
                    className="liquid-glass-nav"
                    aria-label="Next review"
                  >
                    <FaArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Review Content */}
                <motion.div
                  key={currentReview}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <a
                    href={reviewsData.reviews?.[currentReview]?.author_url || "https://maps.app.goo.gl/P7vgB2XDpeRCMaH3A"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block cursor-pointer hover:opacity-80 transition-opacity"
                  >
                  {/* Stars */}
                  <div className="flex mb-4">
                    {reviewsData.reviews && reviewsData.reviews[currentReview] &&
                     [...Array(reviewsData.reviews[currentReview].rating)].map((_, i) => (
                      <FaStar key={i} className="w-4 h-4 text-luxury-gold mr-1" />
                    ))}
                  </div>

                  {/* Review Text */}
                  <blockquote className="text-body text-body-enhanced mb-6 leading-relaxed">
                    &ldquo;{reviewsData.reviews && reviewsData.reviews[currentReview] ? reviewsData.reviews[currentReview].text : ''}&rdquo;
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mr-4">
                      <span className="text-white font-medium">
                        {reviewsData.reviews && reviewsData.reviews[currentReview] ?
                         reviewsData.reviews[currentReview].author_name.charAt(0) : 'A'}
                      </span>
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        {reviewsData.reviews && reviewsData.reviews[currentReview] ?
                         reviewsData.reviews[currentReview].author_name : 'Loading...'}
                      </div>
                      <div className="text-caption text-muted-enhanced">
                        Verified Customer
                      </div>
                    </div>
                  </div>
                  </a>
                </motion.div>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          viewport={{ once: true }}
        >
          <a
            href="https://www.google.com/maps/place/MBR+Auto+Services"
            target="_blank"
            rel="noopener noreferrer"
            className="liquid-glass-btn liquid-glass-btn-secondary inline-flex items-center space-x-2"
          >
            <FaGoogle className="w-4 h-4" />
            <span>View All Reviews</span>
          </a>
        </motion.div>

      </div>
    </section>
  );
}
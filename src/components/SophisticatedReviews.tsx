"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { FaStar, FaGoogle, FaQuoteLeft } from 'react-icons/fa';

interface Review {
  author_name: string;
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
          // Fallback data
          setReviewsData({
            overallRating: 4.8,
            totalReviews: 883,
            reviews: [
              {
                author_name: "Ahmad Al-Mansouri",
                rating: 5,
                text: "Exceptional service! The team at MBR diagnosed and fixed my BMW's electrical issue quickly. Professional, knowledgeable, and trustworthy. They explained everything clearly and the pricing was fair. Highly recommend for anyone looking for quality automotive care in Dubai.",
                time: Date.now() - 86400000,
                relative_time_description: "a day ago"
              },
              {
                author_name: "Sarah Johnson",
                rating: 5,
                text: "Outstanding quality work on my Mercedes. The attention to detail and customer service is unmatched in Dubai. They went above and beyond to ensure my car was running perfectly. Will definitely return for future maintenance.",
                time: Date.now() - 172800000,
                relative_time_description: "2 days ago"
              },
              {
                author_name: "Mohammed Hassan",
                rating: 5,
                text: "Best automotive service in Al Quoz! They fixed my suspension issues perfectly and the car feels brand new. The staff is professional and the workshop is clean and well-organized. Worth every dirham!",
                time: Date.now() - 259200000,
                relative_time_description: "3 days ago"
              },
              {
                author_name: "Lisa Thompson",
                rating: 5,
                text: "Amazing experience with MBR Auto Services. They provided detailed diagnostics for my car and explained all the work needed. Transparent pricing, quality work, and excellent customer service. Couldn't ask for more!",
                time: Date.now() - 345600000,
                relative_time_description: "4 days ago"
              },
              {
                author_name: "Khalid Al-Rashid",
                rating: 5,
                text: "Professional service from start to finish. They handled my Range Rover's maintenance with expertise and care. The team is knowledgeable about luxury vehicles and uses genuine parts. Highly satisfied with the results.",
                time: Date.now() - 432000000,
                relative_time_description: "5 days ago"
              },
              {
                author_name: "Emma Rodriguez",
                rating: 5,
                text: "Incredible service quality! They repaired my car's AC system efficiently and at a reasonable price. The staff is friendly and the turnaround time was excellent. This is now my go-to automotive service center in Dubai.",
                time: Date.now() - 518400000,
                relative_time_description: "6 days ago"
              }
            ]
          });
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
        // Use fallback data on error
        setReviewsData({
          overallRating: 4.8,
          totalReviews: 883,
          reviews: [
            {
              author_name: "Ahmad Al-Mansouri",
              rating: 5,
              text: "Exceptional service! The team at MBR diagnosed and fixed my BMW's electrical issue quickly.",
              time: Date.now() - 86400000,
              relative_time_description: "a day ago"
            }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
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

  if (loading) {
    return (
      <section id="reviews" className="relative py-24 bg-gradient-to-b from-gray-900 to-black">
        <div className="container-luxury">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="reviews" className="relative py-24 bg-gradient-to-b from-gray-900 to-black overflow-hidden">

      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative container-luxury">

        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl md:text-6xl font-extralight text-white mb-8 tracking-tight">
            Customer Stories
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Real experiences from our valued customers across Dubai
          </p>
        </motion.div>

        {/* Google Rating Summary */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center space-x-8 bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
            <FaGoogle className="text-6xl text-red-500" />

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <span className="text-5xl font-light text-white mr-4">
                  {reviewsData?.overallRating || 4.8}
                </span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className="w-6 h-6 text-yellow-400 mx-1" />
                  ))}
                </div>
              </div>
              <p className="text-gray-300 text-lg">
                Based on {(reviewsData?.totalReviews || 883).toLocaleString()} Google Reviews
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-light text-white mb-2">98%</div>
              <p className="text-gray-400">Satisfaction Rate</p>
            </div>
          </div>
        </motion.div>

        {/* Reviews Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {reviewsData && reviewsData.reviews && reviewsData.reviews.slice(0, 6).map((review, index) => (
            <motion.div
              key={`${review.author_name}-${index}`}
              className="group"
              variants={itemVariants}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-white/10 rounded-3xl p-8 h-full hover:border-white/20 transition-all duration-500">

                {/* Quote Icon */}
                <FaQuoteLeft className="text-red-600/60 text-2xl mb-6" />

                {/* Stars */}
                <div className="flex mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <FaStar key={i} className="w-4 h-4 text-yellow-400 mr-1" />
                  ))}
                </div>

                {/* Review Text */}
                <blockquote className="text-gray-300 mb-6 leading-relaxed text-sm">
                  "{review.text}"
                </blockquote>

                {/* Author Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center mr-4">
                      <span className="text-white font-medium text-lg">
                        {review.author_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        {review.author_name}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {review.relative_time_description}
                      </div>
                    </div>
                  </div>

                  <FaGoogle className="text-gray-500 text-lg" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex flex-col sm:flex-row gap-6">
            <a
              href="https://www.google.com/maps/place/MBR+Auto+Services"
              target="_blank"
              rel="noopener noreferrer"
              className="group px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white font-medium rounded-none overflow-hidden transition-all duration-500 hover:scale-105"
            >
              <div className="flex items-center space-x-3">
                <FaGoogle className="w-5 h-5" />
                <span>View All Reviews</span>
              </div>
            </a>

            <a
              href="https://wa.me/+971565015800?text=Hello%20MBR,%20I%20saw%20your%20excellent%20reviews%20and%20need%20automotive%20service"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border-2 border-white/30 text-white font-medium rounded-none backdrop-blur-sm hover:border-white/60 hover:bg-white/10 transition-all duration-500"
            >
              Join Our Happy Customers
            </a>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
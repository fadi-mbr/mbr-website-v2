"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center py-20">
      <div className="container-luxury max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12"
        >
          <div className="text-6xl mb-6">✓</div>
          <h1 className="text-display font-light gradient-text mb-4">
            Booking Request Submitted!
          </h1>
          <p className="text-body-enhanced mb-8">
            We&apos;ve sent a confirmation email to your inbox. Please check your email and click the confirmation link to complete your booking.
          </p>
          
          {bookingId && (
            <div className="glass-card-subtle p-4 mb-6">
              <p className="text-caption text-muted-enhanced">Booking ID:</p>
              <p className="text-body font-mono">{bookingId}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <p className="text-body text-muted-enhanced">
              <strong>Important:</strong> Your booking will expire in 30 minutes if not confirmed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="liquid-glass-btn liquid-glass-btn-secondary"
              >
                Return Home
              </Link>
              <Link
                href="/book"
                className="liquid-glass-btn liquid-glass-btn-primary"
              >
                Book Another Service
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <BookingSuccessContent />
    </Suspense>
  );
}


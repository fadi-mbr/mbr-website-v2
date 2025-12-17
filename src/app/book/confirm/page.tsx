"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

function BookingConfirmContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [bookingData, setBookingData] = useState<{ id?: string; status?: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid confirmation link');
      return;
    }

    // Confirm booking
    fetch(`/api/bookings/confirm?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus('success');
          setMessage(data.message);
          setBookingData(data.booking);
        } else {
          setStatus(data.expired ? 'expired' : 'error');
          setMessage(data.error || 'Failed to confirm booking');
        }
      })
      .catch(error => {
        setStatus('error');
        setMessage('An error occurred. Please try again.');
        console.error('Confirmation error:', error);
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center py-20">
      <div className="container-luxury max-w-2xl mx-auto text-center">
        {status === 'loading' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-6"></div>
            <p className="text-body-enhanced">Confirming your booking...</p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12"
          >
            <div className="text-6xl mb-6 text-green-400">✓</div>
            <h1 className="text-display font-light gradient-text mb-4">
              Booking Confirmed!
            </h1>
            <p className="text-body-enhanced mb-8">{message}</p>
            
            {bookingData?.id && (
              <div className="mb-6">
                <a
                  href={`/api/bookings/ics?id=${bookingData.id}`}
                  download
                  className="liquid-glass-btn liquid-glass-btn-primary inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Download Calendar Event
                </a>
              </div>
            )}
            
            <p className="text-body text-muted-enhanced mb-6">
              A confirmation email with calendar details has been sent to your inbox.
            </p>
            
            <Link
              href="/"
              className="liquid-glass-btn liquid-glass-btn-secondary"
            >
              Return Home
            </Link>
          </motion.div>
        )}

        {status === 'expired' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12"
          >
            <div className="text-6xl mb-6 text-red-400">✗</div>
            <h1 className="text-display font-light gradient-text mb-4">
              Confirmation Link Expired
            </h1>
            <p className="text-body-enhanced mb-8">{message}</p>
            <p className="text-body text-muted-enhanced mb-6">
              Please create a new booking to proceed.
            </p>
            <Link
              href="/book"
              className="liquid-glass-btn liquid-glass-btn-primary"
            >
              Create New Booking
            </Link>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12"
          >
            <div className="text-6xl mb-6 text-red-400">✗</div>
            <h1 className="text-display font-light gradient-text mb-4">
              Confirmation Failed
            </h1>
            <p className="text-body-enhanced mb-8">{message}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/book"
                className="liquid-glass-btn liquid-glass-btn-primary"
              >
                Create New Booking
              </Link>
              <Link
                href="/"
                className="liquid-glass-btn liquid-glass-btn-secondary"
              >
                Return Home
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function BookingConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <BookingConfirmContent />
    </Suspense>
  );
}


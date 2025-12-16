"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DateTime } from 'luxon';
import type { ServiceType, BookingCreateInput } from '@/lib/booking/types';

interface Props {
  serviceType: ServiceType;
  slot: { start: string; end: string };
  customerData: Partial<BookingCreateInput>;
  onSubmit: (captchaAnswer: number) => void;
  onBack: () => void;
  loading: boolean;
}

export default function Step4Review({ 
  serviceType, 
  slot, 
  customerData, 
  onSubmit, 
  onBack,
  loading 
}: Props) {
  const [captcha, setCaptcha] = useState<{ question: string; answer: number } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  useEffect(() => {
    // Generate CAPTCHA server-side
    fetch('/api/bookings/create')
      .then(res => res.json())
      .then(data => {
        if (data.question) {
          // Store the question, but we'll need to validate server-side
          // For now, we'll use a simple client-side generation
          // In production, implement proper session-based CAPTCHA
          const num1 = Math.floor(Math.random() * 10) + 1;
          const num2 = Math.floor(Math.random() * 10) + 1;
          setCaptcha({
            question: `${num1} + ${num2} = ?`,
            answer: num1 + num2,
          });
        }
      })
      .catch(() => {
        // Fallback: generate client-side
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        setCaptcha({
          question: `${num1} + ${num2} = ?`,
          answer: num1 + num2,
        });
      });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captcha) {
      setCaptchaError('Please wait for CAPTCHA to load');
      return;
    }

    const answer = parseInt(captchaAnswer);
    if (isNaN(answer)) {
      setCaptchaError('Please enter a valid number');
      return;
    }

    if (answer !== captcha.answer) {
      setCaptchaError('Incorrect answer. Please try again.');
      // Regenerate CAPTCHA
      const num1 = Math.floor(Math.random() * 10) + 1;
      const num2 = Math.floor(Math.random() * 10) + 1;
      setCaptcha({
        question: `${num1} + ${num2} = ?`,
        answer: num1 + num2,
      });
      setCaptchaAnswer('');
      return;
    }

    onSubmit(answer);
  };

  const start = DateTime.fromISO(slot.start);
  const end = DateTime.fromISO(slot.end);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="glass-card p-8"
    >
      <h2 className="text-heading font-light mb-6">Review & Confirm</h2>
      
      <div className="space-y-6 mb-8">
        {/* Service */}
        <div className="glass-card-subtle p-6">
          <h3 className="text-subheading mb-2">Service</h3>
          <p className="text-body">{serviceType.name}</p>
          <p className="text-caption text-muted-enhanced mt-1">
            Duration: {serviceType.duration_minutes} minutes
          </p>
        </div>

        {/* Date & Time */}
        <div className="glass-card-subtle p-6">
          <h3 className="text-subheading mb-2">Date & Time</h3>
          <p className="text-body">
            {start.toFormat('EEEE, MMMM d, yyyy')}
          </p>
          <p className="text-body">
            {start.toFormat('h:mm a')} - {end.toFormat('h:mm a')}
          </p>
        </div>

        {/* Customer Details */}
        <div className="glass-card-subtle p-6">
          <h3 className="text-subheading mb-2">Your Details</h3>
          <p className="text-body">{customerData.customer_name}</p>
          <p className="text-body">{customerData.customer_email}</p>
          <p className="text-body">{customerData.customer_phone}</p>
          {customerData.customer_notes && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-caption text-muted-enhanced mb-1">Notes:</p>
              <p className="text-body">{customerData.customer_notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* CAPTCHA */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {captcha && (
          <div className="glass-card-subtle p-6">
            <label className="block text-subheading mb-3">
              Security Check <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-4">
              <div className="text-heading font-mono bg-gray-900 px-4 py-3 rounded-lg">
                {captcha.question}
              </div>
              <input
                type="number"
                value={captchaAnswer}
                onChange={(e) => {
                  setCaptchaAnswer(e.target.value);
                  setCaptchaError('');
                }}
                className="w-24 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary transition-colors"
                placeholder="?"
                required
              />
            </div>
            {captchaError && (
              <p className="text-red-400 text-sm mt-2">{captchaError}</p>
            )}
          </div>
        )}

        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="liquid-glass-btn liquid-glass-btn-secondary"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading || !captcha}
            className="liquid-glass-btn liquid-glass-btn-primary"
          >
            {loading ? 'Processing...' : 'Request Booking'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}


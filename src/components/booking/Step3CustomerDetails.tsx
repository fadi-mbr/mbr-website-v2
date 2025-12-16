"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { BookingCreateInput } from '@/lib/booking/types';

interface Props {
  onSubmit: (data: Partial<BookingCreateInput>) => void;
  onBack: () => void;
}

export default function Step3CustomerDetails({ onSubmit, onBack }: Props) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_name.trim() || formData.customer_name.length < 2) {
      newErrors.customer_name = 'Name must be at least 2 characters';
    }

    if (!formData.customer_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      newErrors.customer_email = 'Please enter a valid email address';
    }

    // Format phone number
    const phoneDigits = formData.customer_phone.replace(/\D/g, '');
    let formattedPhone = formData.customer_phone;
    
    if (phoneDigits.startsWith('971')) {
      formattedPhone = `+${phoneDigits}`;
    } else if (phoneDigits.startsWith('0') && phoneDigits.length === 10) {
      formattedPhone = `+971${phoneDigits.slice(1)}`;
    } else if (phoneDigits.length === 9) {
      formattedPhone = `+971${phoneDigits}`;
    } else if (!formData.customer_phone.startsWith('+971')) {
      formattedPhone = `+971${phoneDigits}`;
    }

    if (!/^\+971[0-9]{9}$/.test(formattedPhone)) {
      newErrors.customer_phone = 'Phone must be in format +971XXXXXXXXX';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const phoneDigits = formData.customer_phone.replace(/\D/g, '');
      let formattedPhone = formData.customer_phone;
      
      if (phoneDigits.startsWith('971')) {
        formattedPhone = `+${phoneDigits}`;
      } else if (phoneDigits.startsWith('0') && phoneDigits.length === 10) {
        formattedPhone = `+971${phoneDigits.slice(1)}`;
      } else if (phoneDigits.length === 9) {
        formattedPhone = `+971${phoneDigits}`;
      } else if (!formData.customer_phone.startsWith('+971')) {
        formattedPhone = `+971${phoneDigits}`;
      }

      onSubmit({
        ...formData,
        customer_phone: formattedPhone,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="glass-card p-8"
    >
      <h2 className="text-heading font-light mb-6">Your Details</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-subheading mb-2">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.customer_name}
            onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary transition-colors"
            placeholder="John Doe"
          />
          {errors.customer_name && (
            <p className="text-red-400 text-sm mt-1">{errors.customer_name}</p>
          )}
        </div>

        <div>
          <label className="block text-subheading mb-2">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={formData.customer_email}
            onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary transition-colors"
            placeholder="john@example.com"
          />
          {errors.customer_email && (
            <p className="text-red-400 text-sm mt-1">{errors.customer_email}</p>
          )}
        </div>

        <div>
          <label className="block text-subheading mb-2">
            Phone Number (UAE) <span className="text-red-400">*</span>
          </label>
          <input
            type="tel"
            value={formData.customer_phone}
            onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary transition-colors"
            placeholder="+971501234567 or 0501234567"
          />
          {errors.customer_phone && (
            <p className="text-red-400 text-sm mt-1">{errors.customer_phone}</p>
          )}
          <p className="text-caption text-muted-enhanced mt-1">
            Format: +971XXXXXXXXX
          </p>
        </div>

        <div>
          <label className="block text-subheading mb-2">
            Notes / Issue Description (Optional)
          </label>
          <textarea
            value={formData.customer_notes}
            onChange={(e) => setFormData({ ...formData, customer_notes: e.target.value })}
            rows={4}
            maxLength={1000}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary transition-colors resize-none"
            placeholder="Describe any specific issues or requirements..."
          />
          <p className="text-caption text-muted-enhanced mt-1">
            {formData.customer_notes.length}/1000 characters
          </p>
        </div>

        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={onBack}
            className="liquid-glass-btn liquid-glass-btn-secondary"
          >
            Back
          </button>
          <button
            type="submit"
            className="liquid-glass-btn liquid-glass-btn-primary"
          >
            Continue
          </button>
        </div>
      </form>
    </motion.div>
  );
}


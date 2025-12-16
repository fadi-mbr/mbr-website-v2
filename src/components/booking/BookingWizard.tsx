"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Step1ServiceSelection from './Step1ServiceSelection';
import Step2DateTimeSelection from './Step2DateTimeSelection';
import Step3CustomerDetails from './Step3CustomerDetails';
import Step4Review from './Step4Review';
import type { ServiceType, BookingCreateInput } from '@/lib/booking/types';

type Step = 1 | 2 | 3 | 4;

export default function BookingWizard() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [customerData, setCustomerData] = useState<Partial<BookingCreateInput>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch service types
    fetch('/api/bookings/services')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setServiceTypes(data.service_types);
        }
      })
      .catch(err => {
        console.error('Failed to fetch service types:', err);
        setError('Failed to load services. Please refresh the page.');
      });
  }, []);

  const handleServiceSelect = (service: ServiceType) => {
    setSelectedService(service);
    setCurrentStep(2);
  };

  const handleSlotSelect = (slot: { start: string; end: string }) => {
    setSelectedSlot(slot);
    setCurrentStep(3);
  };

  const handleCustomerSubmit = (data: Partial<BookingCreateInput>) => {
    setCustomerData(data);
    setCurrentStep(4);
  };

  const handleBookingSubmit = async (captchaAnswer: number) => {
    if (!selectedService || !selectedSlot || !customerData.customer_name || 
        !customerData.customer_email || !customerData.customer_phone) {
      setError('Please complete all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const bookingData: BookingCreateInput = {
        service_type: selectedService.id,
        slot_start: selectedSlot.start,
        slot_end: selectedSlot.end,
        customer_name: customerData.customer_name,
        customer_email: customerData.customer_email,
        customer_phone: customerData.customer_phone,
        customer_notes: customerData.customer_notes,
        captcha_answer: captchaAnswer,
      };

      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create booking');
      }

      // Redirect to success page
      window.location.href = `/book/success?bookingId=${result.booking.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white py-20">
      <div className="container-luxury max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-display font-light gradient-text mb-4">
            Book Your Service
          </h1>
          <p className="text-body-enhanced">
            Complete your booking in under 60 seconds
          </p>
        </motion.div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex-1 flex items-center ${
                  step < 4 ? 'mr-4' : ''
                }`}
              >
                <div className="flex items-center w-full">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      currentStep >= step
                        ? 'bg-primary text-white'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {step}
                  </div>
                  {step < 4 && (
                    <div
                      className={`flex-1 h-1 mx-2 transition-all ${
                        currentStep > step ? 'bg-primary' : 'bg-gray-800'
                      }`}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-muted-enhanced">
            <span>Service</span>
            <span>Date & Time</span>
            <span>Details</span>
            <span>Review</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300"
          >
            {error}
          </motion.div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <Step1ServiceSelection
              key="step1"
              serviceTypes={serviceTypes}
              onSelect={handleServiceSelect}
            />
          )}
          {currentStep === 2 && selectedService && (
            <Step2DateTimeSelection
              key="step2"
              serviceType={selectedService}
              onSelect={handleSlotSelect}
              onBack={() => setCurrentStep(1)}
            />
          )}
          {currentStep === 3 && selectedService && selectedSlot && (
            <Step3CustomerDetails
              key="step3"
              onSubmit={handleCustomerSubmit}
              onBack={() => setCurrentStep(2)}
            />
          )}
          {currentStep === 4 && selectedService && selectedSlot && customerData && (
            <Step4Review
              key="step4"
              serviceType={selectedService}
              slot={selectedSlot}
              customerData={customerData}
              onSubmit={handleBookingSubmit}
              onBack={() => setCurrentStep(3)}
              loading={loading}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


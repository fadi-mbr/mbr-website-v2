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
        console.log('Service types response:', data);
        if (data.success) {
          setServiceTypes(data.service_types || []);
          if (!data.service_types || data.service_types.length === 0) {
            setError('No services available. Please configure services in the admin panel.');
          }
        } else {
          setError(data.error || 'Failed to load services');
        }
      })
      .catch(err => {
        console.error('Failed to fetch service types:', err);
        setError('Failed to load services. Please refresh the page.');
      });
  }, []);

  const handleServiceSelect = (service: ServiceType) => {
    console.log('BookingWizard - handleServiceSelect called with:', service);
    setSelectedService(service);
    console.log('BookingWizard - Setting currentStep to 2');
    setCurrentStep(2);
    console.log('BookingWizard - State updated');
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

      console.log('Submitting booking data:', bookingData);

      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        const text = await response.text();
        console.error('Response text:', text);
        setError('Server returned an invalid response. Please try again.');
        setLoading(false);
        return;
      }
      
      console.log('Booking creation response:', { 
        status: response.status, 
        statusText: response.statusText,
        result 
      });

      if (!response.ok) {
        // Handle validation errors with detailed messages
        let errorMessage = result.error || result.message || result.primaryError || 'Failed to create booking. Please try again.';
        
        // Log full error details for debugging
        console.error('Booking creation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: result.error,
          message: result.message,
          primaryError: result.primaryError,
          details: result.details,
          allErrors: result.allErrors,
          fullResponse: result,
        });
        
        // If there are multiple errors, show them all
        if (result.allErrors && result.allErrors.length > 1) {
          errorMessage = 'Please fix the following errors:\n' + result.allErrors.map((err: string, i: number) => `${i + 1}. ${err}`).join('\n');
        }
        
        // Use primaryError if available (includes helpful tips)
        if (result.primaryError) {
          errorMessage = result.primaryError;
        }
        
        // Add helpful context for common errors
        if (result.details && Array.isArray(result.details)) {
          interface ValidationError {
            path: (string | number)[];
            message: string;
          }
          
          const phoneError = result.details.find((d: ValidationError) => 
            Array.isArray(d.path) && d.path.includes('customer_phone')
          );
          if (phoneError) {
            errorMessage += '\n\n💡 Tip: UAE phone numbers should be in format +971XXXXXXXXX (e.g., +971501234567)';
          }
          
          const dateError = result.details.find((d: ValidationError) => 
            Array.isArray(d.path) && (d.path.includes('slot_start') || d.path.includes('slot_end'))
          );
          if (dateError) {
            errorMessage += '\n\n💡 Tip: Please go back and select a date and time again.';
          }
        }
        
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (result.success) {
        // Log email status for debugging
        if (result.emailSent === false) {
          console.warn('⚠️  Booking created but email was not sent:', result.emailError);
          // Still redirect to success, but log the issue
        } else if (result.emailSent === true) {
          console.log('✅ Email sent successfully');
        }
        
        // Redirect to success page
        window.location.href = `/book/success?bookingId=${result.booking.id}`;
      } else {
        let errorMsg = result.error || 'Failed to create booking. Please try again.';
        // Include error details if available
        if (result.details) {
          errorMsg += `\n\nDetails: ${result.details}`;
        }
        if (result.code) {
          errorMsg += `\n\nError code: ${result.code}`;
        }
        setError(errorMsg);
        setLoading(false);
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again. If the problem persists, please contact us.');
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

        {/* Error Message - Below form content */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300"
          >
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <div className="font-medium mb-1">Error</div>
                <div className="text-sm whitespace-pre-line">{error}</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}


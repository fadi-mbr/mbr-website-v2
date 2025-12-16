"use client";

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { ServiceType } from '@/lib/booking/types';

interface Props {
  serviceTypes: ServiceType[];
  onSelect: (service: ServiceType) => void;
}

export default function Step1ServiceSelection({ serviceTypes, onSelect }: Props) {
  useEffect(() => {
    console.log('Step1ServiceSelection - serviceTypes:', serviceTypes);
    console.log('Step1ServiceSelection - serviceTypes.length:', serviceTypes.length);
  }, [serviceTypes]);

  const handleClick = (service: ServiceType, event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('Service clicked:', service);
    console.log('Calling onSelect with:', service);
    try {
      onSelect(service);
      console.log('onSelect called successfully');
    } catch (error) {
      console.error('Error calling onSelect:', error);
    }
  };

  if (serviceTypes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="glass-card p-8"
      >
        <h2 className="text-heading font-light mb-6">Select Service Type</h2>
        <div className="text-center py-8">
          <p className="text-body-enhanced text-muted-enhanced mb-4">
            Loading services...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-enhanced mt-4">
            If services don&apos;t load, please configure them in the admin panel.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="glass-card p-8"
    >
      <h2 className="text-heading font-light mb-6">Select Service Type</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {serviceTypes.map((service, index) => (
          <button
            key={service.id}
            type="button"
            onClick={(e) => handleClick(service, e)}
            onMouseDown={(e) => {
              console.log('Mouse down on service:', service.name);
              e.preventDefault();
            }}
            className="glass-card-subtle p-6 text-left hover:glow-red transition-all group cursor-pointer w-full relative z-10"
            style={{ pointerEvents: 'auto' }}
          >
            <h3 className="text-subheading text-white mb-2 group-hover:text-primary transition-colors">
              {service.name}
            </h3>
            <p className="text-caption text-muted-enhanced">
              Duration: {service.duration_minutes} minutes
            </p>
          </button>
        ))}
      </div>
    </motion.div>
  );
}


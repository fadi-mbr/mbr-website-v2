"use client";

import React from 'react';
import { motion } from 'framer-motion';
import type { ServiceType } from '@/lib/booking/types';

interface Props {
  serviceTypes: ServiceType[];
  onSelect: (service: ServiceType) => void;
}

export default function Step1ServiceSelection({ serviceTypes, onSelect }: Props) {
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
          <motion.button
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelect(service)}
            className="glass-card-subtle p-6 text-left hover:glow-red transition-all group"
          >
            <h3 className="text-subheading text-white mb-2 group-hover:text-primary transition-colors">
              {service.name}
            </h3>
            <p className="text-caption text-muted-enhanced">
              Duration: {service.duration_minutes} minutes
            </p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}


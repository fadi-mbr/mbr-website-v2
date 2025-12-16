"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DateTime } from 'luxon';
import type { ServiceType, SlotAvailability } from '@/lib/booking/types';

interface Props {
  serviceType: ServiceType;
  onSelect: (slot: { start: string; end: string }) => void;
  onBack: () => void;
}

export default function Step2DateTimeSelection({ serviceType, onSelect, onBack }: Props) {
  const [selectedDate, setSelectedDate] = useState<string>(
    DateTime.now().toFormat('yyyy-MM-dd')
  );
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSlots();
  }, [selectedDate, serviceType.id]);

  const loadSlots = async () => {
    setLoading(true);
    try {
      const startDate = DateTime.fromISO(selectedDate).startOf('day').toJSDate();
      const endDate = DateTime.fromISO(selectedDate).endOf('day').toJSDate();
      
      const response = await fetch(
        `/api/bookings/slots?start=${startDate.toISOString()}&end=${endDate.toISOString()}&service_type=${serviceType.id}`
      );
      
      const result = await response.json();
      if (result.success) {
        setSlots(result.slots);
      }
    } catch (error) {
      console.error('Failed to load slots:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate date options (next 30 days)
  const dateOptions = Array.from({ length: 30 }, (_, i) => {
    const date = DateTime.now().plus({ days: i });
    return {
      value: date.toFormat('yyyy-MM-dd'),
      label: date.toFormat('EEEE, MMMM d'),
      isToday: i === 0,
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="glass-card p-8"
    >
      <h2 className="text-heading font-light mb-6">Select Date & Time</h2>
      
      {/* Date Selection */}
      <div className="mb-6">
        <label className="block text-subheading mb-3">Select Date</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {dateOptions.map((date) => (
            <button
              key={date.value}
              onClick={() => setSelectedDate(date.value)}
              className={`p-3 rounded-lg border transition-all ${
                selectedDate === date.value
                  ? 'bg-primary border-primary text-white'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="text-sm font-medium">{date.label.split(',')[0]}</div>
              <div className="text-xs text-muted-enhanced">{date.label.split(',')[1]}</div>
              {date.isToday && (
                <div className="text-xs text-primary mt-1">Today</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Time Slots */}
      <div>
        <label className="block text-subheading mb-3">Available Time Slots</label>
        {loading ? (
          <div className="text-center py-8 text-muted-enhanced">Loading slots...</div>
        ) : slots.length === 0 ? (
          <div className="text-center py-8 text-muted-enhanced">
            No available slots for this date. Please select another date.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {slots.map((slot) => {
              const start = DateTime.fromISO(slot.slot_start);
              const timeStr = start.toFormat('h:mm a');
              
              return (
                <button
                  key={slot.slot_start}
                  onClick={() => {
                    if (slot.available) {
                      onSelect({ start: slot.slot_start, end: slot.slot_end });
                    }
                  }}
                  disabled={!slot.available}
                  className={`p-4 rounded-lg border transition-all ${
                    slot.status === 'available'
                      ? 'border-green-500/50 hover:border-green-500 bg-green-500/10 hover:bg-green-500/20 cursor-pointer'
                      : slot.status === 'limited'
                      ? 'border-yellow-500/50 bg-yellow-500/10 cursor-pointer'
                      : 'border-gray-700 bg-gray-800/50 cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="text-body font-medium">{timeStr}</div>
                  {slot.status === 'limited' && (
                    <div className="text-xs text-yellow-400 mt-1">Limited</div>
                  )}
                  {slot.status === 'full' && (
                    <div className="text-xs text-red-400 mt-1">Full</div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="liquid-glass-btn liquid-glass-btn-secondary"
        >
          Back
        </button>
      </div>
    </motion.div>
  );
}


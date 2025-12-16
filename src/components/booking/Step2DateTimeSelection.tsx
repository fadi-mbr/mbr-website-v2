"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { DateTime } from 'luxon';
import type { ServiceType, SlotAvailability } from '@/lib/booking/types';
import { DateTimePicker } from './DateTimePicker';

interface Props {
  serviceType: ServiceType;
  onSelect: (slot: { start: string; end: string }) => void;
  onBack: () => void;
}

export default function Step2DateTimeSelection({ serviceType, onSelect, onBack }: Props) {
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);

  // Load slots for the next 90 days
  const loadSlots = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = DateTime.now().startOf('day').toJSDate();
      const endDate = DateTime.now().plus({ days: 90 }).endOf('day').toJSDate();
      
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
  }, [serviceType.id]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const handleSlotSelect = (slot: { start: string; end: string }) => {
    setSelectedSlot(slot);
    onSelect(slot);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-heading font-light mb-2">Select Date & Time</h2>
        <p className="text-body-enhanced text-muted-enhanced">
          Choose your preferred appointment time for {serviceType.name}
        </p>
      </div>

      {/* DateTime Picker */}
      <div>
        <label className="block text-subheading mb-3">Date & Time</label>
        <DateTimePicker
          slots={slots}
          loading={loading}
          onSelect={handleSlotSelect}
          selectedSlot={selectedSlot}
        />
      </div>

      {/* Selected Slot Info */}
      {selectedSlot && (
        <div className="p-4 bg-gray-900/50 rounded-lg border border-primary/20">
          <div className="text-sm text-muted-enhanced mb-1">Selected Appointment</div>
          <div className="text-body font-medium">
            {DateTime.fromISO(selectedSlot.start).toFormat('EEEE, MMMM d, yyyy')}
          </div>
          <div className="text-body-enhanced text-primary">
            {DateTime.fromISO(selectedSlot.start).toFormat('h:mm a')} - {DateTime.fromISO(selectedSlot.end).toFormat('h:mm a')}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="liquid-glass-btn liquid-glass-btn-secondary"
        >
          Back
        </button>
        <button
          onClick={() => {
            if (selectedSlot) {
              onSelect(selectedSlot);
            }
          }}
          disabled={!selectedSlot}
          className="liquid-glass-btn liquid-glass-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

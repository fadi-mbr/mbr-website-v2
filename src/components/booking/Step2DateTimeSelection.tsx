"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DateTime } from 'luxon';
import type { ServiceType, SlotAvailability } from '@/lib/booking/types';

interface Props {
  serviceType: ServiceType;
  onSelect: (slot: { start: string; end: string }) => void;
  onBack: () => void;
}

export default function Step2DateTimeSelection({ serviceType, onSelect, onBack }: Props) {
  const [currentMonth, setCurrentMonth] = useState<DateTime>(DateTime.now());
  const [selectedDate, setSelectedDate] = useState<string>(
    DateTime.now().toFormat('yyyy-MM-dd')
  );
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateAvailability, setDateAvailability] = useState<Map<string, number>>(new Map());

  const loadSlots = useCallback(async () => {
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
  }, [selectedDate, serviceType.id]);

  const loadMonthAvailability = useCallback(async () => {
    try {
      const monthStart = currentMonth.startOf('month').startOf('day').toJSDate();
      const monthEnd = currentMonth.endOf('month').endOf('day').toJSDate();
      
      const response = await fetch(
        `/api/bookings/slots?start=${monthStart.toISOString()}&end=${monthEnd.toISOString()}&service_type=${serviceType.id}`
      );
      
      const result = await response.json();
      if (result.success) {
        const availabilityMap = new Map<string, number>();
        result.slots.forEach((slot: SlotAvailability) => {
          const date = DateTime.fromISO(slot.slot_start).toFormat('yyyy-MM-dd');
          const current = availabilityMap.get(date) || 0;
          if (slot.available) {
            availabilityMap.set(date, current + 1);
          }
        });
        setDateAvailability(availabilityMap);
      }
    } catch (error) {
      console.error('Failed to load month availability:', error);
    }
  }, [currentMonth, serviceType.id]);

  // Load slots when date changes
  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  // Load availability for visible month
  useEffect(() => {
    loadMonthAvailability();
  }, [loadMonthAvailability]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const start = currentMonth.startOf('month').startOf('week');
    const end = currentMonth.endOf('month').endOf('week');
    const days: Array<{ date: DateTime; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean; availableSlots: number }> = [];
    
    let current = start;
    const today = DateTime.now();
    
    while (current <= end) {
      const dateStr = current.toFormat('yyyy-MM-dd');
      days.push({
        date: current,
        isCurrentMonth: current.month === currentMonth.month,
        isToday: current.hasSame(today, 'day'),
        isSelected: dateStr === selectedDate,
        availableSlots: dateAvailability.get(dateStr) || 0,
      });
      current = current.plus({ days: 1 });
    }
    
    return days;
  }, [currentMonth, selectedDate, dateAvailability]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDateSelect = (date: DateTime) => {
    const dateStr = date.toFormat('yyyy-MM-dd');
    const today = DateTime.now();
    
    // Don't allow selecting past dates
    if (date < today.startOf('day')) {
      return;
    }
    
    setSelectedDate(dateStr);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(currentMonth.minus({ months: 1 }));
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.plus({ months: 1 }));
  };

  const groupSlotsByPeriod = (slots: SlotAvailability[]) => {
    const morning: SlotAvailability[] = [];
    const afternoon: SlotAvailability[] = [];
    const evening: SlotAvailability[] = [];

    slots.forEach(slot => {
      const hour = DateTime.fromISO(slot.slot_start).hour;
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  };

  const { morning, afternoon, evening } = groupSlotsByPeriod(slots);

  const formatTime = (isoString: string) => {
    return DateTime.fromISO(isoString).toFormat('h:mm a');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="glass-card p-4 md:p-8"
    >
      <h2 className="text-heading font-light mb-6">Select Date & Time</h2>
      
      {/* Calendar */}
      <div className="mb-8">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors touch-target"
            aria-label="Previous month"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-subheading font-medium">
            {currentMonth.toFormat('MMMM yyyy')}
          </h3>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors touch-target"
            aria-label="Next month"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Week Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs md:text-sm text-muted-enhanced py-2 font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          <AnimatePresence mode="wait">
            {calendarDays.map((day, index) => {
              const isPast = day.date < DateTime.now().startOf('day');
              const hasAvailability = day.availableSlots > 0;
              
              return (
                <motion.button
                  key={day.date.toISO()}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: index * 0.01 }}
                  onClick={() => handleDateSelect(day.date)}
                  disabled={isPast || !day.isCurrentMonth}
                  className={`
                    aspect-square min-h-[44px] md:min-h-[56px] rounded-lg transition-all
                    touch-target flex flex-col items-center justify-center relative
                    ${day.isSelected
                      ? 'bg-primary text-white scale-105'
                      : day.isToday
                      ? 'bg-primary/20 text-primary border-2 border-primary'
                      : !day.isCurrentMonth
                      ? 'opacity-30 cursor-not-allowed'
                      : isPast
                      ? 'opacity-40 cursor-not-allowed bg-gray-800'
                      : hasAvailability
                      ? 'bg-gray-800 hover:bg-gray-700 cursor-pointer'
                      : 'bg-gray-900/50 cursor-not-allowed opacity-50'
                    }
                  `}
                >
                  <span className={`text-sm md:text-base font-medium ${day.isSelected ? 'text-white' : ''}`}>
                    {day.date.day}
                  </span>
                  {hasAvailability && day.isCurrentMonth && !isPast && (
                    <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full block"></span>
                    </span>
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Selected Date Display */}
      <div className="mb-6 p-4 bg-gray-900/50 rounded-lg">
        <div className="text-sm text-muted-enhanced mb-1">Selected Date</div>
        <div className="text-body font-medium">
          {DateTime.fromISO(selectedDate).toFormat('EEEE, MMMM d, yyyy')}
        </div>
      </div>

      {/* Time Slots */}
      <div>
        <label className="block text-subheading mb-4">Available Time Slots</label>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-900/50 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-12 text-muted-enhanced">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>No available slots for this date.</p>
            <p className="text-sm mt-2">Please select another date.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Morning Slots */}
            {morning.length > 0 && (
              <div>
                <div className="text-xs text-muted-enhanced mb-3 font-medium uppercase tracking-wide">Morning</div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {morning.map((slot) => (
                    <motion.button
                      key={slot.slot_start}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (slot.available) {
                          onSelect({ start: slot.slot_start, end: slot.slot_end });
                        }
                      }}
                      disabled={!slot.available}
                      className={`
                        p-4 rounded-lg border-2 transition-all touch-target
                        ${slot.status === 'available'
                          ? 'border-green-500/50 bg-green-500/10 hover:border-green-500 hover:bg-green-500/20 cursor-pointer active:scale-95'
                          : slot.status === 'limited'
                          ? 'border-yellow-500/50 bg-yellow-500/10 hover:border-yellow-500 hover:bg-yellow-500/20 cursor-pointer'
                          : 'border-gray-700 bg-gray-800/50 cursor-not-allowed opacity-50'
                        }
                      `}
                    >
                      <div className="text-body font-semibold">{formatTime(slot.slot_start)}</div>
                      {slot.status === 'limited' && (
                        <div className="text-xs text-yellow-400 mt-1">Limited</div>
                      )}
                      {slot.status === 'full' && (
                        <div className="text-xs text-red-400 mt-1">Full</div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Afternoon Slots */}
            {afternoon.length > 0 && (
              <div>
                <div className="text-xs text-muted-enhanced mb-3 font-medium uppercase tracking-wide">Afternoon</div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {afternoon.map((slot) => (
                    <motion.button
                      key={slot.slot_start}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (slot.available) {
                          onSelect({ start: slot.slot_start, end: slot.slot_end });
                        }
                      }}
                      disabled={!slot.available}
                      className={`
                        p-4 rounded-lg border-2 transition-all touch-target
                        ${slot.status === 'available'
                          ? 'border-green-500/50 bg-green-500/10 hover:border-green-500 hover:bg-green-500/20 cursor-pointer active:scale-95'
                          : slot.status === 'limited'
                          ? 'border-yellow-500/50 bg-yellow-500/10 hover:border-yellow-500 hover:bg-yellow-500/20 cursor-pointer'
                          : 'border-gray-700 bg-gray-800/50 cursor-not-allowed opacity-50'
                        }
                      `}
                    >
                      <div className="text-body font-semibold">{formatTime(slot.slot_start)}</div>
                      {slot.status === 'limited' && (
                        <div className="text-xs text-yellow-400 mt-1">Limited</div>
                      )}
                      {slot.status === 'full' && (
                        <div className="text-xs text-red-400 mt-1">Full</div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Evening Slots */}
            {evening.length > 0 && (
              <div>
                <div className="text-xs text-muted-enhanced mb-3 font-medium uppercase tracking-wide">Evening</div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {evening.map((slot) => (
                    <motion.button
                      key={slot.slot_start}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (slot.available) {
                          onSelect({ start: slot.slot_start, end: slot.slot_end });
                        }
                      }}
                      disabled={!slot.available}
                      className={`
                        p-4 rounded-lg border-2 transition-all touch-target
                        ${slot.status === 'available'
                          ? 'border-green-500/50 bg-green-500/10 hover:border-green-500 hover:bg-green-500/20 cursor-pointer active:scale-95'
                          : slot.status === 'limited'
                          ? 'border-yellow-500/50 bg-yellow-500/10 hover:border-yellow-500 hover:bg-yellow-500/20 cursor-pointer'
                          : 'border-gray-700 bg-gray-800/50 cursor-not-allowed opacity-50'
                        }
                      `}
                    >
                      <div className="text-body font-semibold">{formatTime(slot.slot_start)}</div>
                      {slot.status === 'limited' && (
                        <div className="text-xs text-yellow-400 mt-1">Limited</div>
                      )}
                      {slot.status === 'full' && (
                        <div className="text-xs text-red-400 mt-1">Full</div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8 pt-6 border-t border-gray-800">
        <button
          onClick={onBack}
          className="liquid-glass-btn liquid-glass-btn-secondary touch-target"
        >
          Back
        </button>
      </div>
    </motion.div>
  );
}

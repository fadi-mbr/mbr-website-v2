"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, ClockIcon } from "@radix-ui/react-icons";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday, isBefore, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { SlotAvailability } from "@/lib/booking/types";

interface BookingCalendarProps {
  slots: SlotAvailability[];
  loading?: boolean;
  onSelect: (slot: { start: string; end: string }) => void;
  selectedSlot?: { start: string; end: string } | null;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Helper to count available slots per date
function getSlotCountForDate(date: Date, slots: SlotAvailability[]): number {
  const dateStr = format(date, "yyyy-MM-dd");
  return slots.filter(slot => {
    const slotDate = format(new Date(slot.slot_start), "yyyy-MM-dd");
    return slotDate === dateStr && slot.available;
  }).length;
}

// Helper to check if date has available slots
function hasAvailableSlots(date: Date, slots: SlotAvailability[]): boolean {
  return getSlotCountForDate(date, slots) > 0;
}

export function BookingCalendar({ 
  slots, 
  loading = false, 
  onSelect,
  selectedSlot 
}: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(
    selectedSlot ? new Date(selectedSlot.start) : null
  );
  const [isOpen, setIsOpen] = React.useState(false);

  // Generate calendar days for current month view
  const calendarDays = React.useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days: Date[] = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  // Filter slots for selected date
  const availableSlotsForDate = React.useMemo(() => {
    if (!selectedDate) return [];
    
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return slots.filter(slot => {
      const slotDate = format(new Date(slot.slot_start), "yyyy-MM-dd");
      return slotDate === dateStr && slot.available;
    }).sort((a, b) => 
      new Date(a.slot_start).getTime() - new Date(b.slot_start).getTime()
    );
  }, [selectedDate, slots]);

  const handleDateSelect = (date: Date) => {
    if (hasAvailableSlots(date, slots) && !isBefore(date, new Date(new Date().setHours(0, 0, 0, 0)))) {
      setSelectedDate(date);
    }
  };

  const handleSlotSelect = (slot: SlotAvailability) => {
    onSelect({
      start: slot.slot_start,
      end: slot.slot_end,
    });
    setIsOpen(false);
  };

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const selectedSlotDisplay = selectedSlot 
    ? format(new Date(selectedSlot.start), "EEEE, MMMM d, yyyy 'at' h:mm aa")
    : null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-12",
            "border-gray-700 bg-gray-900/50 hover:bg-gray-800/50",
            "text-white hover:text-white",
            !selectedSlotDisplay && "text-gray-400"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            {selectedSlotDisplay || "Select date and time"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 bg-gray-900 border-gray-700 shadow-xl" 
        align="start"
      >
        <div className="flex flex-col sm:flex-row">
          {/* Calendar Section */}
          <div className="p-4 border-b sm:border-b-0 sm:border-r border-gray-700">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={goToPreviousMonth}
                className="h-8 w-8 flex items-center justify-center rounded-md bg-gray-800/50 hover:bg-gray-700 text-white hover:text-primary transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <h2 className="text-lg font-bold text-white tracking-wide">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <button
                onClick={goToNextMonth}
                className="h-8 w-8 flex items-center justify-center rounded-md bg-gray-800/50 hover:bg-gray-700 text-white hover:text-primary transition-colors"
                aria-label="Next month"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="w-[308px]">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 mb-2">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="h-10 flex items-center justify-center text-xs font-semibold text-gray-400 uppercase tracking-wider"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 border border-gray-700 rounded-lg overflow-hidden">
                {calendarDays.map((day, index) => {
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isTodayDate = isToday(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isPast = isBefore(day, new Date(new Date().setHours(0, 0, 0, 0))) && !isTodayDate;
                  const slotCount = getSlotCountForDate(day, slots);
                  const hasSlots = slotCount > 0;
                  const isDisabled = isPast || !hasSlots || !isCurrentMonth;

                  return (
                    <button
                      key={index}
                      onClick={() => !isDisabled && handleDateSelect(day)}
                      disabled={isDisabled}
                      className={cn(
                        // Base styles
                        "h-11 flex flex-col items-center justify-center relative",
                        "transition-all duration-150",
                        "border-r border-b border-gray-700",
                        // Remove border on last column and last row
                        (index + 1) % 7 === 0 && "border-r-0",
                        index >= calendarDays.length - 7 && "border-b-0",
                        // Not current month
                        !isCurrentMonth && "bg-gray-900/60 text-gray-600",
                        // Current month - enabled
                        isCurrentMonth && !isDisabled && "bg-gray-800/30 text-white hover:bg-gray-700 cursor-pointer",
                        // Current month - disabled (no slots or past)
                        isCurrentMonth && isDisabled && !isTodayDate && "bg-gray-900/40 text-gray-500",
                        // Past dates
                        isPast && "text-gray-600 line-through",
                        // Today
                        isTodayDate && !isSelected && "bg-primary/20 text-primary font-bold ring-2 ring-inset ring-primary",
                        // Selected
                        isSelected && "bg-primary text-white font-bold ring-2 ring-inset ring-primary shadow-lg",
                        // Focus
                        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset focus:z-10"
                      )}
                    >
                      <span className="text-sm">{format(day, "d")}</span>
                      {/* Slot indicator */}
                      {hasSlots && isCurrentMonth && !isPast && (
                        <span 
                          className={cn(
                            "absolute bottom-1 w-1.5 h-1.5 rounded-full",
                            isSelected ? "bg-white" : "bg-primary"
                          )}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-primary/20 ring-1 ring-primary"></span>
                  <span>Today</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  <span>Available</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Time Slots Section */}
          <div className="flex flex-col w-full sm:w-72 sm:h-[420px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-8 h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
                <div className="text-sm text-gray-400">Loading available slots...</div>
              </div>
            ) : !selectedDate ? (
              <div className="flex flex-col items-center justify-center p-8 h-full">
                <CalendarIcon className="h-10 w-10 text-gray-600 mb-3" />
                <div className="text-sm font-medium text-gray-400 mb-1">Select a date</div>
                <div className="text-xs text-gray-500 text-center px-4">
                  Choose a date from the calendar to see available time slots
                </div>
              </div>
            ) : availableSlotsForDate.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 h-full">
                <ClockIcon className="h-10 w-10 text-gray-600 mb-3" />
                <div className="text-sm font-medium text-gray-400 mb-1">No available slots</div>
                <div className="text-xs text-gray-500 text-center px-4">
                  This date has no available time slots. Please select another date.
                </div>
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-gray-700 bg-gray-800/30">
                  <div className="text-sm font-bold text-white">
                    {format(selectedDate, "EEEE, MMMM d")}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {availableSlotsForDate.length} {availableSlotsForDate.length === 1 ? 'slot' : 'slots'} available
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-3 space-y-2">
                    {availableSlotsForDate.map((slot) => {
                      const slotTime = format(new Date(slot.slot_start), "h:mm aa");
                      const slotEnd = format(new Date(slot.slot_end), "h:mm aa");
                      const isSlotSelected = selectedSlot?.start === slot.slot_start;
                      
                      return (
                        <button
                          key={slot.slot_start}
                          onClick={() => handleSlotSelect(slot)}
                          disabled={!slot.available}
                          className={cn(
                            "w-full flex items-center justify-between py-3 px-4 rounded-lg",
                            "transition-all duration-150",
                            "border",
                            isSlotSelected 
                              ? "bg-primary text-white border-primary shadow-lg shadow-primary/30" 
                              : "bg-gray-800/50 text-white border-gray-700 hover:bg-gray-700 hover:border-gray-600",
                            slot.status === "limited" && !isSlotSelected && "border-yellow-500/50 bg-yellow-500/10",
                            !slot.available && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div className="flex flex-col items-start">
                            <span className="text-sm font-medium">{slotTime}</span>
                            {slot.status === "limited" && (
                              <span className="text-xs text-yellow-400 mt-0.5">Limited availability</span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            until {slotEnd}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <ScrollBar orientation="vertical" />
                </ScrollArea>
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

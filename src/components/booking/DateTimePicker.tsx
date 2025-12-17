"use client";

import * as React from "react";
import { CalendarIcon, ClockIcon } from "@radix-ui/react-icons";
import { format, isToday, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { SlotAvailability } from "@/lib/booking/types";

interface DateTimePickerProps {
  slots: SlotAvailability[];
  loading?: boolean;
  onSelect: (slot: { start: string; end: string }) => void;
  selectedSlot?: { start: string; end: string } | null;
}

// Helper to count available slots per date
function getSlotCountForDate(date: Date, slots: SlotAvailability[]): number {
  const dateStr = format(date, "yyyy-MM-dd");
  return slots.filter(slot => {
    const slotDate = format(new Date(slot.slot_start), "yyyy-MM-dd");
    return slotDate === dateStr && slot.available;
  }).length;
}

export function DateTimePicker({ 
  slots, 
  loading = false, 
  onSelect,
  selectedSlot 
}: DateTimePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    selectedSlot ? new Date(selectedSlot.start) : undefined
  );
  const [isOpen, setIsOpen] = React.useState(false);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  // Filter slots for selected date
  const availableSlotsForDate = React.useMemo(() => {
    if (!date) return [];
    
    const dateStr = format(date, "yyyy-MM-dd");
    return slots.filter(slot => {
      const slotDate = format(new Date(slot.slot_start), "yyyy-MM-dd");
      return slotDate === dateStr && slot.available;
    }).sort((a, b) => 
      new Date(a.slot_start).getTime() - new Date(b.slot_start).getTime()
    );
  }, [date, slots]);

  const handleSlotSelect = (slot: SlotAvailability) => {
    onSelect({
      start: slot.slot_start,
      end: slot.slot_end,
    });
    setIsOpen(false);
  };

  const selectedSlotDate = selectedSlot 
    ? format(new Date(selectedSlot.start), "EEEE, MMMM d, yyyy 'at' h:mm aa")
    : null;

  // Custom day formatter to show slot count
  const formatDayWithSlots = (day: Date) => {
    const dayNumber = format(day, "d");
    const slotCount = getSlotCountForDate(day, slots);
    
    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <span className="text-sm font-medium">{dayNumber}</span>
        {slotCount > 0 && (
          <span className="text-[10px] text-primary font-semibold leading-none mt-0.5">
            {slotCount}
          </span>
        )}
      </div>
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-12",
            "border-gray-700 bg-gray-900/50 hover:bg-gray-800/50",
            "text-white hover:text-white",
            !selectedSlotDate && "text-gray-400"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            {selectedSlotDate ? (
              selectedSlotDate
            ) : (
              "Select date and time"
            )}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 bg-gray-900 border-gray-700 shadow-xl" 
        align="start"
      >
        <div className="flex flex-col sm:flex-row">
          {/* Calendar Section */}
          <div className="border-b sm:border-b-0 sm:border-r border-gray-700">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const checkDate = new Date(date);
                checkDate.setHours(0, 0, 0, 0);
                
                // Disable past dates
                if (checkDate < today) {
                  return true;
                }
                
                // Disable dates that have no available slots
                const dateStr = format(date, "yyyy-MM-dd");
                const hasSlots = slots.some(slot => {
                  const slotDate = format(new Date(slot.slot_start), "yyyy-MM-dd");
                  return slotDate === dateStr && slot.available;
                });
                
                return !hasSlots;
              }}
              modifiers={{
                today: new Date(),
                hasSlots: (date) => {
                  const dateStr = format(date, "yyyy-MM-dd");
                  return slots.some(slot => {
                    const slotDate = format(new Date(slot.slot_start), "yyyy-MM-dd");
                    return slotDate === dateStr && slot.available;
                  });
                },
              }}
              modifiersClassNames={{
                today: "day-today",
                hasSlots: "day-has-slots",
              }}
            />
          </div>
          
          {/* Time Slots Section */}
          <div className="flex flex-col w-full sm:w-72 sm:h-[350px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-8 h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
                <div className="text-sm text-gray-400">Loading available slots...</div>
              </div>
            ) : !date ? (
              <div className="flex flex-col items-center justify-center p-8 h-full">
                <CalendarIcon className="h-8 w-8 text-gray-600 mb-2 opacity-50" />
                <div className="text-sm font-medium text-gray-400 mb-1">Select a date</div>
                <div className="text-xs text-gray-500 text-center">Choose a date from the calendar to see available time slots</div>
              </div>
            ) : availableSlotsForDate.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 h-full">
                <ClockIcon className="h-8 w-8 text-gray-600 mb-2 opacity-50" />
                <div className="text-sm font-medium text-gray-400 mb-1">No available slots</div>
                <div className="text-xs text-gray-500 text-center">This date has no available time slots. Please select another date.</div>
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-gray-700">
                  <div className="text-sm font-semibold text-white">
                    {format(date, "EEEE, MMMM d")}
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
                      const isSelected = selectedSlot?.start === slot.slot_start;
                      
                      return (
                        <Button
                          key={slot.slot_start}
                          variant={isSelected ? "default" : "ghost"}
                          className={cn(
                            "w-full justify-between h-auto py-3 px-4",
                            "text-left font-normal transition-all duration-200",
                            "border border-transparent",
                            isSelected 
                              ? "bg-primary text-white border-primary shadow-lg shadow-primary/50" 
                              : "bg-gray-800/50 text-white hover:bg-gray-700/80 hover:border-gray-600",
                            slot.status === "limited" && !isSelected && "border-yellow-500/50 bg-yellow-500/10",
                            !slot.available && "opacity-50 cursor-not-allowed"
                          )}
                          onClick={() => handleSlotSelect(slot)}
                          disabled={!slot.available}
                        >
                          <div className="flex flex-col items-start">
                            <span className="text-sm font-medium">
                              {slotTime}
                            </span>
                            {slot.status === "limited" && (
                              <span className="text-xs text-yellow-400 mt-0.5 font-medium">
                                Limited availability
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            {slotEnd}
                          </div>
                        </Button>
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


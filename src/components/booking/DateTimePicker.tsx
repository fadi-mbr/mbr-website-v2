"use client";

import * as React from "react";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { DateTime } from "luxon";
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
    ? format(new Date(selectedSlot.start), "MM/dd/yyyy hh:mm aa")
    : null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedSlotDate && "text-gray-500"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedSlotDate ? (
            selectedSlotDate
          ) : (
            <span>Select date and time</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="sm:flex">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            disabled={(date) => {
              // Disable dates that have no available slots
              const dateStr = format(date, "yyyy-MM-dd");
              const hasSlots = slots.some(slot => {
                const slotDate = format(new Date(slot.slot_start), "yyyy-MM-dd");
                return slotDate === dateStr && slot.available;
              });
              return !hasSlots;
            }}
          />
          <div className="flex flex-col sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x border-t sm:border-t-0 sm:border-l">
            {loading ? (
              <div className="flex items-center justify-center p-8 w-64 sm:w-auto">
                <div className="text-sm text-gray-500">Loading slots...</div>
              </div>
            ) : !date ? (
              <div className="flex items-center justify-center p-8 w-64 sm:w-auto">
                <div className="text-sm text-gray-500">Select a date</div>
              </div>
            ) : availableSlotsForDate.length === 0 ? (
              <div className="flex items-center justify-center p-8 w-64 sm:w-auto">
                <div className="text-sm text-gray-500">No available slots</div>
              </div>
            ) : (
              <ScrollArea className="w-64 sm:w-auto sm:h-[300px]">
                <div className="p-2">
                  {availableSlotsForDate.map((slot) => {
                    const slotTime = format(new Date(slot.slot_start), "hh:mm aa");
                    const isSelected = selectedSlot?.start === slot.slot_start;
                    
                    return (
                      <Button
                        key={slot.slot_start}
                        size="sm"
                        variant={isSelected ? "default" : "ghost"}
                        className={cn(
                          "w-full justify-start mb-1",
                          slot.status === "limited" && "border-yellow-400 border",
                          slot.status === "full" && "opacity-50"
                        )}
                        onClick={() => handleSlotSelect(slot)}
                        disabled={!slot.available}
                      >
                        <span className="flex items-center gap-2">
                          <span>{slotTime}</span>
                          {slot.status === "limited" && (
                            <span className="text-xs text-yellow-600">Limited</span>
                          )}
                        </span>
                      </Button>
                    );
                  })}
                </div>
                <ScrollBar orientation="vertical" />
              </ScrollArea>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}


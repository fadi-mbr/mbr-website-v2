import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center mb-4",
        caption_label: "text-base font-semibold text-white tracking-wide",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-8 w-8 bg-gray-800/50 hover:bg-gray-700 rounded-md p-0 text-white hover:text-primary transition-all duration-200",
          "flex items-center justify-center",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        nav_icon: "h-4 w-4",
        table: "w-full border-collapse space-y-1",
        head_row: "flex mb-2",
        head_cell:
          "text-gray-400 rounded-md w-10 font-medium text-xs uppercase tracking-wider text-center",
        row: "flex w-full mt-1 gap-1",
        cell: cn(
          "h-10 w-10 text-center text-sm p-0 relative rounded-md",
          "focus-within:relative focus-within:z-20"
        ),
        day: cn(
          "h-10 w-10 p-0 font-medium rounded-md transition-all duration-200",
          "text-white text-sm relative",
          "hover:bg-gray-700/80 hover:scale-105",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black",
          "aria-selected:opacity-100",
          "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-transparent",
          // Slot indicator dot for available dates
          "[&.day-has-slots]:after:content-[''] [&.day-has-slots]:after:absolute [&.day-has-slots]:after:bottom-1 [&.day-has-slots]:after:left-1/2 [&.day-has-slots]:after:-translate-x-1/2",
          "[&.day-has-slots]:after:w-1.5 [&.day-has-slots]:after:h-1.5 [&.day-has-slots]:after:rounded-full [&.day-has-slots]:after:bg-primary",
          "[&.day-has-slots]:not(.day-selected):not(.day-today):after:bg-primary/60"
        ),
        day_range_end: "day-range-end",
        day_selected: cn(
          "bg-primary text-white font-semibold",
          "hover:bg-primary/90 hover:text-white",
          "focus:bg-primary focus:text-white",
          "shadow-lg shadow-primary/50 scale-105"
        ),
        day_today: cn(
          "bg-primary/20 text-primary border-2 border-primary font-semibold",
          "hover:bg-primary/30 hover:text-primary",
          "focus:bg-primary/30 focus:text-primary"
        ),
        day_outside:
          "text-gray-500 opacity-40 cursor-not-allowed hover:bg-transparent hover:text-gray-500 hover:opacity-40",
        day_disabled: cn(
          "text-gray-600 opacity-25 cursor-not-allowed",
          "hover:bg-transparent hover:text-gray-600 hover:opacity-25",
          "line-through decoration-gray-500"
        ),
        day_range_middle:
          "aria-selected:bg-gray-800/50 aria-selected:text-white",
        day_hidden: "invisible",
        ...classNames,
      }}
      modifiersClassNames={{
        today: "day-today",
        selected: "day-selected",
        disabled: "day-disabled",
        outside: "day-outside",
        hasSlots: "day-has-slots",
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };


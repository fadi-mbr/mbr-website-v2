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
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-white",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-white hover:text-primary transition-colors"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-gray-800/30 [&:has([aria-selected])]:bg-gray-800/50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          "h-9 w-9 p-0 font-normal rounded-md transition-all",
          "hover:bg-gray-800 hover:text-white",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black",
          "aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-white hover:bg-primary/90 hover:text-white focus:bg-primary focus:text-white font-semibold",
        day_today: 
          "bg-primary/30 text-primary border-2 border-primary font-semibold hover:bg-primary/40",
        day_outside:
          "day-outside text-gray-600 opacity-40 cursor-not-allowed hover:bg-transparent hover:text-gray-600",
        day_disabled: 
          "text-gray-600 opacity-30 cursor-not-allowed hover:bg-transparent hover:text-gray-600 hover:opacity-30 line-through",
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
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };


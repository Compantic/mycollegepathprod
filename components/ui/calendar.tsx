"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("rdp-onboarding p-5", className)}
      classNames={{
        months: "flex flex-col gap-4 sm:flex-row sm:gap-6",
        month: "space-y-4",
        caption: "flex w-full min-h-[3rem] items-center justify-center px-1 py-2",
        caption_label: "text-lg font-semibold tracking-tight text-text-primary",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "h-10 w-10 shrink-0 rounded-xl border-2 border-bg-border bg-white p-0 hover:border-primary-500/40 hover:bg-primary-500/5"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "mb-2 flex w-full justify-between",
        head_cell: "w-12 text-center text-sm font-semibold text-text-muted",
        row: "mt-1 flex w-full justify-between",
        cell: "relative flex h-12 w-12 items-center justify-center p-0 text-center focus-within:z-10",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-12 w-12 rounded-xl p-0 text-base font-medium text-text-primary hover:bg-primary-500/10 hover:text-primary-600 aria-selected:opacity-100"
        ),
        day_selected:
          "bg-primary-500 text-white hover:bg-primary-600 hover:text-white focus:bg-primary-500 focus:text-white",
        day_today: "bg-secondary-100 font-semibold text-primary-600",
        day_outside: "text-text-muted opacity-40",
        day_disabled: "text-text-muted opacity-25 hover:bg-transparent hover:text-text-muted",
        day_range_middle: "",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-5 w-5" aria-hidden />,
        IconRight: () => <ChevronRight className="h-5 w-5" aria-hidden />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };

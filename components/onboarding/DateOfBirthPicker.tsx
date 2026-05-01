"use client";

import * as React from "react";
import { format, parseISO, isValid } from "date-fns";
import { enUS } from "date-fns/locale";
import { Calendar as CalendarGlyph } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function parseIsoDateToLocal(value: string): Date | undefined {
  if (!value || value.length < 10) return undefined;
  try {
    const d = parseISO(value.slice(0, 10));
    return isValid(d) ? d : undefined;
  } catch {
    return undefined;
  }
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Typical student age — calendar opens here instead of “today” when no date yet. */
function approximateBirthMonth(reference: Date): Date {
  const d = new Date(reference);
  d.setFullYear(d.getFullYear() - 17);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function DateOfBirthPicker({
  value,
  onChange,
  id,
  invalid,
  className,
}: {
  value: string;
  onChange: (isoYyyyMmDd: string) => void;
  id?: string;
  invalid?: boolean;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [calendarMonth, setCalendarMonth] = React.useState<Date>(() => approximateBirthMonth(new Date()));
  const selected = parseIsoDateToLocal(value);

  const locale = enUS;

  const { minDate, maxDate } = React.useMemo(() => {
    const max = new Date();
    max.setHours(0, 0, 0, 0);
    const min = new Date();
    min.setFullYear(min.getFullYear() - 120);
    min.setHours(0, 0, 0, 0);
    return { minDate: min, maxDate: max };
  }, []);

  React.useEffect(() => {
    if (!open) return;
    setCalendarMonth(parseIsoDateToLocal(value) ?? approximateBirthMonth(maxDate));
  }, [open, value, maxDate]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          aria-expanded={open}
          aria-haspopup="dialog"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-11 w-full max-w-xs justify-start gap-3 rounded-xl border-2 border-bg-border bg-white px-4 text-left text-base font-normal shadow-none transition-all duration-300",
            "hover:border-primary-500/50 hover:shadow-sm",
            "focus-visible:border-primary-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/15",
            !value && "text-text-muted",
            invalid && "border-status-dangerText ring-1 ring-status-dangerText/30",
            className
          )}
        >
          <CalendarGlyph className="h-5 w-5 shrink-0 text-primary-500" aria-hidden />
          <span className="truncate">
            {selected ? format(selected, "PPP", { locale }) : "Select date"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto border-2 border-primary-500/15 bg-white/95 p-0 shadow-glow backdrop-blur-sm"
        align="start"
        sideOffset={8}
      >
        <div className="border-b border-bg-border/80 bg-gradient-to-r from-primary-500/[0.06] to-secondary-100/80 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">Date of birth</p>
          <p className="mt-0.5 text-sm text-text-secondary">Choose your birth date</p>
        </div>
        <Calendar
          mode="single"
          captionLayout="dropdown"
          fromDate={minDate}
          toDate={maxDate}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
          selected={selected}
          onSelect={(d) => {
            if (d) {
              onChange(toIsoDate(d));
              setOpen(false);
            }
          }}
          disabled={(date) => {
            const t = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            return t < minDate || t > maxDate;
          }}
          locale={locale}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { getMonthGrid, isSameDay, startOfDay } from "@/lib/calendar";

const monthFormatter = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });
const weekdayLabels = ["lu", "ma", "me", "je", "ve", "sa", "di"];

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" fill="none" className="size-4">
      <path
        d={direction === "left" ? "M12 15L7 10L12 5" : "M8 5L13 10L8 15"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type CalendarProps = {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
};

export function Calendar({ selectedDate, onSelectDate }: CalendarProps) {
  const today = startOfDay(new Date());
  const [viewedMonth, setViewedMonth] = useState(() => {
    const base = selectedDate ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const isCurrentMonth =
    viewedMonth.getFullYear() === today.getFullYear() && viewedMonth.getMonth() === today.getMonth();
  const grid = getMonthGrid(viewedMonth.getFullYear(), viewedMonth.getMonth());

  return (
    <div className="w-full rounded-3xl border border-[var(--brand-color-1)] bg-white p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          disabled={isCurrentMonth}
          aria-label="Mois précédent"
          className="flex size-12 items-center justify-center rounded-full border border-[var(--brand-color-1)] text-[var(--on-core-brand-color)] transition hover:bg-[#f5f5f5] disabled:opacity-40"
        >
          <ChevronIcon direction="left" />
        </button>
        <p className="text-lg font-bold text-[var(--text-secondary)] capitalize">
          {monthFormatter.format(viewedMonth)}
        </p>
        <button
          type="button"
          onClick={() => setViewedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
          aria-label="Mois suivant"
          className="flex size-12 items-center justify-center rounded-full border border-[var(--brand-color-1)] text-[var(--on-core-brand-color)] transition hover:bg-[#f5f5f5]"
        >
          <ChevronIcon direction="right" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-x-2 gap-y-2">
        {weekdayLabels.map((label) => (
          <div key={label} className="flex h-8 items-center justify-center text-base text-[var(--text-secondary)] opacity-60">
            {label}
          </div>
        ))}
        {grid.map((day) => {
          const inMonth = day.getMonth() === viewedMonth.getMonth();
          const isPast = day < today;
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const disabled = !inMonth || isPast;

          return (
            <div key={day.toISOString()} className="flex items-center justify-center">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelectDate(day)}
                className={cn(
                  "flex size-12 items-center justify-center rounded-full text-lg font-bold transition sm:size-14",
                  isSelected
                    ? "bg-[var(--core-brand-color)] text-[var(--on-core-brand-color)] shadow-[0px_1px_1px_0px_rgba(0,0,0,0.05)]"
                    : disabled
                      ? "text-[var(--text-secondary)] opacity-30"
                      : "text-[var(--text-secondary)] hover:bg-[#f5f5f5]",
                )}
              >
                {day.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

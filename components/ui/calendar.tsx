"use client";

import { useEffect, useRef, useState } from "react";
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

  // Roving tabindex (WAI-ARIA APG grid pattern): exactly one day button is a
  // tab stop at a time, arrow keys move it — 1 tab stop to enter the grid
  // instead of tabbing through all ~42 cells individually.
  const [focusedDate, setFocusedDate] = useState(() => selectedDate ?? today);
  const dayRefs = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocusRef = useRef(false);

  useEffect(() => {
    // Re-anchors the roving tabindex when the visible month changes from
    // under it (e.g. the prev/next buttons) — without this, a grid with no
    // day matching the old focusedDate would leave zero tabbable cells.
    setFocusedDate((prev) => {
      if (prev.getFullYear() === viewedMonth.getFullYear() && prev.getMonth() === viewedMonth.getMonth()) {
        return prev;
      }
      const firstEnabled = grid.find(
        (d) =>
          d.getFullYear() === viewedMonth.getFullYear() && d.getMonth() === viewedMonth.getMonth() && d >= today,
      );
      return firstEnabled ?? prev;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    });
  }, [viewedMonth]);

  useEffect(() => {
    if (!pendingFocusRef.current) return;
    pendingFocusRef.current = false;
    dayRefs.current.get(focusedDate.toISOString())?.focus();
  }, [focusedDate]);

  const moveFocus = (deltaDays: number) => {
    let next = focusedDate;
    // Steps past disabled (past) days in the direction of travel, bounded so
    // one key press can't tunnel through an unbounded number of months.
    for (let i = 0; i < 14; i++) {
      next = new Date(next.getFullYear(), next.getMonth(), next.getDate() + deltaDays);
      if (next >= today) break;
    }
    if (next < today) return;
    if (next.getFullYear() !== viewedMonth.getFullYear() || next.getMonth() !== viewedMonth.getMonth()) {
      setViewedMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    }
    pendingFocusRef.current = true;
    setFocusedDate(next);
  };

  const handleGridKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        moveFocus(1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        moveFocus(-1);
        break;
      case "ArrowDown":
        event.preventDefault();
        moveFocus(7);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveFocus(-7);
        break;
      default:
        break;
    }
  };

  const weeks: Date[][] = [];
  for (let i = 0; i < grid.length; i += 7) weeks.push(grid.slice(i, i + 7));

  // Cell diameter scales with viewport height (svh), not a fixed px value or
  // breakpoint — a 6-week grid at the old fixed size (48-56px cells) could
  // run taller than a short phone viewport and force a page scroll just to
  // see the last week. Tying the size to svh instead guarantees the whole
  // grid always fits above the fold, on any device, without hand-tuning
  // breakpoints.
  const cellSize = "size-[clamp(1.75rem,6svh,3.5rem)]";

  return (
    <div className="w-full max-w-full rounded-3xl border border-[var(--brand-color-1)] bg-white p-[clamp(0.75rem,3svh,1.5rem)]">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          disabled={isCurrentMonth}
          aria-label="Mois précédent"
          className={cn(
            cellSize,
            "flex items-center justify-center rounded-full border border-[var(--brand-color-1)] text-[var(--on-core-brand-color)] transition hover:bg-[#f5f5f5] active:scale-90 disabled:opacity-40",
          )}
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
          className={cn(
            cellSize,
            "flex items-center justify-center rounded-full border border-[var(--brand-color-1)] text-[var(--on-core-brand-color)] transition hover:bg-[#f5f5f5] active:scale-90",
          )}
        >
          <ChevronIcon direction="right" />
        </button>
      </div>

      {/* role="grid"/"row"/"gridcell" for a proper accessibility-tree grid without
          changing the flat CSS grid layout: each row wrapper uses `contents` so it
          participates in `grid-cols-7` exactly as a direct child would, while still
          existing as a real DOM node for the row semantics. Combined with the roving
          tabindex above (`focusedDate`), Tab now stops on the grid once instead of on
          all ~42 day buttons individually — arrow keys move the single active cell. */}
      <div
        role="grid"
        aria-label={monthFormatter.format(viewedMonth)}
        onKeyDown={handleGridKeyDown}
        className="mt-[clamp(0.5rem,2svh,1rem)] grid grid-cols-7 gap-x-1 gap-y-1"
      >
        <div role="row" className="contents">
          {weekdayLabels.map((label) => (
            <div
              key={label}
              role="columnheader"
              className="flex h-[clamp(1.25rem,4svh,2rem)] items-center justify-center text-base text-[var(--text-secondary)] opacity-60"
            >
              {label}
            </div>
          ))}
        </div>
        {weeks.map((week, weekIndex) => (
          <div role="row" key={weekIndex} className="contents">
            {week.map((day) => {
              const inMonth = day.getMonth() === viewedMonth.getMonth();
              const isPast = day < today;
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const disabled = !inMonth || isPast;
              const isoKey = day.toISOString();

              return (
                <div key={isoKey} role="gridcell" className="flex items-center justify-center">
                  <button
                    ref={(el) => {
                      if (el) dayRefs.current.set(isoKey, el);
                      else dayRefs.current.delete(isoKey);
                    }}
                    type="button"
                    disabled={disabled}
                    tabIndex={isSameDay(day, focusedDate) ? 0 : -1}
                    onClick={() => onSelectDate(day)}
                    className={cn(
                      cellSize,
                      "flex items-center justify-center rounded-full text-lg font-bold transition active:scale-90",
                      isSelected
                        ? "bg-[var(--core-brand-color)] text-[var(--on-core-brand-color)] shadow-[0px_1px_1px_0px_rgba(0,0,0,0.05)]"
                        : disabled
                          ? "text-[var(--text-secondary)] opacity-30"
                          : "text-[var(--text-secondary)] hover:bg-[#f5f5f5] active:bg-[#f5f5f5]",
                    )}
                  >
                    {day.getDate()}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

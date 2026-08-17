"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, Gift } from "lucide-react";
import { buildRecapLines, type CarriedParams } from "@/lib/recap-summary";

type RecapBadgeProps = {
  carried: CarriedParams;
};

/**
 * Permanent, purely informative recap — docs/userflow.md "Conventions
 * transverses". Grows as decisions are made, never clickable, never shown on
 * Landing/Confirmation/the "Mes cartes cadeaux" subflow (those pages simply
 * don't render it). A small heading + one icon per line (reusing the same
 * icons as the picker screens where each decision was made) so a first-time
 * visitor can tell at a glance this is "what I've chosen so far", not just an
 * unlabelled stack of text.
 *
 * On mobile there's no room in the header row to show this inline next to
 * the centered logo without colliding, so it collapses behind a small eye
 * button instead — tapping it floats the same content over the screen;
 * tapping anywhere outside (or Escape) closes it, mirroring the click-outside
 * pattern SiteLogo already uses for its own popover.
 */
type PanelPhase = "closed" | "open" | "closing";

export function RecapBadge({ carried }: RecapBadgeProps) {
  const lines = buildRecapLines(carried);
  // A third "closing" phase (rather than a plain boolean) keeps the panel
  // mounted for its exit animation instead of snapping away instantly —
  // mirrors the animate-screen-exit/enter pattern in components/ui/screen-transition.tsx.
  const [phase, setPhase] = useState<PanelPhase>("closed");
  const isVisible = phase !== "closed";
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase !== "open") return;

    function handlePointerDown(event: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setPhase("closing");
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPhase("closing");
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [phase]);

  if (lines.length === 0) return null;

  const content = (
    <>
      <div className="flex items-center gap-1.5 text-[var(--text-secondary)] opacity-70">
        <Gift size={12} strokeWidth={2} aria-hidden />
        <span className="text-[11px] font-semibold tracking-wide uppercase">Votre carte</span>
      </div>

      <div className="flex min-w-0 max-h-[9.5rem] flex-col gap-1.5 overflow-y-auto">
        {lines.map(({ icon: Icon, text }, index) => (
          <div key={index} className="flex min-w-0 items-center gap-2">
            <Icon size={14} strokeWidth={2} className="shrink-0 text-[var(--button-2-color)]" aria-hidden />
            <span className="min-w-0 truncate text-sm leading-snug font-medium text-black/80">{text}</span>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: the classic always-visible inline badge. */}
      <div className="ml-auto hidden min-w-0 max-w-[min(52vw,18rem)] flex-col gap-2 rounded-2xl border border-[var(--brand-color-1)] bg-white/70 px-4 py-3 backdrop-blur-sm sm:flex">
        {content}
      </div>

      {/* Mobile: collapsed behind an eye toggle instead — see doc comment above. */}
      <button
        type="button"
        onClick={() => setPhase((current) => (current === "closed" ? "open" : "closing"))}
        aria-label={isVisible ? "Masquer le récapitulatif" : "Afficher le récapitulatif"}
        aria-expanded={isVisible}
        className="ml-auto flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--brand-color-1)] bg-white/70 text-[var(--button-2-color)] backdrop-blur-sm transition hover:opacity-80 active:scale-90 sm:hidden"
      >
        <Eye size={16} strokeWidth={2} aria-hidden />
      </button>
      {isVisible && (
        <div
          ref={panelRef}
          onAnimationEnd={() => {
            if (phase === "closing") setPhase("closed");
          }}
          className={`fixed top-20 right-4 left-4 z-50 ml-auto flex max-w-[min(90vw,20rem)] flex-col gap-2 rounded-2xl border border-[var(--brand-color-1)] bg-white/90 px-4 py-3 shadow-lg backdrop-blur-sm sm:hidden ${
            phase === "closing" ? "animate-recap-panel-exit" : "animate-recap-panel-enter"
          }`}
        >
          {content}
        </div>
      )}
    </>
  );
}

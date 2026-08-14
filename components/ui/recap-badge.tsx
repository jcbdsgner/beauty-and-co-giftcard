import { Gift } from "lucide-react";
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
 */
export function RecapBadge({ carried }: RecapBadgeProps) {
  const lines = buildRecapLines(carried);
  if (lines.length === 0) return null;

  return (
    <div className="ml-auto flex min-w-0 max-w-[min(52vw,18rem)] flex-col gap-2 rounded-2xl border border-[var(--brand-color-1)] bg-white/70 px-4 py-3 backdrop-blur-sm">
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
    </div>
  );
}

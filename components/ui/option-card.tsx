import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Size = "default" | "sm";

type OptionCardProps = {
  icon: LucideIcon;
  label: string;
  href?: string;
  onClick?: () => void;
  /** "sm" shrinks the card (and its label) on mobile only — for pairs whose label
   * doesn't fit "default"'s mobile width on one line, e.g. "Recevoir un lien". */
  size?: Size;
};

const base =
  "flex flex-col items-center justify-center rounded-3xl border border-[var(--brand-color-1)] bg-white text-center transition hover:bg-[#f5f5f5] active:scale-[0.97] active:bg-[#f5f5f5]";

const sizeClasses: Record<Size, string> = {
  default: "size-44 gap-4 px-4 sm:size-52",
  sm: "size-36 gap-3 px-3 sm:size-52 sm:gap-4 sm:px-4",
};

const labelSizeClasses: Record<Size, string> = {
  default: "text-[22px]",
  sm: "text-base sm:text-[22px]",
};

const iconSizeClasses: Record<Size, string> = {
  default: "size-12",
  sm: "size-8 sm:size-12",
};

/**
 * Large square, static (no tilt/hover-transform) — the picker pattern used
 * across the purchase flow's decision screens (Mode de réception, Pour qui ?, ...).
 * Icon on top, label at the bottom. Renders as a link when `href` is given,
 * otherwise a plain button (for options whose destination screen isn't built yet).
 */
export function OptionCard({ icon: Icon, label, size = "default", ...props }: OptionCardProps) {
  const classes = cn(base, sizeClasses[size]);
  const content = (
    <>
      <Icon
        strokeWidth={1.5}
        className={cn(iconSizeClasses[size], "text-[var(--button-2-color)]")}
        aria-hidden
      />
      <span className={cn(labelSizeClasses[size], "text-[var(--on-core-brand-color)] font-medium")}>
        {label}
      </span>
    </>
  );

  if (props.href) {
    return (
      <Link href={props.href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={props.onClick} className={classes}>
      {content}
    </button>
  );
}

import Link from "next/link";
import { SiteLogo } from "@/components/layout/site-logo";

type BackLinkWithLogoProps = {
  backHref: string;
};

/**
 * Back link + centered logo, aligned on the same row — used on the "Mes cartes
 * cadeaux" sub-flow screens (no recap badge there). Absolutely positioned so it
 * doesn't push down the section's vertically-centered content (those screens use
 * `justify-center`, not FlowScreen's reserved-height/mirrored-spacer trick).
 * Same 1fr/auto/1fr grid as FlowScreen's header row so the back link wraps
 * instead of overlapping the logo on narrow viewports.
 */
export function BackLinkWithLogo({ backHref }: BackLinkWithLogoProps) {
  return (
    <div className="absolute inset-x-6 top-8 grid grid-cols-[1fr_auto_1fr] items-start gap-4">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-[var(--text-secondary)] transition hover:opacity-70"
      >
        <span aria-hidden>←</span>
        Revenir en arrière
      </Link>
      <SiteLogo />
      <div aria-hidden />
    </div>
  );
}

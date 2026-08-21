import Link from "next/link";
import { SiteLogo } from "@/components/layout/site-logo";
import { RecapBadge } from "@/components/ui/recap-badge";
import type { CarriedParams } from "@/lib/recap-summary";

type FlowScreenProps = {
  backHref: string;
  /** Omit on screens outside the purchase flow (Landing, Confirmation, "Mes cartes cadeaux") — see docs/userflow.md Conventions transverses. */
  carried?: CarriedParams;
  /** Drops the title-centering padding/spacer in favor of a viewport-locked layout where content stretches to fill — for screens built around one large element (e.g. the 3D card preview) that must never need a scroll to reach its CTA. */
  fillViewport?: boolean;
  /** When false, the header row (back link, logo, badge) stays translated up off-screen and hidden, instead of appearing immediately — for a screen that wants to hold its chrome back until some intro animation of its own finishes, then reveal it in sync. Defaults to true so every other screen is unaffected. */
  revealed?: boolean;
  children: React.ReactNode;
};

/**
 * Shared shell for every step of the purchase flow: the back link, the
 * centered logo and the recap badge sit in a real header row (not
 * absolutely positioned), so a multi-line badge pushes the centered content
 * down instead of overlapping it on short viewports. The row is a 3-column
 * grid — 1fr / auto / 1fr — so the logo column always sits at the true
 * center regardless of how wide the back link or badge get, and the two
 * side columns (equal fr) shrink the back link's text to wrap instead of
 * overlapping the logo on narrow viewports. `items-start` keeps all three
 * aligned to the same top edge.
 *
 * The row has a min-height sized for the badge's worst case on desktop (see
 * recap-badge.tsx's own height cap) so that height stays constant across
 * screens there — otherwise the badge growing as decisions pile up (e.g. by
 * "Signature") would make each screen's title sit progressively lower than
 * earlier ones. On mobile that same fixed reserve was oversized for the
 * common case (an early screen with a one-line badge) and pushed real
 * content — option cards, the "Livraison" choice among them — below the
 * fold; the reserve there is a much smaller floor and simply lets the row
 * grow with real content on the (rare) screens where the badge is long,
 * trading a little title-position drift for not hiding the thing the user
 * came to choose.
 *
 * A matching invisible spacer mirrors that reserved height at the bottom.
 * Without it, the header reserve eats space only from the top, so the
 * centered content settles in the middle of the *leftover* region below —
 * which sits below true page-center, not at it. Mirroring the reserve
 * cancels that bias and puts content back at the actual viewport center.
 *
 * `fillViewport` skips all of that: there's no title to keep centered, so
 * the badge reserve would just be dead space stolen from the one large
 * element the screen is built around. There the recap badge is pulled out
 * of the header row and absolutely positioned instead — the row shrinks to
 * its own intrinsic content height (back link + logo, no badge-shaped
 * floor), and the badge floats on top of whatever's below it. That floating
 * badge is hidden below `sm`: the logo is independently centered in the
 * same row, and on narrow viewports the two collide (the badge can grow up
 * to ~200px tall and there's no room beside a centered ~86px logo). Both
 * `fillViewport` screens (Aperçu de la carte, Récapitulatif) also show this
 * same information in full in their own content, so nothing is lost by not
 * floating a second copy over the header on small screens.
 */
export function FlowScreen({ backHref, carried, fillViewport = false, revealed = true, children }: FlowScreenProps) {
  // "translate", not "transform" — Tailwind v4's translate-y-* utilities set
  // the native CSS `translate` property, not `transform`; transitioning the
  // wrong property left opacity animating smoothly while the Y position
  // snapped to its final value instantly.
  const revealClass = `transition-[translate,opacity] duration-700 ease-in-out delay-150 ${
    revealed ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0 pointer-events-none"
  }`;

  return (
    <section
      className={`relative flex flex-col px-6 py-8 ${fillViewport ? "h-svh overflow-hidden" : "min-h-svh"}`}
    >
      <div
        className={`grid grid-cols-[1fr_auto_1fr] items-start gap-4 ${revealClass} ${fillViewport ? "" : "min-h-24 sm:min-h-52"}`}
      >
        <Link
          href={backHref}
          aria-label="Revenir en arrière"
          className="inline-flex items-center gap-2 -m-2 p-2 text-[var(--text-secondary)] transition hover:opacity-70"
        >
          <span aria-hidden className="text-2xl sm:text-base">←</span>
          <span aria-hidden className="hidden sm:inline">Revenir en arrière</span>
        </Link>
        <SiteLogo />
        {!fillViewport && carried && <RecapBadge carried={carried} />}
      </div>

      {fillViewport && carried && (
        <div className={`absolute top-8 right-6 z-20 hidden sm:block ${revealClass}`}>
          <RecapBadge carried={carried} />
        </div>
      )}

      {fillViewport ? (
        <div className="flex min-h-0 flex-1 flex-col items-center gap-4 py-4">{children}</div>
      ) : (
        <>
          <div className="flex flex-1 flex-col items-center justify-center gap-10 py-10">
            {children}
          </div>
          <div className="min-h-24 sm:min-h-52" aria-hidden />
        </>
      )}
    </section>
  );
}

import Link from "next/link";
import { SiteLogo } from "@/components/layout/site-logo";
import { RecapBadge } from "@/components/ui/recap-badge";
import type { CarriedParams } from "@/lib/recap-summary";

type FlowScreenProps = {
  backHref: string;
  /** Omit on screens outside the purchase flow (Landing, Confirmation, "Mes cartes cadeaux") — see docs/userflow.md Conventions transverses. */
  carried?: CarriedParams;
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
 */
export function FlowScreen({ backHref, carried, children }: FlowScreenProps) {
  return (
    <section className="relative flex min-h-svh flex-col px-6 py-8">
      <div className="grid min-h-24 grid-cols-[1fr_auto_1fr] items-start gap-4 sm:min-h-52">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-[var(--text-secondary)] transition hover:opacity-70"
        >
          <span aria-hidden>←</span>
          Revenir en arrière
        </Link>
        <SiteLogo />
        {carried && <RecapBadge carried={carried} />}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-10 py-10">
        {children}
      </div>

      <div className="min-h-24 sm:min-h-52" aria-hidden />
    </section>
  );
}

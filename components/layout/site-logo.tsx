"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

/** Routes that render FlowScreen (docs/userflow.md "Conventions transverses") — the purchase
 * flow, where leaving loses unsaved progress (decision #1: no resume). Kept as prefixes so
 * nested steps (e.g. /montant/personnalise, /signature/alias) match too. */
const PURCHASE_FLOW_PREFIXES = [
  "/mode-de-livraison",
  "/montant",
  "/pour-qui",
  "/coordonnees-destinataire",
  "/message",
  "/vos-coordonnees",
  "/signature",
  "/quand-envoyer",
  "/recapitulatif",
  "/paiement",
  "/adresse-livraison",
];

/** Logo, back to the Landing page. Placed inline in each screen's header row (not fixed) so it
 * shares the same top edge as the back link and recap badge next to it. Mid-purchase, leaving
 * loses unsaved progress, so it asks for confirmation first instead of navigating right away —
 * styled after the permanent recap badge (frosted white panel) rather than a heavy dimmed modal. */
export function SiteLogo() {
  const pathname = usePathname();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Reset the popup when navigation changes the route — done during render (React's
  // documented pattern for "adjusting state when a prop changes"), not in an effect,
  // since layout.tsx doesn't remount on client-side navigation.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setConfirmOpen(false);
  }

  const inPurchaseFlow = PURCHASE_FLOW_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  useEffect(() => {
    if (!confirmOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setConfirmOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setConfirmOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [confirmOpen]);

  return (
    <div className="relative z-50 flex justify-center">
      {inPurchaseFlow ? (
        <button
          type="button"
          onClick={() => setConfirmOpen((open) => !open)}
          aria-haspopup="dialog"
          aria-expanded={confirmOpen}
          className="transition hover:opacity-80"
        >
          <Image
            src="/images/logo.svg"
            alt="Beauty and Co — accueil"
            width={110}
            height={51}
            priority
            className="h-10 w-auto min-w-[86px] sm:h-14 sm:min-w-[121px]"
          />
        </button>
      ) : (
        <Link href="/" className="transition hover:opacity-80">
          <Image
            src="/images/logo.svg"
            alt="Beauty and Co — accueil"
            width={110}
            height={51}
            priority
            className="h-10 w-auto min-w-[86px] sm:h-14 sm:min-w-[121px]"
          />
        </Link>
      )}

      {confirmOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          className="absolute top-full left-1/2 mt-3 flex w-[min(90vw,22rem)] -translate-x-1/2 flex-col gap-4 rounded-2xl border border-[var(--brand-color-1)] bg-white/70 px-5 py-4 text-center shadow-lg backdrop-blur-sm"
        >
          <p className="text-base leading-snug font-medium text-black/80">
            Quitter le parcours d&apos;achat ? Les informations saisies ne seront pas conservées.
          </p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="rounded-full border border-[var(--brand-color-1)] px-4 py-2 text-sm font-semibold text-[var(--button-2-color)] transition hover:bg-white"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-full bg-[var(--core-brand-color)] px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
            >
              Revenir à l&apos;accueil
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

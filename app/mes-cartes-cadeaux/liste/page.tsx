"use client";

import { use, useEffect, useState } from "react";
import { Gift, Store, TabletSmartphone, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { BackLinkWithLogo } from "@/components/layout/back-link-with-logo";
import { Button } from "@/components/ui/button";
import { getCardsForEmail } from "@/lib/cards/persistence";
import type { GiftCard } from "@/lib/cards/types";
import { getRelationshipLabel } from "@/lib/cards/relationship";
import { AVAILABILITY_LABELS, AVAILABILITY_TEXT_CLASSES, getCardAvailability } from "@/lib/cards/availability";
import { MODE_LABELS, formatFcfa } from "@/lib/format";
import { buildQuery } from "@/lib/flow-params";

// Mirrors the icons used in the mode-de-livraison picker: a card's mode icon
// should be recognizable at a glance in the list, not a repeated Gift icon
// that carries no information. Gift stays as the fallback for any legacy
// mode string that isn't one of the three current delivery modes.
const MODE_ICONS: Record<string, LucideIcon> = {
  numerique: TabletSmartphone,
  retrait: Store,
  postal: Truck,
};

type PageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default function MesCartesCadeauxListePage({ searchParams }: PageProps) {
  const { email } = use(searchParams);
  // Read from localStorage only after mount — reading it directly during
  // render would return [] on the server (no window there) but real data on
  // the client, causing a hydration mismatch like the one fixed on /confirmation.
  const [cards, setCards] = useState<GiftCard[] | null>(null);

  useEffect(() => {
    const load = () => setCards(email ? getCardsForEmail(email) : []);
    load();
  }, [email]);

  return (
    <section className="relative flex min-h-svh flex-col items-center justify-center gap-10 px-6 py-16">
      <BackLinkWithLogo backHref="/" />

      <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
        Mes cartes cadeaux
      </h1>

      {cards === null ? null : cards.length === 0 ? (
        <p className="text-[var(--text-secondary)]">
          Aucune carte cadeau trouvée pour {email ?? "cet email"}.
        </p>
      ) : (
        <div className="flex w-[min(92vw,34rem)] flex-col overflow-hidden rounded-3xl border border-[var(--brand-color-1)] bg-white">
          {cards.map((card, index) => {
            const availability = getCardAvailability(card);
            const ModeIcon = MODE_ICONS[card.mode] ?? Gift;
            return (
              <Link
                key={card.id}
                href={`/mes-cartes-cadeaux/liste/${card.id}${buildQuery({ email })}`}
                className={`flex items-center gap-4 px-6 py-4 transition hover:bg-[#f5f5f5] ${
                  index > 0 ? "border-t border-[var(--brand-color-1)]" : ""
                } ${availability === "epuisee" ? "opacity-60" : ""}`}
              >
                <ModeIcon size={28} strokeWidth={1.5} className="text-[var(--button-2-color)] shrink-0" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <span className="text-[var(--button-2-color)] text-xs font-semibold tracking-[0.08em] uppercase">
                    {MODE_LABELS[card.mode] ?? card.mode}
                  </span>
                  <span className="text-[var(--on-core-brand-color)] text-lg font-bold leading-tight sm:text-xl sm:font-semibold">
                    {formatFcfa(card.balance)}
                    {card.balance !== card.amount ? ` / ${formatFcfa(card.amount)}` : ""}
                  </span>
                  <span className="text-[var(--text-secondary)] text-sm">
                    {email ? getRelationshipLabel(card, email) : ""}
                  </span>
                </div>
                <span
                  className={`shrink-0 rounded-full bg-[#f5f5f5] px-3 py-1 text-sm ${AVAILABILITY_TEXT_CLASSES[availability]}`}
                >
                  {AVAILABILITY_LABELS[availability]}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      <Button href="/mode-de-livraison" size="lg" className="w-[min(92vw,34rem)]">
        Acheter une nouvelle carte
      </Button>
    </section>
  );
}

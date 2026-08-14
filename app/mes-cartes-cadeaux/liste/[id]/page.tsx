"use client";

import { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { BackLinkWithLogo } from "@/components/layout/back-link-with-logo";
import { ReferenceBox } from "@/components/ui/reference-box";
import { getCardById } from "@/lib/cards/persistence";
import type { GiftCard } from "@/lib/cards/types";
import { getRelationshipLabel } from "@/lib/cards/relationship";
import { AVAILABILITY_LABELS, getCardAvailability } from "@/lib/cards/availability";
import { MODE_LABELS, formatFcfa } from "@/lib/format";
import { buildQuery } from "@/lib/flow-params";

const WatercolorBackground = dynamic(
  () => import("@/components/canvas/watercolor-background").then((m) => m.WatercolorBackground),
  { ssr: false },
);

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ email?: string }>;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[var(--text-secondary)] text-base">{label}</dt>
      <dd className="text-[var(--on-core-brand-color)] font-medium">{value}</dd>
    </div>
  );
}

export default function CarteDetailPage({ params, searchParams }: PageProps) {
  const { id } = use(params);
  const { email } = use(searchParams);
  // Same client-only read pattern as the list page — localStorage doesn't
  // exist during the server render, so we resolve the card after mount.
  const [card, setCard] = useState<GiftCard | null | undefined>(undefined);

  useEffect(() => {
    const load = () => setCard(getCardById(id) ?? null);
    load();
  }, [id]);

  const backHref = `/mes-cartes-cadeaux/liste${buildQuery({ email })}`;

  if (card === undefined) return null;

  if (card === null) {
    return (
      <section className="relative flex min-h-svh flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <WatercolorBackground />
        <BackLinkWithLogo backHref={backHref} />
        <p className="mt-24 text-[var(--text-secondary)]">Carte introuvable.</p>
      </section>
    );
  }

  const relationshipLabel = email ? getRelationshipLabel(card, email) : null;
  const progressPct = card.amount > 0 ? Math.round((card.balance / card.amount) * 100) : 0;
  const availability = getCardAvailability(card);

  return (
    <section className="relative flex min-h-svh flex-col items-center gap-8 px-6 pt-28 pb-16">
      <WatercolorBackground />

      <BackLinkWithLogo backHref={backHref} />

      <div className="flex w-full max-w-4xl flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center lg:gap-8">
        <div className="flex w-[min(92vw,26rem)] flex-col gap-6 lg:w-[26rem] lg:shrink-0">
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-[var(--brand-color-1)] bg-white px-8 py-8 text-center lg:items-start lg:text-left">
            <p className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
              {relationshipLabel ?? "Votre carte cadeau"}
            </p>
            <span
              className={`shrink-0 rounded-full bg-[#f5f5f5] px-3 py-1 text-sm ${
                availability === "epuisee" ? "text-[var(--text-secondary)]" : "text-[var(--on-core-brand-color)]"
              }`}
            >
              {AVAILABILITY_LABELS[availability]}
            </span>
          </div>

          <ReferenceBox reference={card.reference} />
        </div>

        <div className="flex w-[min(92vw,30rem)] flex-col gap-6 rounded-3xl border border-[var(--brand-color-1)] bg-white px-8 py-8 lg:w-auto lg:flex-1">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="font-heading text-4xl text-[var(--on-core-brand-color)]">
              {formatFcfa(card.balance)}
            </span>
            {card.balance !== card.amount && (
              <span className="text-[var(--text-secondary)] text-base">
                sur {formatFcfa(card.amount)} au départ
              </span>
            )}
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#f5f5f5]">
              <div
                className="h-full rounded-full bg-[var(--core-brand-color)]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <dl className="flex flex-col gap-4 border-t border-[var(--brand-color-1)] pt-6">
            <Row label="Mode de réception" value={MODE_LABELS[card.mode] ?? card.mode} />
            {card.destQuartier && <Row label="Quartier" value={card.destQuartier} />}
            {card.destAddress && <Row label="Adresse" value={card.destAddress} />}
            {card.destPhone && <Row label="Téléphone" value={card.destPhone} />}
            {card.destEmail && <Row label="Email" value={card.destEmail} />}
            {card.signature && <Row label="Signé" value={card.signature} />}
            {card.message?.trim() && <Row label="Message" value={`« ${card.message} »`} />}
            <Row label="Date d'achat" value={new Date(card.createdAt).toLocaleDateString("fr-FR")} />
          </dl>
        </div>
      </div>
    </section>
  );
}

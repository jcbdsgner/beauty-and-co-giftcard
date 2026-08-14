"use client";

import { use } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { FlowScreen } from "@/components/ui/flow-screen";
import { OrderExpired } from "@/components/ui/order-expired";
import { buildQuery } from "@/lib/flow-params";
import { MODE_LABELS, formatFcfa } from "@/lib/format";
import { getDeliveryFee, getTotalDue } from "@/lib/delivery";
import { isOrderComplete } from "@/lib/order";

const WatercolorBackground = dynamic(
  () => import("@/components/canvas/watercolor-background").then((m) => m.WatercolorBackground),
  { ssr: false },
);

type Carried = Record<string, string | undefined>;

type PageProps = {
  searchParams: Promise<Carried>;
};

type Row = { label: string; value: string; editHref?: string };

export default function RecapitulatifPage({ searchParams }: PageProps) {
  const carried = use(searchParams);
  const isForSomeoneElse = carried.pour !== "moi";
  const isNumerique = carried.mode === "numerique";
  const isPostal = carried.mode === "postal";
  const deliveryFee = getDeliveryFee(carried.mode);
  const totalDue = getTotalDue(carried.amount, carried.mode);

  // Every edit link carries the full order (not just the field being edited) plus
  // `from=recap`, so the destination screen can jump straight back here instead of
  // re-walking the rest of the flow forward — and, critically, so it never drops
  // the rest of the order the way a hrefs built from a narrow field subset would.
  const editQuery = (extra: Record<string, string | undefined> = {}) =>
    buildQuery({ ...carried, ...extra, from: "recap" });

  const rows: Row[] = [
    {
      label: "Mode de livraison",
      value: MODE_LABELS[carried.mode ?? ""] ?? "—",
      editHref: `/mode-de-livraison${editQuery()}`,
    },
    {
      label: "Montant",
      value: formatFcfa(carried.amount),
      editHref: `/montant${editQuery()}`,
    },
  ];

  if (isPostal) {
    rows.push({
      label: "Frais de livraison",
      value: formatFcfa(deliveryFee),
    });
  }

  if (isForSomeoneElse) {
    rows.push({
      label: "Destinataire",
      value:
        [
          carried.dest_nom,
          carried.dest_email,
          carried.dest_telephone,
          carried.dest_quartier,
          carried.dest_adresse,
        ]
          .filter(Boolean)
          .join(" · ") || "—",
      editHref: `/coordonnees-destinataire${editQuery()}`,
    });
    rows.push({
      label: "Message",
      value: carried.message?.trim() ? carried.message : "Aucun message",
      editHref: `/message${editQuery()}`,
    });
    rows.push({
      label: "Signature",
      value: carried.signature?.trim() ? carried.signature : "Non indiquée",
      editHref: `/signature${editQuery()}`,
    });
  }

  rows.push({
    label: "Vos coordonnées",
    value: [carried.buyer_nom, carried.buyer_email].filter(Boolean).join(" · ") || "—",
    editHref: `/vos-coordonnees${editQuery()}`,
  });

  if (isNumerique) {
    rows.push({
      label: "Envoi",
      value:
        carried.envoi === "programme" && carried.envoi_date
          ? `Programmé — ${new Date(carried.envoi_date).toLocaleDateString("fr-FR")}`
          : "Envoyer maintenant",
      editHref: `/quand-envoyer${buildQuery(carried)}`,
    });
  }

  const backHref = isNumerique
    ? `/quand-envoyer${buildQuery(carried)}`
    : isForSomeoneElse
      ? `/signature${buildQuery(carried)}`
      : `/vos-coordonnees${buildQuery(carried)}`;

  if (!isOrderComplete(carried)) {
    return (
      <>
        <WatercolorBackground />
        <FlowScreen backHref="/mode-de-livraison">
          <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
            Récapitulatif
          </h1>
          <OrderExpired />
        </FlowScreen>
      </>
    );
  }

  return (
    <>
      <WatercolorBackground />
      <FlowScreen backHref={backHref} carried={carried}>
        <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
          Récapitulatif
        </h1>

        <div className="flex w-[min(92vw,34rem)] flex-col overflow-hidden rounded-3xl border border-[var(--brand-color-1)] bg-white">
          {rows.map((row, index) => (
            <div
              key={row.label}
              className={`flex items-center justify-between gap-4 px-6 py-4 ${
                index > 0 ? "border-t border-[var(--brand-color-1)]" : ""
              }`}
            >
              <div className="flex flex-col gap-1">
                <span className="text-[var(--text-secondary)] text-base">{row.label}</span>
                <span className="text-[var(--on-core-brand-color)] font-medium">{row.value}</span>
              </div>
              {row.editHref && (
                <Link
                  href={row.editHref}
                  className="shrink-0 rounded-full border border-[var(--brand-color-1)] px-4 py-2.5 text-base font-medium text-[var(--button-2-color)] transition hover:bg-[#f5f5f5]"
                >
                  Modifier
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="flex w-[min(92vw,34rem)] items-center justify-between px-2">
          <span className="text-[var(--text-secondary)] font-medium">Total à payer</span>
          <span className="font-heading text-2xl text-[var(--on-core-brand-color)]">
            {formatFcfa(totalDue)}
          </span>
        </div>

        <Button href={`/paiement${buildQuery(carried)}`} size="lg" className="w-[min(92vw,34rem)]">
          Payer
        </Button>
      </FlowScreen>
    </>
  );
}

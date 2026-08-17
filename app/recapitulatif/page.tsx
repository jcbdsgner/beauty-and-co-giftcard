"use client";

import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FlowScreen } from "@/components/ui/flow-screen";
import { OrderExpired } from "@/components/ui/order-expired";
import { buildQuery } from "@/lib/flow-params";
import { MODE_LABELS, SALON_LABELS, formatFcfa } from "@/lib/format";
import { getDeliveryFee, getTotalDue } from "@/lib/delivery";
import { isOrderComplete } from "@/lib/order";

type Carried = Record<string, string | undefined>;

type PageProps = {
  searchParams: Promise<Carried>;
};

type Row = { label: string; value: string; editHref?: string; emphasis?: boolean };

export default function RecapitulatifPage({ searchParams }: PageProps) {
  const carried = use(searchParams);
  const isForSomeoneElse = carried.pour !== "moi";
  const isPostal = carried.mode === "postal";
  const isRetrait = carried.mode === "retrait";
  const deliveryFee = getDeliveryFee(carried.mode);
  const totalDue = getTotalDue(carried.amount, carried.mode);

  // Every edit link carries the full order (not just the field being edited) plus
  // `from=recap`, so the destination screen can jump straight back here instead of
  // re-walking the rest of the flow forward — and, critically, so it never drops
  // the rest of the order the way a hrefs built from a narrow field subset would.
  const editQuery = (extra: Record<string, string | undefined> = {}) =>
    buildQuery({ ...carried, ...extra, from: "recap" });

  const buyerFullName = [carried.buyer_prenom, carried.buyer_nom].filter(Boolean).join(" ");

  const rows: Row[] = [
    {
      label: "Vos coordonnées",
      value: [buyerFullName, carried.buyer_telephone, carried.buyer_email].filter(Boolean).join(" · ") || "—",
    },
    {
      label: "Mode de réception",
      value: MODE_LABELS[carried.mode ?? ""] ?? "—",
      editHref: `/mode-de-livraison${editQuery()}`,
    },
  ];

  if (isRetrait) {
    rows.push({
      label: "Salon de retrait",
      value: SALON_LABELS[carried.salon ?? ""] ?? "—",
      editHref: `/choix-salon${editQuery()}`,
    });
  }

  if (isForSomeoneElse) {
    rows.push({
      label: "Destinataire",
      value:
        [
          [carried.dest_prenom, carried.dest_nom].filter(Boolean).join(" "),
          carried.dest_email,
          carried.dest_telephone,
          carried.dest_quartier,
          carried.dest_adresse,
        ]
          .filter(Boolean)
          .join(" · ") || "—",
    });
    rows.push({
      label: "Message",
      value: carried.message?.trim() ? carried.message : "Aucun message",
    });
    rows.push({
      label: "Signature",
      value: carried.signature?.trim() ? carried.signature : "Non indiquée",
    });
  } else if (isPostal) {
    // Buying for yourself with postal delivery has no "Destinataire" row
    // (there's no recipient) but still needs its own delivery address shown
    // — it was collected on /adresse-livraison just like the other branch.
    rows.push({
      label: "Adresse de livraison",
      value: [carried.dest_quartier, carried.dest_adresse].filter(Boolean).join(" · ") || "—",
    });
  }

  if (!isRetrait) {
    rows.push({
      label: isPostal ? "Expédition" : "Envoi",
      value:
        carried.envoi === "programme" && carried.envoi_date
          ? `Programmé — ${new Date(carried.envoi_date).toLocaleDateString("fr-FR")}`
          : isPostal
            ? "Expédier maintenant"
            : "Envoyer maintenant",
    });
  }

  // Everything financial sits together at the end of the block, in reading
  // order (Montant → Frais de livraison → Total à payer) — grouped instead
  // of interleaved with the rest so the eye can total them in one pass right
  // before "Payer".
  rows.push({
    label: "Montant",
    value: formatFcfa(carried.amount),
  });

  if (isPostal) {
    rows.push({
      label: "Frais de livraison",
      value: formatFcfa(deliveryFee),
    });
  }

  rows.push({
    label: "Total à payer",
    value: formatFcfa(totalDue),
    emphasis: true,
  });

  const backHref = `/apercu-carte${buildQuery(carried)}`;

  if (!isOrderComplete(carried)) {
    return (
      <FlowScreen backHref="/mode-de-livraison">
        <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
          Récapitulatif
        </h1>
        <OrderExpired />
      </FlowScreen>
    );
  }

  return (
    <FlowScreen backHref={backHref} carried={carried} fillViewport>
      <h1 className="shrink-0 font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
        Récapitulatif
      </h1>

      {/* Hugs the title instead of centering in the leftover space — a short recap
          (few optional rows) used to float in the vertical middle of the gap between
          title and button, reading as a large empty space above it. flex-1 + min-h-0
          stay: the card itself still needs a bounded max-height from this wrapper for
          its own internal-scroll safety net on a long recap (many optional rows),
          scrolling instead of pushing the button off-screen. */}
      <div className="flex w-[min(92vw,34rem)] min-h-0 flex-1 flex-col">
        {/* Rounding/border and scrolling are split across two elements, not combined
            on one — Chromium/WebKit can fail to clip an overflow-y:auto container's
            content to its own border-radius, leaving a flat-edged patch of whatever
            sits behind it poking out above the rounded corner. The inner element caps
            its height via flex-shrink (flex parent + min-h-0), not a percentage
            max-height — max-height:100% doesn't reliably resolve against a parent
            whose own height is itself only capped (not explicitly set), which
            silently broke the scroll-instead-of-clip behavior for a long recap. */}
        <div className="flex max-h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-[var(--brand-color-1)] bg-white">
          <div className="min-h-0 overflow-y-auto">
            {rows.map((row, index) => (
              <div
                key={row.label}
                className={`flex items-center justify-between gap-4 px-6 py-3 ${
                  index > 0 ? "border-t border-[var(--brand-color-1)]" : ""
                }`}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[var(--text-secondary)] text-base">{row.label}</span>
                  <span
                    className={
                      row.emphasis
                        ? "font-sans text-xl font-semibold text-[var(--on-core-brand-color)]"
                        : "text-[var(--on-core-brand-color)] font-medium"
                    }
                  >
                    {row.value}
                  </span>
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
        </div>
      </div>

      <Button href={`/paiement${buildQuery(carried)}`} size="lg" className="w-[min(92vw,34rem)] shrink-0">
        Payer
      </Button>
    </FlowScreen>
  );
}

"use client";

import { use } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { FlowScreen } from "@/components/ui/flow-screen";
import { OrderExpired } from "@/components/ui/order-expired";
import { buildQuery } from "@/lib/flow-params";
import { isOrderComplete } from "@/lib/order";

const GiftCard3DPreview = dynamic(
  () => import("@/components/canvas/gift-card-scene").then((m) => m.GiftCard3DPreview),
  { ssr: false },
);

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default function ApercuCartePage({ searchParams }: PageProps) {
  const carried = use(searchParams);
  const isForSomeoneElse = carried.pour !== "moi";

  const backHref =
    carried.mode !== "retrait"
      ? `/quand-envoyer${buildQuery(carried)}`
      : isForSomeoneElse
        ? `/signature${buildQuery(carried)}`
        : `/vos-coordonnees${buildQuery(carried)}`;

  if (!isOrderComplete(carried)) {
    return (
      <FlowScreen backHref="/mode-de-livraison">
        <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
          Aperçu de la carte
        </h1>
        <OrderExpired />
      </FlowScreen>
    );
  }

  return (
    <FlowScreen backHref={backHref} carried={carried} fillViewport>
      <div className="min-h-0 w-full flex-1">
        <GiftCard3DPreview
          message={isForSomeoneElse ? carried.message : undefined}
          signature={isForSomeoneElse ? carried.signature : undefined}
        />
      </div>

      <p className="shrink-0 -mt-2 text-center font-sans text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">
        Glissez pour faire pivoter la carte
      </p>

      <Button href={`/recapitulatif${buildQuery(carried)}`} size="lg" className="w-[min(92vw,34rem)] shrink-0">
        Voir le récapitulatif
      </Button>
    </FlowScreen>
  );
}

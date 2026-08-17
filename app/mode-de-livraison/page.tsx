"use client";

import { use } from "react";
import { Store, TabletSmartphone, Truck } from "lucide-react";
import { OptionCard } from "@/components/ui/option-card";
import { FlowScreen } from "@/components/ui/flow-screen";
import { buildQuery } from "@/lib/flow-params";

const OPTIONS = [
  { icon: TabletSmartphone, label: "Numérique", mode: "numerique" },
  { icon: Store, label: "Retrait en salon", mode: "retrait" },
  { icon: Truck, label: "Livraison", mode: "postal" },
] as const;

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default function ModeDeLivraisonPage({ searchParams }: PageProps) {
  const carried = use(searchParams);

  return (
    <FlowScreen backHref="/" carried={carried}>
      <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
        Mode de réception
      </h1>

      <div className="flex flex-wrap items-center justify-center gap-6">
        {OPTIONS.map(({ icon, label, mode }) => {
          const next = { ...carried, mode };
          // Retrait en salon needs one extra decision — which salon — before
          // Montant; the other two modes go straight there. The `from=recap`
          // shortcut still routes through it first so an edit can pick a
          // different salon before landing back on Récapitulatif.
          const href =
            mode === "retrait"
              ? `/choix-salon${buildQuery(next)}`
              : carried.from === "recap"
                ? `/recapitulatif${buildQuery({ ...next, from: undefined })}`
                : `/montant${buildQuery(next)}`;
          return <OptionCard key={mode} href={href} icon={icon} label={label} size="sm" />;
        })}
      </div>
    </FlowScreen>
  );
}

"use client";

import { use } from "react";
import { MapPin } from "lucide-react";
import { OptionCard } from "@/components/ui/option-card";
import { FlowScreen } from "@/components/ui/flow-screen";
import { buildQuery } from "@/lib/flow-params";
import { SALON_LABELS } from "@/lib/format";

const SALONS = Object.keys(SALON_LABELS) as (keyof typeof SALON_LABELS)[];

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default function ChoixSalonPage({ searchParams }: PageProps) {
  const carried = use(searchParams);

  return (
    <FlowScreen backHref={`/mode-de-livraison${buildQuery(carried)}`} carried={carried}>
      <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
        Choisir un salon
      </h1>

      <div className="flex flex-wrap items-center justify-center gap-6">
        {SALONS.map((salon) => {
          const next = { ...carried, salon };
          const href =
            carried.from === "recap"
              ? `/recapitulatif${buildQuery({ ...next, from: undefined })}`
              : `/montant${buildQuery(next)}`;
          return <OptionCard key={salon} href={href} icon={MapPin} label={SALON_LABELS[salon]} />;
        })}
      </div>
    </FlowScreen>
  );
}

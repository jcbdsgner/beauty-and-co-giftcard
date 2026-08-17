"use client";

import { use } from "react";
import { CalendarClock, Send } from "lucide-react";
import { OptionCard } from "@/components/ui/option-card";
import { FlowScreen } from "@/components/ui/flow-screen";
import { buildQuery } from "@/lib/flow-params";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined> & { signature_type?: string }>;
};

export default function QuandEnvoyerPage({ searchParams }: PageProps) {
  const carried = use(searchParams);
  const isPostal = carried.mode === "postal";

  const backHref = carried.signature_type
    ? `/signature${buildQuery(carried)}`
    : `/vos-coordonnees${buildQuery(carried)}`;

  return (
    <FlowScreen backHref={backHref} carried={carried}>
      <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
        {isPostal ? "Quand l'expédier ?" : "Quand l'envoyer ?"}
      </h1>

      <div className="flex flex-wrap items-center justify-center gap-6">
        <OptionCard
          icon={Send}
          label={isPostal ? "Expédier maintenant" : "Envoyer maintenant"}
          href={
            carried.from === "recap"
              ? `/recapitulatif${buildQuery({ ...carried, envoi: "maintenant", from: undefined })}`
              : `/apercu-carte${buildQuery({ ...carried, envoi: "maintenant" })}`
          }
          size="sm"
        />
        <OptionCard
          icon={CalendarClock}
          label="Programmer"
          href={`/quand-envoyer/programmer${buildQuery(carried)}`}
          size="sm"
        />
      </div>
    </FlowScreen>
  );
}

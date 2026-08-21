"use client";

import { use } from "react";
import { Sparkles, Wallet } from "lucide-react";
import { OptionCard } from "@/components/ui/option-card";
import { FlowScreen } from "@/components/ui/flow-screen";
import { buildQuery } from "@/lib/flow-params";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default function TypeCadeauPage({ searchParams }: PageProps) {
  const carried = use(searchParams);

  return (
    <FlowScreen backHref={`/pour-qui${buildQuery(carried)}`} carried={carried}>
      <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
        {carried.pour === "moi" ? "Que souhaitez-vous ?" : "Que souhaitez-vous offrir ?"}
      </h1>

      <div className="flex flex-wrap items-center justify-center gap-6">
        <OptionCard
          icon={Wallet}
          label="Un montant"
          href={`/montant${buildQuery({ ...carried, type: "montant", pack: undefined })}`}
          size="sm"
        />
        <OptionCard
          icon={Sparkles}
          label="Un pack de services"
          href={`/packs${buildQuery({ ...carried, type: "pack" })}`}
          size="sm"
        />
      </div>
    </FlowScreen>
  );
}

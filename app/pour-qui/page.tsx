"use client";

import { use } from "react";
import { Gift, UserRound } from "lucide-react";
import { OptionCard } from "@/components/ui/option-card";
import { FlowScreen } from "@/components/ui/flow-screen";
import { buildQuery } from "@/lib/flow-params";

type PourQuiPageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default function PourQuiPage({ searchParams }: PourQuiPageProps) {
  const carried = use(searchParams);

  return (
    <FlowScreen backHref={`/montant${buildQuery(carried)}`} carried={carried}>
      <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
        Pour qui ?
      </h1>

      <div className="flex flex-wrap items-center justify-center gap-6">
        <OptionCard
          icon={Gift}
          label="Pour quelqu'un d'autre"
          href={`/coordonnees-destinataire${buildQuery(carried)}`}
        />
        <OptionCard
          icon={UserRound}
          label="Pour moi-même"
          href={`/vos-coordonnees${buildQuery({ ...carried, pour: "moi" })}`}
        />
      </div>
    </FlowScreen>
  );
}

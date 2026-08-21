"use client";

import { use } from "react";
import Link from "next/link";
import { FlowScreen } from "@/components/ui/flow-screen";
import { buildQuery } from "@/lib/flow-params";

const PRESET_AMOUNTS = [50000, 100000, 250000];

const blockClasses =
  "flex size-36 flex-col items-center justify-center gap-2 rounded-3xl border border-[var(--brand-color-1)] bg-white px-3 text-center transition hover:bg-[#f5f5f5] sm:size-52";

type MontantPageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default function MontantPage({ searchParams }: MontantPageProps) {
  const carried = use(searchParams);
  const nextHref = (amount: number) => {
    const next = { ...carried, amount: String(amount), type: "montant", pack: undefined };
    if (carried.from === "recap") return `/recapitulatif${buildQuery({ ...next, from: undefined })}`;
    return `/mode-de-livraison${buildQuery(next)}`;
  };

  return (
    <FlowScreen backHref={`/type-cadeau${buildQuery(carried)}`} carried={carried}>
      <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
        Montant
      </h1>

      <div className="flex flex-wrap items-center justify-center gap-6">
        {PRESET_AMOUNTS.map((amount) => (
          <Link key={amount} href={nextHref(amount)} className={blockClasses}>
            <span className="text-2xl font-semibold text-[var(--on-core-brand-color)] sm:text-3xl">
              {amount.toLocaleString("fr-FR")}
            </span>
            <span className="text-[var(--text-secondary)] text-base">FCFA</span>
          </Link>
        ))}

        <Link href={`/montant/personnalise${buildQuery(carried)}`} className={blockClasses}>
          <span className="text-lg font-semibold text-[var(--on-core-brand-color)] uppercase sm:text-2xl">Montant personnalisé</span>
        </Link>
      </div>
    </FlowScreen>
  );
}

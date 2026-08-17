"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { EyeOff, PenLine, UserRound } from "lucide-react";
import { OptionCard } from "@/components/ui/option-card";
import { FlowScreen } from "@/components/ui/flow-screen";
import { buildQuery } from "@/lib/flow-params";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default function SignaturePage({ searchParams }: PageProps) {
  const carried = use(searchParams);
  const router = useRouter();
  const buyerFullName = [carried.buyer_prenom, carried.buyer_nom].filter(Boolean).join(" ");

  const proceed = (type: "nom" | "rien", signature: string) => {
    const next = { ...carried, signature_type: type, signature };
    if (carried.from === "recap") {
      router.push(`/recapitulatif${buildQuery({ ...next, from: undefined })}`);
    } else if (carried.mode !== "retrait") {
      router.push(`/quand-envoyer${buildQuery(next)}`);
    } else {
      router.push(`/apercu-carte${buildQuery(next)}`);
    }
  };

  return (
    <FlowScreen backHref={`/vos-coordonnees${buildQuery(carried)}`} carried={carried}>
      <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
        Signature
      </h1>

      <div className="flex flex-wrap items-center justify-center gap-6">
        <OptionCard
          icon={PenLine}
          label="Un alias"
          href={`/signature/alias${buildQuery(carried)}`}
          size="sm"
        />
        <OptionCard
          icon={UserRound}
          label={buyerFullName ? `Mon nom (${buyerFullName})` : "Mon nom"}
          onClick={() => proceed("nom", buyerFullName)}
          size="sm"
        />
        <OptionCard
          icon={EyeOff}
          label="Ne rien indiquer"
          onClick={() => proceed("rien", "")}
          size="sm"
        />
      </div>
    </FlowScreen>
  );
}

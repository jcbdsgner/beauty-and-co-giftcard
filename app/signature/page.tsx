"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { EyeOff, PenLine, UserRound } from "lucide-react";
import dynamic from "next/dynamic";
import { OptionCard } from "@/components/ui/option-card";
import { FlowScreen } from "@/components/ui/flow-screen";
import { buildQuery } from "@/lib/flow-params";

const WatercolorBackground = dynamic(
  () => import("@/components/canvas/watercolor-background").then((m) => m.WatercolorBackground),
  { ssr: false },
);

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default function SignaturePage({ searchParams }: PageProps) {
  const carried = use(searchParams);
  const router = useRouter();

  const proceed = (type: "nom" | "rien", signature: string) => {
    const next = { ...carried, signature_type: type, signature };
    if (carried.from === "recap") {
      router.push(`/recapitulatif${buildQuery({ ...next, from: undefined })}`);
    } else if (carried.mode === "numerique") {
      router.push(`/quand-envoyer${buildQuery(next)}`);
    } else {
      router.push(`/recapitulatif${buildQuery({ ...next, from: undefined })}`);
    }
  };

  return (
    <>
      <WatercolorBackground />
      <FlowScreen backHref={`/vos-coordonnees${buildQuery(carried)}`} carried={carried}>
        <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
          Signature
        </h1>

        <div className="flex flex-wrap items-center justify-center gap-6">
          <OptionCard
            icon={PenLine}
            label="Un alias"
            href={`/signature/alias${buildQuery(carried)}`}
          />
          <OptionCard
            icon={UserRound}
            label={carried.buyer_nom ? `Mon nom (${carried.buyer_nom})` : "Mon nom"}
            onClick={() => proceed("nom", carried.buyer_nom ?? "")}
          />
          <OptionCard icon={EyeOff} label="Ne rien indiquer" onClick={() => proceed("rien", "")} />
        </div>
      </FlowScreen>
    </>
  );
}

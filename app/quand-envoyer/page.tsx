"use client";

import { use } from "react";
import { CalendarClock, Send } from "lucide-react";
import dynamic from "next/dynamic";
import { OptionCard } from "@/components/ui/option-card";
import { FlowScreen } from "@/components/ui/flow-screen";
import { buildQuery } from "@/lib/flow-params";

const WatercolorBackground = dynamic(
  () => import("@/components/canvas/watercolor-background").then((m) => m.WatercolorBackground),
  { ssr: false },
);

type PageProps = {
  searchParams: Promise<Record<string, string | undefined> & { signature_type?: string }>;
};

export default function QuandEnvoyerPage({ searchParams }: PageProps) {
  const carried = use(searchParams);

  const backHref = carried.signature_type
    ? `/signature${buildQuery(carried)}`
    : `/vos-coordonnees${buildQuery(carried)}`;

  return (
    <>
      <WatercolorBackground />
      <FlowScreen backHref={backHref} carried={carried}>
        <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
          Quand l&apos;envoyer ?
        </h1>

        <div className="flex flex-wrap items-center justify-center gap-6">
          <OptionCard
            icon={Send}
            label="Envoyer maintenant"
            href={`/recapitulatif${buildQuery({ ...carried, envoi: "maintenant" })}`}
          />
          <OptionCard
            icon={CalendarClock}
            label="Programmer"
            href={`/quand-envoyer/programmer${buildQuery(carried)}`}
          />
        </div>
      </FlowScreen>
    </>
  );
}

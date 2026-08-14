"use client";

import { use } from "react";
import { Store, TabletSmartphone, Truck } from "lucide-react";
import dynamic from "next/dynamic";
import { OptionCard } from "@/components/ui/option-card";
import { FlowScreen } from "@/components/ui/flow-screen";
import { buildQuery } from "@/lib/flow-params";

const WatercolorBackground = dynamic(
  () => import("@/components/canvas/watercolor-background").then((m) => m.WatercolorBackground),
  { ssr: false },
);

const OPTIONS = [
  {
    icon: TabletSmartphone,
    label: "Numérique",
    mode: "numerique",
    detail: "Gratuit · immédiat",
  },
  {
    icon: Store,
    label: "Retrait en salon",
    mode: "retrait",
    detail: "Gratuit · sous 24h",
  },
  {
    icon: Truck,
    label: "Livraison",
    mode: "postal",
    detail: "+2 000 FCFA · 3-5 jours",
  },
] as const;

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default function ModeDeLivraisonPage({ searchParams }: PageProps) {
  const carried = use(searchParams);

  return (
    <>
      <WatercolorBackground />
      <FlowScreen backHref="/" carried={carried}>
        <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
          Mode de livraison
        </h1>

        <div className="flex flex-wrap items-center justify-center gap-6">
          {OPTIONS.map(({ icon, label, mode, detail }) => {
            const next = { ...carried, mode };
            const href =
              carried.from === "recap"
                ? `/recapitulatif${buildQuery({ ...next, from: undefined })}`
                : `/montant${buildQuery(next)}`;
            return <OptionCard key={mode} href={href} icon={icon} label={label} detail={detail} />;
          })}
        </div>
      </FlowScreen>
    </>
  );
}

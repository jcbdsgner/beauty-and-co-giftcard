"use client";

import { use } from "react";
import { LogIn, Mail } from "lucide-react";
import dynamic from "next/dynamic";
import { BackLinkWithLogo } from "@/components/layout/back-link-with-logo";
import { OptionCard } from "@/components/ui/option-card";
import { buildQuery } from "@/lib/flow-params";

const WatercolorBackground = dynamic(
  () => import("@/components/canvas/watercolor-background").then((m) => m.WatercolorBackground),
  { ssr: false },
);

type PageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default function MesCartesCadeauxEntreePage({ searchParams }: PageProps) {
  const { email } = use(searchParams);

  return (
    <section className="relative flex min-h-svh flex-col items-center justify-center gap-10 px-6 py-16">
      <WatercolorBackground />

      <BackLinkWithLogo backHref="/" />

      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
          Mes cartes cadeaux
        </h1>
        <p className="text-[var(--text-secondary)]">Retrouvez vos cartes, avec ou sans compte.</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6">
        <OptionCard
          icon={LogIn}
          label="Se connecter"
          size="sm"
          href={`/connexion${buildQuery({ email })}`}
        />
        <OptionCard
          icon={Mail}
          label="Recevoir un lien"
          size="sm"
          href={`/demander-un-lien${buildQuery({ email })}`}
        />
      </div>
    </section>
  );
}

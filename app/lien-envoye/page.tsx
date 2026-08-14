"use client";

import { use } from "react";
import { MailCheck } from "lucide-react";
import dynamic from "next/dynamic";
import { buildQuery } from "@/lib/flow-params";

const WatercolorBackground = dynamic(
  () => import("@/components/canvas/watercolor-background").then((m) => m.WatercolorBackground),
  { ssr: false },
);

type PageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default function LienEnvoyePage({ searchParams }: PageProps) {
  const { email } = use(searchParams);

  return (
    <section className="relative flex min-h-svh flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <WatercolorBackground />

      <MailCheck size={56} strokeWidth={1.5} className="text-[var(--button-2-color)]" />

      <div className="flex flex-col items-center gap-2">
        <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
          Vérifiez votre boîte mail
        </h1>
        <p className="text-[var(--text-secondary)] max-w-sm">
          {email ? `Un lien a été envoyé à ${email}.` : "Un lien vous a été envoyé."} Il ouvre
          directement vos cartes cadeaux et reste valable 15 minutes.
        </p>
      </div>

      {/* No real email backend — demo-only affordance to continue the flow,
          standing in for "clicking the link received by email". */}
      <a
        href={`/mes-cartes-cadeaux/liste${buildQuery({ email })}`}
        className="text-[var(--text-secondary)] text-sm underline-offset-2 opacity-70 hover:underline"
      >
        Démo — simuler le clic sur le lien reçu
      </a>
    </section>
  );
}

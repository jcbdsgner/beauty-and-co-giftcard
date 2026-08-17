"use client";

import { use } from "react";
import { CheckCircle2, QrCode } from "lucide-react";
import { SiteLogo } from "@/components/layout/site-logo";
import { Button } from "@/components/ui/button";
import { ReferenceBox } from "@/components/ui/reference-box";
import { SALON_LABELS } from "@/lib/format";

type Carried = Record<string, string | undefined>;

type PageProps = {
  searchParams: Promise<Carried>;
};

export default function ConfirmationPage({ searchParams }: PageProps) {
  const carried = use(searchParams);
  const reference = carried.ref ?? "—";

  const modeMessage = () => {
    if (carried.mode === "numerique") {
      return carried.envoi === "programme" && carried.envoi_date
        ? `Votre carte sera envoyée le ${new Date(carried.envoi_date).toLocaleDateString("fr-FR")}.`
        : "Votre carte a été envoyée par email à l'instant.";
    }
    if (carried.mode === "retrait") {
      const salon = carried.salon ? SALON_LABELS[carried.salon] : undefined;
      return salon
        ? `Présentez ce code au salon ${salon} pour récupérer votre carte cadeau.`
        : "Présentez ce code en salon pour récupérer votre carte cadeau.";
    }
    return carried.envoi === "programme" && carried.envoi_date
      ? `Votre carte sera expédiée le ${new Date(carried.envoi_date).toLocaleDateString("fr-FR")}, livraison estimée sous 3 à 5 jours ouvrés après expédition.`
      : "Livraison estimée sous 3 à 5 jours ouvrés.";
  };

  return (
    <section className="relative flex min-h-svh flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="absolute inset-x-0 top-8 flex justify-center">
        <SiteLogo />
      </div>

      <CheckCircle2 size={56} strokeWidth={1.5} className="text-[var(--button-2-color)]" />

      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
          Merci d&apos;avoir choisi Beauty and Co
        </h1>
        <p className="text-[var(--text-secondary)] max-w-md">{modeMessage()}</p>
      </div>

      <ReferenceBox reference={reference}>
        {carried.mode === "retrait" && (
          <QrCode size={120} strokeWidth={1} className="text-[var(--on-core-brand-color)]" />
        )}
      </ReferenceBox>

      <div className="flex w-[min(90vw,26rem)] flex-col items-center gap-4">
        <Button href="/" className="w-full">
          Retour à l&apos;accueil
        </Button>
        <Button
          href={`/mes-cartes-cadeaux${carried.buyer_email ? `?email=${encodeURIComponent(carried.buyer_email)}` : ""}`}
          variant="outline"
          className="w-full bg-transparent"
        >
          Voir mes cartes cadeaux
        </Button>
      </div>
    </section>
  );
}

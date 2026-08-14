"use client";

import { use, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { FlowScreen } from "@/components/ui/flow-screen";
import { buildQuery } from "@/lib/flow-params";

const WatercolorBackground = dynamic(
  () => import("@/components/canvas/watercolor-background").then((m) => m.WatercolorBackground),
  { ssr: false },
);

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default function CoordonneesDestinatairePage({ searchParams }: PageProps) {
  const carried = use(searchParams);
  const { mode, amount, dest_nom, dest_email, dest_telephone } = carried;
  const router = useRouter();

  const [nom, setNom] = useState(dest_nom ?? "");
  const [email, setEmail] = useState(dest_email ?? "");
  const [telephone, setTelephone] = useState(dest_telephone ?? "");

  const isPostal = mode === "postal";
  const isRetrait = mode === "retrait";
  const isNumerique = mode === "numerique";
  // Retrait/livraison n'ont ni l'un ni l'autre de vrai backend de notif email —
  // le téléphone est le seul canal fiable pour prévenir le destinataire (SMS
  // "prête au retrait", appel du livreur à l'arrivée).
  const needsPhone = isPostal || isRetrait;

  const isValid = isPostal
    ? nom.trim() !== "" && telephone.trim() !== ""
    : nom.trim() !== "" &&
      (!isNumerique || email.trim() !== "") &&
      (!isRetrait || telephone.trim() !== "");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) return;
    const next = {
      ...carried,
      dest_nom: nom,
      dest_email: email,
      dest_telephone: telephone,
    };
    // La livraison a son propre écran d'adresse (quartier + précisions) —
    // les autres modes passent directement au message.
    router.push(isPostal ? `/adresse-livraison${buildQuery(next)}` : `/message${buildQuery(next)}`);
  };

  return (
    <>
      <WatercolorBackground />
      <FlowScreen backHref={`/pour-qui${buildQuery({ mode, amount })}`} carried={carried}>
        <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
          Coordonnées du destinataire
        </h1>

        <form
          onSubmit={handleSubmit}
          className="flex w-[min(90vw,28rem)] flex-col items-center gap-4"
        >
          <TextField
            type="text"
            value={nom}
            onChange={(event) => setNom(event.target.value)}
            placeholder={isPostal ? "Nom complet" : "Nom du destinataire"}
            aria-label={isPostal ? "Nom complet du destinataire" : "Nom du destinataire"}
          />

          {!isPostal && (
            <TextField
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={isNumerique ? "Email du destinataire" : "Email du destinataire (optionnel)"}
              aria-label="Email du destinataire"
            />
          )}

          {needsPhone && (
            <TextField
              type="tel"
              value={telephone}
              onChange={(event) => setTelephone(event.target.value)}
              placeholder={isPostal ? "Téléphone (pour le livreur)" : "Téléphone (pour le prévenir)"}
              aria-label="Téléphone du destinataire"
            />
          )}

          <Button type="submit" size="lg" disabled={!isValid} className="w-full">
            Continuer
          </Button>
        </form>
      </FlowScreen>
    </>
  );
}

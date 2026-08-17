"use client";

import { use, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { FlowScreen } from "@/components/ui/flow-screen";
import { buildQuery } from "@/lib/flow-params";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default function CoordonneesDestinatairePage({ searchParams }: PageProps) {
  const carried = use(searchParams);
  const { mode, amount } = carried;
  const router = useRouter();

  const [prenom, setPrenom] = useState(carried.dest_prenom ?? "");
  const [nom, setNom] = useState(carried.dest_nom ?? "");
  const [telephone, setTelephone] = useState(carried.dest_telephone ?? "");
  const [email, setEmail] = useState(carried.dest_email ?? "");

  const isPostal = mode === "postal";
  // Le mode de réception ne dicte pas quel canal de contact est obligatoire —
  // le téléphone n'est pas réservé au livreur/SMS "prête au retrait" : au
  // moins un des deux (téléphone ou email) suffit, quel que soit le mode.
  const isValid = prenom.trim() !== "" && nom.trim() !== "" && (telephone.trim() !== "" || email.trim() !== "");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) return;
    const next = { ...carried, dest_prenom: prenom, dest_nom: nom, dest_telephone: telephone, dest_email: email };
    // La livraison a son propre écran d'adresse (quartier + précisions) —
    // les autres modes passent directement au message.
    router.push(isPostal ? `/adresse-livraison${buildQuery(next)}` : `/message${buildQuery(next)}`);
  };

  return (
    <FlowScreen backHref={`/pour-qui${buildQuery({ mode, amount })}`} carried={carried}>
      <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
        Destinataire
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex w-[min(90vw,34rem)] flex-col items-center gap-4"
      >
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            type="text"
            value={prenom}
            onChange={(event) => setPrenom(event.target.value)}
            placeholder="Prénom"
            aria-label="Prénom du destinataire"
          />

          <TextField
            type="text"
            value={nom}
            onChange={(event) => setNom(event.target.value)}
            placeholder="Nom"
            aria-label="Nom du destinataire"
          />

          <TextField
            type="tel"
            prefix="+221"
            value={telephone}
            onChange={(event) => setTelephone(event.target.value)}
            placeholder="Téléphone"
            aria-label="Téléphone du destinataire"
            className="sm:col-span-2"
          />

          <TextField
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            aria-label="Email du destinataire"
            className="sm:col-span-2"
          />
        </div>

        <p className="text-[var(--text-secondary)] -mt-1 text-center text-sm">
          Au moins une des deux coordonnées (téléphone ou email) est nécessaire.
        </p>

        <Button type="submit" size="lg" disabled={!isValid} className="w-full">
          Continuer
        </Button>
      </form>
    </FlowScreen>
  );
}

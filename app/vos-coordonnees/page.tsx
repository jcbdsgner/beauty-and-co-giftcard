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

export default function VosCoordonneesPage({ searchParams }: PageProps) {
  const carried = use(searchParams);
  const router = useRouter();
  const [prenom, setPrenom] = useState(carried.buyer_prenom ?? "");
  const [nom, setNom] = useState(carried.buyer_nom ?? "");
  const [telephone, setTelephone] = useState(carried.buyer_telephone ?? "");
  const [email, setEmail] = useState(carried.buyer_email ?? "");
  const [hideIdentity, setHideIdentity] = useState(carried.buyer_confidentiel === "1");

  const isForSomeoneElse = carried.pour !== "moi";
  const isValid =
    prenom.trim() !== "" && nom.trim() !== "" && telephone.trim() !== "" && email.trim() !== "";

  const backHref = isForSomeoneElse
    ? `/message${buildQuery(carried)}`
    : `${carried.mode === "retrait" ? "/choix-salon" : "/mode-de-livraison"}${buildQuery(carried)}`;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) return;

    const next = {
      ...carried,
      buyer_prenom: prenom,
      buyer_nom: nom,
      buyer_telephone: telephone,
      buyer_email: email,
      buyer_confidentiel: hideIdentity ? "1" : "0",
    };

    if (carried.from === "recap") {
      router.push(`/recapitulatif${buildQuery({ ...next, from: undefined })}`);
    } else if (isForSomeoneElse) {
      router.push(`/signature${buildQuery(next)}`);
    } else if (carried.mode === "postal") {
      // Buying for yourself with postal delivery still needs a delivery
      // address — the same screen the "for someone else" branch uses,
      // just re-entered from here instead of from Destinataire.
      router.push(`/adresse-livraison${buildQuery(next)}`);
    } else if (carried.mode !== "retrait") {
      router.push(`/quand-envoyer${buildQuery(next)}`);
    } else {
      router.push(`/apercu-carte${buildQuery(next)}`);
    }
  };

  return (
    <FlowScreen backHref={backHref} carried={carried}>
      <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
        Vos coordonnées
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
            placeholder="Prénom *"
            aria-label="Votre prénom"
          />
          <TextField
            type="text"
            value={nom}
            onChange={(event) => setNom(event.target.value)}
            placeholder="Nom *"
            aria-label="Votre nom"
          />
          <TextField
            type="tel"
            prefix="+221"
            value={telephone}
            onChange={(event) => setTelephone(event.target.value)}
            placeholder="Téléphone *"
            aria-label="Votre téléphone"
            className="sm:col-span-2"
          />
          <TextField
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email *"
            aria-label="Votre email"
            className="sm:col-span-2"
          />
        </div>

        {isForSomeoneElse && (
          <label className="text-[var(--text-secondary)] flex w-full items-start gap-2 px-1 text-sm">
            <input
              type="checkbox"
              checked={hideIdentity}
              onChange={(event) => setHideIdentity(event.target.checked)}
              className="mt-0.5 accent-[var(--core-brand-color)]"
            />
            Garder mes coordonnées confidentielles (non visibles par le destinataire)
          </label>
        )}

        <Button type="submit" size="lg" disabled={!isValid} className="w-full">
          Continuer
        </Button>
      </form>
    </FlowScreen>
  );
}

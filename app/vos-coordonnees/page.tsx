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

export default function VosCoordonneesPage({ searchParams }: PageProps) {
  const carried = use(searchParams);
  const router = useRouter();
  const [nom, setNom] = useState(carried.buyer_nom ?? "");
  const [email, setEmail] = useState(carried.buyer_email ?? "");

  const isForSomeoneElse = carried.pour !== "moi";
  const isValid = nom.trim() !== "" && email.trim() !== "";

  const backHref = isForSomeoneElse
    ? `/message${buildQuery(carried)}`
    : `/pour-qui${buildQuery({ mode: carried.mode, amount: carried.amount })}`;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) return;

    const next = { ...carried, buyer_nom: nom, buyer_email: email };

    if (carried.from === "recap") {
      router.push(`/recapitulatif${buildQuery({ ...next, from: undefined })}`);
    } else if (isForSomeoneElse) {
      router.push(`/signature${buildQuery(next)}`);
    } else if (carried.mode === "numerique") {
      router.push(`/quand-envoyer${buildQuery(next)}`);
    } else {
      router.push(`/recapitulatif${buildQuery({ ...next, from: undefined })}`);
    }
  };

  return (
    <>
      <WatercolorBackground />
      <FlowScreen backHref={backHref} carried={carried}>
        <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
          Vos coordonnées
        </h1>

        <form
          onSubmit={handleSubmit}
          className="flex w-[min(90vw,28rem)] flex-col items-center gap-4"
        >
          <TextField
            type="text"
            value={nom}
            onChange={(event) => setNom(event.target.value)}
            placeholder="Nom complet"
            aria-label="Votre nom complet"
          />
          <TextField
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            aria-label="Votre email"
          />

          <Button type="submit" size="lg" disabled={!isValid} className="w-full">
            Continuer
          </Button>
        </form>
      </FlowScreen>
    </>
  );
}

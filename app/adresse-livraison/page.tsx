"use client";

import { use, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextAreaField, SelectField } from "@/components/ui/text-field";
import { FlowScreen } from "@/components/ui/flow-screen";
import { buildQuery } from "@/lib/flow-params";
import { DAKAR_QUARTIERS, OTHER_DELIVERY_ZONES } from "@/lib/delivery";

type PageProps = {
  searchParams: Promise<{
    mode?: string;
    amount?: string;
    pour?: string;
    dest_prenom?: string;
    dest_nom?: string;
    dest_telephone?: string;
    dest_quartier?: string;
    dest_adresse?: string;
  }>;
};

export default function AdresseLivraisonPage({ searchParams }: PageProps) {
  const carried = use(searchParams);
  const router = useRouter();

  // Reached from two places: Destinataire (buying for someone else) or Vos
  // coordonnées (buying for yourself, postal delivery still needs an
  // address) — same screen, same dest_quartier/dest_adresse fields either
  // way, just a different place to return to and continue from.
  const isForSomeoneElse = carried.pour !== "moi";
  const backHref = isForSomeoneElse
    ? `/coordonnees-destinataire${buildQuery(carried)}`
    : `/vos-coordonnees${buildQuery(carried)}`;

  const [quartier, setQuartier] = useState(carried.dest_quartier ?? "");
  const [adresse, setAdresse] = useState(carried.dest_adresse ?? "");

  const isValid = quartier !== "" && adresse.trim() !== "";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) return;
    const next = { ...carried, dest_quartier: quartier, dest_adresse: adresse };
    router.push(isForSomeoneElse ? `/message${buildQuery(next)}` : `/quand-envoyer${buildQuery(next)}`);
  };

  return (
    <FlowScreen backHref={backHref} carried={carried}>
      <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
        Adresse de livraison
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex w-[min(90vw,28rem)] flex-col items-center gap-4"
      >
        <SelectField
          value={quartier}
          onChange={(event) => setQuartier(event.target.value)}
          aria-label="Quartier de livraison"
        >
          <option value="" disabled>
            Quartier de livraison
          </option>
          <optgroup label="Dakar">
            {DAKAR_QUARTIERS.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </optgroup>
          {OTHER_DELIVERY_ZONES.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </SelectField>

        <TextAreaField
          value={adresse}
          onChange={(event) => setAdresse(event.target.value)}
          placeholder="Adresse complète (rue, bâtiment, étage, digicode...)"
          aria-label="Adresse de livraison complète"
          rows={3}
        />

        <Button type="submit" size="lg" disabled={!isValid} className="w-full">
          Continuer
        </Button>
      </form>
    </FlowScreen>
  );
}

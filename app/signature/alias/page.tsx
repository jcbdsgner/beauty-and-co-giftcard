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

export default function SignatureAliasPage({ searchParams }: PageProps) {
  const carried = use(searchParams);
  const router = useRouter();
  const [alias, setAlias] = useState(carried.signature_type === "alias" ? (carried.signature ?? "") : "");

  const isValid = alias.trim() !== "";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) return;
    const next = { ...carried, signature_type: "alias", signature: alias };
    if (carried.from === "recap") {
      router.push(`/recapitulatif${buildQuery({ ...next, from: undefined })}`);
    } else if (carried.mode !== "retrait") {
      router.push(`/quand-envoyer${buildQuery(next)}`);
    } else {
      router.push(`/apercu-carte${buildQuery(next)}`);
    }
  };

  return (
    <FlowScreen backHref={`/signature${buildQuery(carried)}`} carried={carried}>
      <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
        Votre alias
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex w-[min(90vw,28rem)] flex-col items-center gap-4"
      >
        <TextField
          type="text"
          value={alias}
          onChange={(event) => setAlias(event.target.value)}
          placeholder="Votre alias *"
          aria-label="Votre alias"
          autoFocus
          className="text-center"
        />
        <Button type="submit" size="lg" disabled={!isValid} className="w-full">
          Continuer
        </Button>
      </form>
    </FlowScreen>
  );
}

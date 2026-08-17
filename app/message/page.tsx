"use client";

import { use, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/text-field";
import { FlowScreen } from "@/components/ui/flow-screen";
import { buildQuery } from "@/lib/flow-params";

const MAX_LENGTH = 250;

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default function MessagePage({ searchParams }: PageProps) {
  const carried = use(searchParams);
  const router = useRouter();
  const [message, setMessage] = useState(carried.message ?? "");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = { ...carried, message };
    router.push(
      carried.from === "recap" ? `/recapitulatif${buildQuery({ ...next, from: undefined })}` : `/vos-coordonnees${buildQuery(next)}`,
    );
  };

  return (
    <FlowScreen
      backHref={
        carried.mode === "postal"
          ? `/adresse-livraison${buildQuery(carried)}`
          : `/coordonnees-destinataire${buildQuery(carried)}`
      }
      carried={carried}
    >
      <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
        Un message ? (facultatif)
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex w-[min(90vw,30rem)] flex-col items-center gap-2"
      >
        <TextAreaField
          value={message}
          onChange={(event) => setMessage(event.target.value.slice(0, MAX_LENGTH))}
          placeholder="Écrivez un petit mot..."
          aria-label="Message pour le destinataire"
          rows={5}
        />
        <span className="text-[var(--text-secondary)] self-end text-base">
          {message.length} / {MAX_LENGTH}
        </span>

        <Button type="submit" size="lg" className="mt-2 w-full">
          Continuer
        </Button>
      </form>
    </FlowScreen>
  );
}

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

const MIN_AMOUNT = 5000;
const MAX_AMOUNT = 1000000;

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default function MontantPersonnalisePage({ searchParams }: PageProps) {
  const carried = use(searchParams);
  const router = useRouter();
  const [amount, setAmount] = useState(carried.amount ?? "");

  const parsed = Number(amount);
  const isValid =
    amount !== "" && Number.isFinite(parsed) && parsed >= MIN_AMOUNT && parsed <= MAX_AMOUNT;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) return;
    const next = { ...carried, amount: String(parsed) };
    router.push(
      carried.from === "recap" ? `/recapitulatif${buildQuery({ ...next, from: undefined })}` : `/pour-qui${buildQuery(next)}`,
    );
  };

  return (
    <>
      <WatercolorBackground />
      <FlowScreen backHref={`/montant${buildQuery(carried)}`} carried={carried}>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
            Montant personnalisé
          </h1>
          <p className="text-[var(--text-secondary)]">
            Entre {MIN_AMOUNT.toLocaleString("de-DE")} et {MAX_AMOUNT.toLocaleString("de-DE")} FCFA
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex w-[min(90vw,28rem)] flex-col items-center gap-4"
        >
          <TextField
            type="number"
            inputMode="numeric"
            min={MIN_AMOUNT}
            max={MAX_AMOUNT}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Montant en FCFA"
            aria-label="Montant personnalisé en FCFA"
            autoFocus
            className="text-center"
          />
          <Button type="submit" size="lg" disabled={!isValid} className="w-full">
            Continuer
          </Button>
        </form>
      </FlowScreen>
    </>
  );
}

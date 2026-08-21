"use client";

import { use, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackLinkWithLogo } from "@/components/layout/back-link-with-logo";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { getCardById } from "@/lib/cards/persistence";
import { canTopUp } from "@/lib/cards/availability";
import type { GiftCard } from "@/lib/cards/types";
import { formatFcfa } from "@/lib/format";
import { buildQuery } from "@/lib/flow-params";

const PRESET_AMOUNTS = [10000, 25000, 50000];
const MIN_AMOUNT = 5000;
const MAX_AMOUNT = 500000;

const blockClasses =
  "flex size-32 flex-col items-center justify-center gap-2 rounded-3xl border border-[var(--brand-color-1)] bg-white px-3 text-center transition hover:bg-[#f5f5f5] sm:size-40";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ email?: string }>;
};

export default function RechargerCartePage({ params, searchParams }: PageProps) {
  const { id } = use(params);
  const { email } = use(searchParams);
  const router = useRouter();
  // Same client-only read pattern as the detail page — localStorage isn't
  // available during the server render.
  const [card, setCard] = useState<GiftCard | null | undefined>(undefined);
  const [customAmount, setCustomAmount] = useState("");

  useEffect(() => {
    const load = () => setCard(getCardById(id) ?? null);
    load();
  }, [id]);

  const backHref = `/mes-cartes-cadeaux/liste/${id}${buildQuery({ email })}`;
  const nextHref = (amount: number) =>
    `/mes-cartes-cadeaux/liste/${id}/recharger/paiement${buildQuery({ email, montant: String(amount) })}`;

  const parsedCustom = Number(customAmount);
  const isCustomValid =
    customAmount !== "" &&
    Number.isFinite(parsedCustom) &&
    parsedCustom >= MIN_AMOUNT &&
    parsedCustom <= MAX_AMOUNT;

  const handleCustomSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isCustomValid) return;
    router.push(nextHref(parsedCustom));
  };

  if (card === undefined) return null;

  if (card === null || !canTopUp(card)) {
    return (
      <section className="relative flex min-h-svh flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <BackLinkWithLogo backHref={backHref} />
        <p className="mt-24 text-[var(--text-secondary)]">
          {card === null ? "Carte introuvable." : "Cette carte est épuisée et ne peut plus être rechargée."}
        </p>
      </section>
    );
  }

  return (
    <section className="relative flex min-h-svh flex-col items-center justify-center gap-10 px-6 py-16">
      <BackLinkWithLogo backHref={backHref} />

      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
          Recharger la carte
        </h1>
        <p className="text-[var(--text-secondary)]">
          Solde actuel : {formatFcfa(card.balance)}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6">
        {PRESET_AMOUNTS.map((amount) => (
          <Link key={amount} href={nextHref(amount)} className={blockClasses}>
            <span className="text-xl font-semibold text-[var(--on-core-brand-color)] sm:text-2xl">
              +{amount.toLocaleString("fr-FR")}
            </span>
            <span className="text-[var(--text-secondary)] text-base">FCFA</span>
          </Link>
        ))}
      </div>

      <form
        onSubmit={handleCustomSubmit}
        className="flex w-[min(90vw,26rem)] flex-col items-center gap-3"
      >
        <p className="text-[var(--text-secondary)] text-sm">
          ou un montant personnalisé (entre {MIN_AMOUNT.toLocaleString("fr-FR")} et{" "}
          {MAX_AMOUNT.toLocaleString("fr-FR")} FCFA)
        </p>
        <TextField
          type="number"
          inputMode="numeric"
          min={MIN_AMOUNT}
          max={MAX_AMOUNT}
          value={customAmount}
          onChange={(event) => setCustomAmount(event.target.value)}
          placeholder="Montant en FCFA"
          aria-label="Montant personnalisé en FCFA"
          className="[appearance:textfield] text-center [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
        />
        <Button type="submit" size="lg" disabled={!isCustomValid} className="w-full">
          Continuer
        </Button>
      </form>
    </section>
  );
}

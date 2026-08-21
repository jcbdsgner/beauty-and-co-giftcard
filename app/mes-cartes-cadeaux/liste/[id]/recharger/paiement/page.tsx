"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CreditCard, Lock, Smartphone } from "lucide-react";
import { BackLinkWithLogo } from "@/components/layout/back-link-with-logo";
import { Button } from "@/components/ui/button";
import { getCardById, topUpCard } from "@/lib/cards/persistence";
import { canTopUp } from "@/lib/cards/availability";
import type { GiftCard } from "@/lib/cards/types";
import { formatFcfa } from "@/lib/format";
import { buildQuery } from "@/lib/flow-params";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ email?: string; montant?: string }>;
};

export default function RechargerPaiementPage({ params, searchParams }: PageProps) {
  const { id } = use(params);
  const { email, montant } = use(searchParams);
  const router = useRouter();
  const [card, setCard] = useState<GiftCard | null | undefined>(undefined);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = () => setCard(getCardById(id) ?? null);
    load();
  }, [id]);

  const backHref = `/mes-cartes-cadeaux/liste/${id}/recharger${buildQuery({ email })}`;
  const rechargeAmount = Number(montant);
  const orderComplete = card != null && canTopUp(card) && Number.isFinite(rechargeAmount) && rechargeAmount > 0;

  const handlePay = async () => {
    if (!orderComplete) return;
    setError(false);
    setIsProcessing(true);
    // Simulated processing delay, matching /paiement — no real payment
    // provider wired yet (see docs/userflow.md decision #3 / #10).
    await new Promise((resolve) => setTimeout(resolve, 700));
    setIsProcessing(false);

    if (simulateFailure) {
      setError(true);
      return;
    }

    topUpCard(id, rechargeAmount);
    router.push(`/mes-cartes-cadeaux/liste/${id}${buildQuery({ email, recharge: "ok" })}`);
  };

  if (card === undefined) return null;

  if (!orderComplete) {
    return (
      <section className="relative flex min-h-svh flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <BackLinkWithLogo backHref={backHref} />
        <p className="mt-24 text-[var(--text-secondary)]">
          {card === null ? "Carte introuvable." : "Montant de recharge invalide."}
        </p>
      </section>
    );
  }

  return (
    <section className="relative flex min-h-svh flex-col items-center justify-center gap-10 px-6 py-16">
      <BackLinkWithLogo backHref={backHref} />

      <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
        Paiement
      </h1>

      <div className="flex w-[min(90vw,26rem)] flex-col items-center gap-6 rounded-3xl border border-[var(--brand-color-1)] bg-white px-8 py-10 text-center">
        <p className="text-[var(--text-secondary)]">Montant de la recharge</p>
        <p className="font-heading text-4xl text-[var(--on-core-brand-color)]">
          {formatFcfa(rechargeAmount)}
        </p>

        {error && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-base text-red-600">
            Le paiement a échoué. Veuillez réessayer.
          </p>
        )}

        <div className="flex w-full flex-col gap-3">
          <Button
            type="button"
            variant="brand"
            icon={<Smartphone size={18} />}
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full py-4 text-center text-base whitespace-normal"
          >
            {isProcessing ? "Paiement en cours..." : "Mobile Money (Wave, Orange Money...)"}
          </Button>
          <Button
            type="button"
            variant="outline"
            icon={<CreditCard size={18} />}
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full"
          >
            Carte bancaire
          </Button>
          <Button
            type="button"
            variant="outline"
            icon={<Image src="/images/payment/paypal-icon.svg" alt="" width={15} height={18} />}
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full"
          >
            PayPal
          </Button>
        </div>

        <p className="text-[var(--text-secondary)] flex items-center gap-1.5 text-sm">
          <Lock size={12} strokeWidth={2} aria-hidden />
          Paiement sécurisé
        </p>
      </div>

      <label className="text-[var(--text-secondary)] flex w-[min(90vw,26rem)] items-center gap-2 px-2 text-sm opacity-70">
        <input
          type="checkbox"
          checked={simulateFailure}
          onChange={(event) => setSimulateFailure(event.target.checked)}
        />
        Simuler un échec de paiement (démo)
      </label>
    </section>
  );
}

"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CreditCard, Lock, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlowScreen } from "@/components/ui/flow-screen";
import { OrderExpired } from "@/components/ui/order-expired";
import { buildQuery } from "@/lib/flow-params";
import { formatFcfa } from "@/lib/format";
import { getTotalDue } from "@/lib/delivery";
import { isOrderComplete } from "@/lib/order";
import { saveCard } from "@/lib/cards/persistence";
import type { CardStatus, DeliveryMode } from "@/lib/cards/types";

type Carried = Record<string, string | undefined>;

type PageProps = {
  searchParams: Promise<Carried>;
};

function randomReference() {
  return `BCO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function initialStatus(mode: string | undefined, envoi: string | undefined): CardStatus {
  if (mode === "retrait") return "pret_retrait";
  if (envoi === "programme") return "programmee";
  return mode === "numerique" ? "envoyee" : "expediee";
}

export default function PaiementPage({ searchParams }: PageProps) {
  const carried = use(searchParams);
  const router = useRouter();
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(false);

  const totalDue = getTotalDue(carried.amount, carried.mode);
  const orderComplete = isOrderComplete(carried);

  const handlePay = async () => {
    if (!orderComplete) return;
    setError(false);
    setIsProcessing(true);
    // Simulated processing delay — no real payment provider wired yet (see
    // docs/userflow.md decision #3 / #10, Stripe is the intended target later).
    await new Promise((resolve) => setTimeout(resolve, 700));
    setIsProcessing(false);

    if (simulateFailure) {
      setError(true);
      return;
    }

    const reference = randomReference();
    const amount = Number(carried.amount);
    if (carried.buyer_email && Number.isFinite(amount)) {
      saveCard({
        id: reference,
        reference,
        mode: (carried.mode as DeliveryMode | undefined) ?? "numerique",
        amount,
        balance: amount,
        status: initialStatus(carried.mode, carried.envoi),
        buyerName: [carried.buyer_prenom, carried.buyer_nom].filter(Boolean).join(" "),
        buyerEmail: carried.buyer_email,
        destName: [carried.dest_prenom, carried.dest_nom].filter(Boolean).join(" ") || undefined,
        destEmail: carried.dest_email,
        destPhone: carried.dest_telephone,
        destAddress: carried.dest_adresse,
        destQuartier: carried.dest_quartier,
        message: carried.message,
        signature: carried.signature || undefined,
        createdAt: new Date().toISOString(),
      });
    }

    router.push(`/confirmation${buildQuery({ ...carried, ref: reference })}`);
  };

  if (!orderComplete) {
    return (
      <FlowScreen backHref="/mode-de-livraison">
        <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
          Paiement
        </h1>
        <OrderExpired />
      </FlowScreen>
    );
  }

  return (
    <FlowScreen backHref={`/recapitulatif${buildQuery(carried)}`} carried={carried}>
      <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
        Paiement
      </h1>

      <div className="flex w-[min(90vw,26rem)] flex-col items-center gap-6 rounded-3xl border border-[var(--brand-color-1)] bg-white px-8 py-10 text-center">
        <p className="text-[var(--text-secondary)]">Montant à payer</p>
        <p className="font-heading text-4xl text-[var(--on-core-brand-color)]">
          {formatFcfa(totalDue)}
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
    </FlowScreen>
  );
}

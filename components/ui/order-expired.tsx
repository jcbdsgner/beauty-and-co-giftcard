import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shown on /recapitulatif and /paiement instead of a payable form when the
 * order data behind the URL is missing or incomplete (truncated link, stale
 * bookmark, manual edit) — see lib/order.ts's isOrderComplete.
 */
export function OrderExpired() {
  return (
    <div className="flex w-[min(92vw,26rem)] flex-col items-center gap-4 rounded-3xl border border-[var(--brand-color-1)] bg-white px-8 py-10 text-center">
      <AlertCircle size={40} strokeWidth={1.5} className="text-[var(--button-2-color)]" />
      <div className="flex flex-col gap-2">
        <p className="font-heading text-xl text-[var(--on-core-brand-color)]">
          Votre parcours a expiré
        </p>
        <p className="text-[var(--text-secondary)] text-base">
          Les informations de cette commande sont incomplètes ou introuvables. Recommencez la
          composition de votre carte cadeau.
        </p>
      </div>
      <Button href="/pour-qui" size="lg" className="w-full">
        Recommencer
      </Button>
    </div>
  );
}

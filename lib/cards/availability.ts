import type { GiftCard } from "@/lib/cards/types";

export type CardAvailability = "disponible" | "epuisee";

/**
 * Collapses the 10-value fulfillment `CardStatus` (Programmée, Expédiée,
 * Prête au retrait...) down to the one binary question a cardholder actually
 * asks when glancing at a card: can I still spend it? Used anywhere the
 * status is shown to the cardholder (list row, detail page); the
 * fine-grained `CardStatus`/`STATUS_LABELS` stays available for anything
 * that needs the fulfillment detail instead.
 */
export function getCardAvailability(card: Pick<GiftCard, "balance">): CardAvailability {
  return card.balance <= 0 ? "epuisee" : "disponible";
}

export const AVAILABILITY_LABELS: Record<CardAvailability, string> = {
  disponible: "Disponible",
  epuisee: "Épuisée",
};

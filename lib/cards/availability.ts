import type { GiftCard } from "@/lib/cards/types";

export type CardAvailability = "disponible" | "programmee" | "epuisee";

/**
 * Collapses the 10-value fulfillment `CardStatus` (Programmée, Expédiée,
 * Prête au retrait...) down to the question a cardholder actually asks when
 * glancing at a card: can I (or the recipient) use it? "programmee" is
 * carved out as its own state rather than folded into "disponible" — a
 * scheduled send hasn't happened yet by definition, so labelling it
 * "Disponible" would tell the buyer it's usable before the recipient has
 * even received it. The rest of `CardStatus` (Expédiée, Prête au retrait...)
 * stays collapsed into "disponible": unlike "programmee", whether those
 * count as "available" depends on delivery-mode specifics this cardholder
 * view doesn't need to reason about. `STATUS_LABELS` stays available for
 * anything that needs the fulfillment detail instead.
 */
export function getCardAvailability(card: Pick<GiftCard, "balance" | "status">): CardAvailability {
  if (card.balance <= 0) return "epuisee";
  if (card.status === "programmee") return "programmee";
  return "disponible";
}

export const AVAILABILITY_LABELS: Record<CardAvailability, string> = {
  disponible: "Disponible",
  programmee: "Programmée",
  epuisee: "Épuisée",
};

// Shared by the list row and the detail page pill so the three states never
// drift out of sync between the two places that render them.
export const AVAILABILITY_TEXT_CLASSES: Record<CardAvailability, string> = {
  disponible: "text-[var(--on-core-brand-color)]",
  programmee: "text-[var(--button-2-color)]",
  epuisee: "text-[var(--text-secondary)]",
};

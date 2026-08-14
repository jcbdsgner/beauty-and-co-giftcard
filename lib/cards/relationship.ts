import type { GiftCard } from "@/lib/cards/types";

export type CardRelationship = "self" | "sent" | "received";

/** Where the viewer stands relative to a card — they may be the buyer, the recipient, or both (self-purchase). */
export function getCardRelationship(card: GiftCard, viewerEmail: string): CardRelationship {
  const normalized = viewerEmail.trim().toLowerCase();
  const isBuyer = card.buyerEmail.toLowerCase() === normalized;
  const isRecipient = card.destEmail?.toLowerCase() === normalized;
  // Postal deliveries never collect a recipient email (see coordonnees-destinataire),
  // so destName — always captured when buying for someone else — is the reliable
  // signal for "this card has a recipient", not destEmail.
  const hasRecipient = Boolean(card.destName);

  if (isBuyer && (!hasRecipient || isRecipient)) return "self";
  return isBuyer ? "sent" : "received";
}

export function getRelationshipLabel(card: GiftCard, viewerEmail: string): string {
  switch (getCardRelationship(card, viewerEmail)) {
    case "self":
      return "Pour vous";
    case "sent":
      return `Offerte à ${card.destName ?? "quelqu'un"}`;
    case "received":
      return `Offerte par ${card.buyerName}`;
  }
}

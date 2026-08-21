import type { GiftCard } from "@/lib/cards/types";
import { getPackById } from "@/lib/packs";

const CARDS_KEY = "bco-giftcards";

function readCards(): GiftCard[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CARDS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as GiftCard[];
  } catch {
    return [];
  }
}

function writeCards(cards: GiftCard[]): void {
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
}

export function saveCard(card: GiftCard): void {
  writeCards([...readCards(), card]);
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

/** A card's expiration is always 6 months out from whichever last touched it — purchase or recharge. */
export function addMonths(dateIso: string, months: number): string {
  const date = new Date(dateIso);
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
}

// Card ids are used as URL path segments (/mes-cartes-cadeaux/liste/[id]) —
// embedding a raw email there broke navigation (the "@" round-trips through
// Next's param decoding inconsistently), so seeded ids are hashed down to a
// plain alphanumeric string instead.
function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Demo seed data — the first time a given email has no cards at all, we
 * create 4 illustrative ones so "Mes cartes cadeaux" never looks empty in
 * the demo: one bought for yourself (fully spent), one you bought for
 * someone else (partway spent — you can still track their remaining
 * balance), one someone else bought for you (untouched), and one you
 * bought for someone else as a service pack rather than a monetary amount
 * (see `lib/packs`). Written to storage once, then behaves exactly like
 * real purchase history.
 */
function seedDemoCards(normalizedEmail: string): GiftCard[] {
  const idPrefix = `demo-${hashString(normalizedEmail)}`;
  const pack = getPackById("eclat-express");
  return [
    {
      id: `${idPrefix}-1`,
      reference: "BCO-DEMO01",
      mode: "numerique",
      amount: 25000,
      balance: 0,
      status: "utilisee",
      buyerName: "Vous",
      buyerEmail: normalizedEmail,
      createdAt: daysAgo(45),
      expiresAt: addMonths(daysAgo(45), 6),
    },
    {
      id: `${idPrefix}-2`,
      reference: "BCO-DEMO02",
      mode: "retrait",
      amount: 50000,
      balance: 18000,
      status: "utilisee_partielle",
      buyerName: "Vous",
      buyerEmail: normalizedEmail,
      destName: "Aïssatou Ndiaye",
      destEmail: "aissatou.ndiaye@example.com",
      destPhone: "77 123 45 67",
      message: "Joyeux anniversaire !",
      createdAt: daysAgo(20),
      expiresAt: addMonths(daysAgo(20), 6),
    },
    {
      id: `${idPrefix}-3`,
      reference: "BCO-DEMO03",
      mode: "postal",
      amount: 40000,
      balance: 40000,
      status: "livree",
      buyerName: "Modou Fall",
      buyerEmail: "modou.fall@example.com",
      destEmail: normalizedEmail,
      destQuartier: "Almadies",
      destAddress: "Villa 12, Cité Bellevue",
      message: "Pour te faire plaisir chez B&Co",
      createdAt: daysAgo(5),
      expiresAt: addMonths(daysAgo(5), 6),
    },
    ...(pack
      ? [
          {
            id: `${idPrefix}-4`,
            reference: "BCO-DEMO04",
            mode: "numerique" as const,
            amount: pack.price,
            balance: pack.price,
            packId: pack.id,
            status: "envoyee" as const,
            buyerName: "Vous",
            buyerEmail: normalizedEmail,
            destName: "Fatou Sarr",
            destEmail: "fatou.sarr@example.com",
            message: "Un petit moment rien que pour toi",
            createdAt: daysAgo(2),
            expiresAt: addMonths(daysAgo(2), 6),
          },
        ]
      : []),
  ];
}

/** A card shows up for both the person who bought it and the person who received it. */
export function getCardsForEmail(email: string): GiftCard[] {
  const normalized = email.trim().toLowerCase();
  const belongsToEmail = (card: GiftCard) =>
    card.buyerEmail.toLowerCase() === normalized || card.destEmail?.toLowerCase() === normalized;

  const existing = readCards();
  const cards = existing.some(belongsToEmail) ? existing : [...existing, ...seedDemoCards(normalized)];
  if (cards.length !== existing.length) writeCards(cards);

  return cards.filter(belongsToEmail).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getCardById(id: string): GiftCard | undefined {
  return readCards().find((card) => card.id === id);
}

/**
 * Reloads a card that's already been drawn down. The new balance (old
 * balance + the recharge) becomes the card's `amount` too, not just its
 * `balance` — a recharge resets the card to "full" rather than measuring
 * it against what it originally cost, so the original purchase amount is
 * discarded as a reference point. Also resets `expiresAt` to 6 months out,
 * same as a fresh purchase.
 */
export function topUpCard(id: string, addedAmount: number): GiftCard | undefined {
  const cards = readCards();
  const index = cards.findIndex((card) => card.id === id);
  if (index === -1) return undefined;

  const newBalance = cards[index].balance + addedAmount;
  const updated: GiftCard = {
    ...cards[index],
    amount: newBalance,
    balance: newBalance,
    expiresAt: addMonths(new Date().toISOString(), 6),
  };
  cards[index] = updated;
  writeCards(cards);
  return updated;
}

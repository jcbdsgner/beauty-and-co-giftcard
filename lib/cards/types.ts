// Mirrors the state model from docs/userflow.md "Modèle d'états de la carte
// cadeau" — a card never holds two active states at once; "utilisee_partielle"
// and "expiree" are the only terminal states that keep a visible balance/history.
export type CardStatus =
  | "payee"
  | "programmee"
  | "envoyee"
  | "pret_retrait"
  | "expediee"
  | "recuperee"
  | "livree"
  | "utilisee"
  | "utilisee_partielle"
  | "expiree";

export const STATUS_LABELS: Record<CardStatus, string> = {
  payee: "Payée",
  programmee: "Programmée",
  envoyee: "Envoyée",
  pret_retrait: "Prête au retrait",
  expediee: "Expédiée",
  recuperee: "Récupérée",
  livree: "Livrée",
  utilisee: "Utilisée",
  utilisee_partielle: "Utilisée (partielle)",
  expiree: "Expirée",
};

export type DeliveryMode = "numerique" | "retrait" | "postal";

export type GiftCard = {
  id: string;
  reference: string;
  mode: DeliveryMode;
  amount: number;
  balance: number;
  /** Set when this card is a service pack rather than a monetary amount — see `lib/packs`. */
  packId?: string;
  status: CardStatus;
  buyerName: string;
  buyerEmail: string;
  destName?: string;
  destEmail?: string;
  destPhone?: string;
  destAddress?: string;
  destQuartier?: string;
  message?: string;
  signature?: string;
  createdAt: string;
  /** 6 months out from whichever is most recent — the purchase, or the last recharge. */
  expiresAt: string;
};

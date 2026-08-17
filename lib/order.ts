export type CarriedOrder = Record<string, string | undefined>;

/**
 * Minimal completeness gate for the two screens that can be reached with an
 * empty/stale query string (a truncated link, a bookmark, a manual URL edit) —
 * not a full re-validation of every field's format. Without this, /recapitulatif
 * and /paiement render a fully live, payable order out of nothing.
 */
export function isOrderComplete(carried: CarriedOrder): boolean {
  const amount = Number(carried.amount);
  const hasCore =
    !!carried.mode &&
    Number.isFinite(amount) &&
    amount > 0 &&
    (carried.mode !== "retrait" || !!carried.salon);
  const hasBuyer =
    !!carried.buyer_prenom?.trim() &&
    !!carried.buyer_nom?.trim() &&
    !!carried.buyer_telephone?.trim() &&
    !!carried.buyer_email?.trim();
  const hasRecipientIfNeeded =
    carried.pour === "moi" ||
    (!!carried.dest_prenom?.trim() &&
      !!carried.dest_nom?.trim() &&
      (!!carried.dest_telephone?.trim() || !!carried.dest_email?.trim()));
  return hasCore && hasBuyer && hasRecipientIfNeeded;
}

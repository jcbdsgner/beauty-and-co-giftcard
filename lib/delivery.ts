// Quartiers de Dakar couverts par la livraison, plus Mbour (hors Dakar mais
// desservi) — un seul sélecteur plat, Mbour listé à part car ce n'est pas un
// quartier dakarois mais une ville différente.
export const DAKAR_QUARTIERS = [
  "Plateau",
  "Médina",
  "Fann",
  "Point E",
  "Mermoz",
  "Sacré-Cœur",
  "Almadies",
  "Ngor",
  "Yoff",
  "Ouakam",
  "Liberté",
  "Grand Dakar",
  "HLM",
  "Sicap",
  "Parcelles Assainies",
  "Grand Yoff",
  "Patte d'Oie",
  "Rufisque",
  "Guédiawaye",
  "Pikine",
] as const;

export const OTHER_DELIVERY_ZONES = ["Mbour"] as const;

/** Frais fixe de livraison (coursier local) — s'ajoute au montant de la carte, ne fait pas partie de sa valeur/solde. */
export const DELIVERY_FEE = 2000;

export function getDeliveryFee(mode: string | undefined): number {
  return mode === "postal" ? DELIVERY_FEE : 0;
}

export function getTotalDue(amount: number | string | undefined, mode: string | undefined): number {
  const base = typeof amount === "string" ? Number(amount) : amount;
  const safeBase = Number.isFinite(base) ? (base as number) : 0;
  return safeBase + getDeliveryFee(mode);
}

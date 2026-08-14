export const MODE_LABELS: Record<string, string> = {
  numerique: "Numérique",
  retrait: "Retrait en salon",
  postal: "Livraison",
};

export function formatFcfa(amount: number | string | undefined): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return value !== undefined && Number.isFinite(value)
    ? `${value.toLocaleString("de-DE")} FCFA`
    : "—";
}

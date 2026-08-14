import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  Gift,
  MessageCircle,
  PenLine,
  Send,
  Store,
  TabletSmartphone,
  Truck,
  UserRound,
  Wallet,
} from "lucide-react";
import { MODE_LABELS, formatFcfa } from "@/lib/format";

export type CarriedParams = Record<string, string | undefined>;

export type RecapLine = { icon: LucideIcon; text: string };

// Same icons as the pickers where each decision is actually made (Mode de
// livraison, Quand l'envoyer ?) — reusing them here is what lets the recap
// badge read at a glance instead of as another block of prose to parse.
const MODE_ICONS: Record<string, LucideIcon> = {
  numerique: TabletSmartphone,
  retrait: Store,
  postal: Truck,
};

/** Only surfaces a line once its underlying decision has actually been made — this is what makes the on-screen recap grow as the visitor moves through the flow. */
export function buildRecapLines(carried: CarriedParams): RecapLine[] {
  const lines: RecapLine[] = [];

  if (carried.mode) {
    lines.push({ icon: MODE_ICONS[carried.mode] ?? Truck, text: MODE_LABELS[carried.mode] ?? carried.mode });
  }
  if (carried.amount) lines.push({ icon: Wallet, text: formatFcfa(carried.amount) });
  if (carried.dest_nom) lines.push({ icon: Gift, text: `Pour ${carried.dest_nom}` });
  if (carried.message?.trim()) {
    const preview =
      carried.message.length > 28 ? `${carried.message.slice(0, 28)}…` : carried.message;
    lines.push({ icon: MessageCircle, text: `« ${preview} »` });
  }
  if (carried.signature?.trim()) lines.push({ icon: PenLine, text: `Signé ${carried.signature}` });
  if (carried.buyer_nom) lines.push({ icon: UserRound, text: carried.buyer_nom });
  if (carried.envoi === "programme" && carried.envoi_date) {
    lines.push({
      icon: CalendarClock,
      text: `Programmé — ${new Date(carried.envoi_date).toLocaleDateString("fr-FR")}`,
    });
  } else if (carried.envoi === "maintenant") {
    lines.push({ icon: Send, text: "Envoi immédiat" });
  }

  return lines;
}

/**
 * The card's 3 color variants. Rose is the one already implemented from the
 * original Figma frames (node 9722:6/9722:4885); taupe and gold are lifted
 * from Figma's "Variantes" section (node 9803:621 — taupe is section 9799:4,
 * gold is section 9800:597). Layout is identical across all three — only
 * fills and ink colors change — so these are pure data, consumed by
 * drawFrontFace/drawBackFace and by the 3D scene's edge color.
 */

export type SolidFill = { type: "solid"; color: string };
export type GradientStop = { offset: number; color: string };
export type GradientFill = { type: "gradient"; angleDeg: number; stops: GradientStop[] };
export type CardFill = SolidFill | GradientFill;

const solid = (color: string): SolidFill => ({ type: "solid", color });

export type CardColorwayId = "rose" | "taupe" | "gold";

export type CardColorway = {
  id: CardColorwayId;
  label: string;
  /** CSS background for the picker swatch button. */
  swatch: string;
  frontFill: CardFill;
  backFill: CardFill;
  /** Front-face text: "GIFT CARD", the tagline, and the code label under the barcode. */
  textColor: string;
  /** The barcode block's background. */
  boxColor: string;
  /** The 3D card-thickness edge slab. */
  edgeColor: string;
  /** Back-face message, signature and ribbon line art — all one ink on that face. */
  backInk: string;
  /** Which wordmark asset reads legibly on this variant's back face. */
  logo: "dark" | "light";
};

export const CARD_COLORWAYS: Record<CardColorwayId, CardColorway> = {
  rose: {
    id: "rose",
    label: "Rose",
    swatch: "#fdcfca",
    frontFill: solid("#fdcfca"),
    backFill: solid("#fdcfca"),
    textColor: "#886666",
    boxColor: "#fff1f1",
    edgeColor: "#e6cfc9",
    backInk: "#886666",
    logo: "dark",
  },
  taupe: {
    id: "taupe",
    label: "Taupe",
    swatch: "#886666",
    frontFill: solid("#886666"),
    backFill: solid("#886666"),
    textColor: "#886666",
    boxColor: "#fff1f1",
    edgeColor: "#7a5c5c",
    backInk: "#ffffff",
    logo: "light",
  },
  gold: {
    id: "gold",
    label: "Doré",
    swatch:
      "linear-gradient(121deg, #866B3F 0%, #E7C080 18%, #B38D50 37%, #DDB371 59%, #A17C41 81%, #DCAB5E 100%)",
    frontFill: {
      type: "gradient",
      angleDeg: 120.9778,
      stops: [
        { offset: 0, color: "#866B3F" },
        { offset: 18.005, color: "#E7C080" },
        { offset: 37.247, color: "#B38D50" },
        { offset: 58.511, color: "#DDB371" },
        { offset: 80.677, color: "#A17C41" },
        { offset: 100, color: "#DCAB5E" },
      ],
    },
    backFill: {
      type: "gradient",
      angleDeg: 121.5364,
      stops: [
        { offset: 0, color: "#8A6D3E" },
        { offset: 20.503, color: "#C7A46C" },
        { offset: 58.36, color: "#987843" },
        { offset: 84.362, color: "#C49B59" },
        { offset: 100, color: "#AF8A4F" },
      ],
    },
    textColor: "#b99356",
    boxColor: "#fff2dd",
    edgeColor: "#866b3f",
    backInk: "#ffffff",
    logo: "light",
  },
};

/**
 * Builds a canvas gradient spanning the (x, y, w, h) box along a CSS-style
 * angle (0deg = up, clockwise) — the same "to corner" line-length rule the
 * CSS spec uses, so the gradient touches the box's far corners exactly as
 * it does in Figma/the browser instead of an arbitrary axis-aligned one.
 */
function angledGradient(
  ctx: CanvasRenderingContext2D,
  angleDeg: number,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const angleRad = (angleDeg * Math.PI) / 180;
  const dx = Math.sin(angleRad);
  const dy = -Math.cos(angleRad);
  const cx = x + w / 2;
  const cy = y + h / 2;
  const length = Math.abs((w / 2) * dx) + Math.abs((h / 2) * dy);
  return ctx.createLinearGradient(cx - dx * length, cy - dy * length, cx + dx * length, cy + dy * length);
}

/** Sets `ctx.fillStyle` to `fill`, resolving a gradient against the (x, y, w, h) box if needed. */
export function applyFill(
  ctx: CanvasRenderingContext2D,
  fill: CardFill,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  if (fill.type === "solid") {
    ctx.fillStyle = fill.color;
    return;
  }
  const gradient = angledGradient(ctx, fill.angleDeg, x, y, w, h);
  // Figma stops can run past 100% (its handles sit outside the gradient
  // line's endpoints); addColorStop throws outside [0, 1], so clamp.
  for (const stop of fill.stops) {
    gradient.addColorStop(Math.min(1, Math.max(0, stop.offset / 100)), stop.color);
  }
  ctx.fillStyle = gradient;
}

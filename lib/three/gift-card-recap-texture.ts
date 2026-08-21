/**
 * Face art for the *printable* gift card template — a different design from
 * the digital card in `gift-card-texture.ts`. Lifted from Figma frames
 * (node 9803:622 "recto" / node 9803:5503 "verso" — "Beauty and Co _ Salon
 * site overview", node-id=9803-10392). Drawing in raw Figma units and
 * applying one canvas-wide scale keeps every coordinate a literal copy of
 * the design instead of a hand-guessed layout, same approach as the digital
 * card's texture.
 *
 * Composited with the digital card in `gift-card-landing-scene.tsx`, which
 * docks a `GiftCardMesh` onto this recto's `CARD_SLOT` placeholder.
 */
import { fillFittedParagraph, fillTextTracked, roundRectPath } from "./gift-card-texture";
import type { FontFamilies } from "./gift-card-texture";
import { applyFill, type CardColorway, type CardColorwayId, type CardFill } from "./gift-card-colors";

export const TEMPLATE_W = 2134;
export const TEMPLATE_H = 3024;

export const RECAP_CARD_ASPECT = TEMPLATE_W / TEMPLATE_H;

/**
 * The recto's empty placeholder — sized exactly like the digital card's
 * front face (FRONT_W×FRONT_H in gift-card-texture.ts) — in template-pixel
 * coordinates. Exported so a 3D scene compositing the digital card onto this
 * template can convert it into the recap mesh's local world space and dock
 * the digital card there precisely, instead of guessing the position.
 */
export const CARD_SLOT = { x: 211, y: 1604, w: 1712, h: 1080 };

const HEADER_H = 406;
const FOOTER_Y = 2928;
const FOOTER_H = TEMPLATE_H - FOOTER_Y;
const BAND_BORDER = 18;

/**
 * The header/footer band fill per colorway (node 9804:29933 — "Section 4",
 * the support's own variants: rose/taupe 9804:10393, gold 9804:20163), plus
 * whether it gets a separate divider stripe atop the body boundary. Rose's
 * band and stripe are genuinely two different colors (a visible seam);
 * taupe's are the same color in Figma — band and stripe render identically,
 * so the stripe is skipped; gold's band is a single metallic image in Figma
 * with no separate stripe color at all, so it's skipped there too and
 * approximated here as a flat gradient (avoids pulling in a photographic
 * texture asset for one thin band).
 */
const RECAP_BANDS: Record<CardColorwayId, { fill: CardFill; stripeColor: string | null }> = {
  rose: { fill: { type: "solid", color: "#fdcdca" }, stripeColor: "#886666" },
  taupe: { fill: { type: "solid", color: "#886666" }, stripeColor: null },
  gold: {
    fill: {
      type: "gradient",
      angleDeg: 90,
      stops: [
        { offset: 0.80666, color: "#AF8A4F" },
        { offset: 18.602, color: "#C49B59" },
        { offset: 43.69, color: "#987843" },
        { offset: 80.218, color: "#C7A46C" },
        { offset: 100, color: "#8A6D3E" },
      ],
    },
    stripeColor: null,
  },
};

function drawBands(ctx: CanvasRenderingContext2D, colorway: CardColorway) {
  const band = RECAP_BANDS[colorway.id];

  applyFill(ctx, band.fill, 0, 0, TEMPLATE_W, HEADER_H);
  ctx.fillRect(0, 0, TEMPLATE_W, HEADER_H);
  applyFill(ctx, band.fill, 0, FOOTER_Y, TEMPLATE_W, FOOTER_H);
  ctx.fillRect(0, FOOTER_Y, TEMPLATE_W, FOOTER_H);

  if (band.stripeColor) {
    ctx.fillStyle = band.stripeColor;
    ctx.fillRect(0, HEADER_H - BAND_BORDER / 2, TEMPLATE_W, BAND_BORDER);
    ctx.fillRect(0, FOOTER_Y - BAND_BORDER / 2, TEMPLATE_W, BAND_BORDER);
  }
}

function drawFooterTagline(ctx: CanvasRenderingContext2D, fonts: FontFamilies, colorway: CardColorway) {
  ctx.fillStyle = colorway.textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `500 ${68}px ${fonts.body}`;
  fillTextTracked(
    ctx,
    "YOUR FAVORITE HAIR AND BEAUTY SALON",
    189 + 1757 / 2,
    2800 + 46 / 2,
    14.28,
  );
}

export type RecapFrontData = {
  badgeImage: HTMLImageElement | null;
  colorway: CardColorway;
};

export function drawRecapFrontFace(canvas: HTMLCanvasElement, data: RecapFrontData, fonts: FontFamilies) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const sx = canvas.width / TEMPLATE_W;
  const sy = canvas.height / TEMPLATE_H;

  ctx.save();
  ctx.scale(sx, sy);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, TEMPLATE_W, TEMPLATE_H);

  drawBands(ctx, data.colorway);

  if (data.badgeImage) {
    // The badge (560,378 → 979.86 tall) starts above the header/body
    // divider by design, same slight-overhang-then-clip as the digital
    // card's own badge — clipped to start right past the divider *stripe*
    // (HEADER_H + BAND_BORDER/2), not its center, so the badge touches
    // neither the pink band above nor the taupe border line itself.
    ctx.save();
    ctx.beginPath();
    const bodyTop = HEADER_H + BAND_BORDER / 2;
    ctx.rect(0, bodyTop, TEMPLATE_W, FOOTER_Y - bodyTop);
    ctx.clip();
    ctx.drawImage(data.badgeImage, 560, 378, 981.84, 979.86);
    ctx.restore();
  }

  ctx.fillStyle = data.colorway.textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${230.536}px ${fonts.title}`;
  ctx.fillText("GIFT CARD", 394 + 1347 / 2, 1281.35 + 354 / 2);

  // Left empty here — the digital card mesh docks on top of this slot in
  // 3D (see gift-card-landing-scene.tsx), so this fill only shows through
  // any sub-pixel gap at the mesh's edges.
  roundRectPath(ctx, CARD_SLOT.x, CARD_SLOT.y, CARD_SLOT.w, CARD_SLOT.h, 96);
  ctx.fillStyle = data.colorway.boxColor;
  ctx.fill();

  drawFooterTagline(ctx, fonts, data.colorway);

  ctx.restore();
}

export type RecapBackData = {
  badgeImage: HTMLImageElement | null;
  occasion: string;
  from: string;
  /** Row label for the amount cell — "AMOUNT" for a monetary gift, "SERVICES" when a service pack was chosen (see `amount`). */
  amountLabel: string;
  /** The row's value — a formatted currency amount, or the pack's name when `amountLabel` is "SERVICES". */
  amount: string;
  colorway: CardColorway;
};

export function drawRecapBackFace(canvas: HTMLCanvasElement, data: RecapBackData, fonts: FontFamilies) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const sx = canvas.width / TEMPLATE_W;
  const sy = canvas.height / TEMPLATE_H;

  ctx.save();
  ctx.scale(sx, sy);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, TEMPLATE_W, TEMPLATE_H);

  drawBands(ctx, data.colorway);

  if (data.badgeImage) {
    ctx.drawImage(data.badgeImage, 509.09, 551, 1090.19, 1088);
  }

  fillFittedParagraph(
    ctx,
    data.occasion,
    { x: 273, y: 1639, w: 1589, h: 402 },
    { family: fonts.title, size: 119.088, lineHeightRatio: 1.176 },
    data.colorway.textColor,
  );

  // The FROM/AMOUNT table (Figma "Frame 51").
  const table = { x: 274, y: 2126, w: 1588, h: 434 };
  roundRectPath(ctx, table.x, table.y, table.w, table.h, 72);
  ctx.fillStyle = data.colorway.boxColor;
  ctx.fill();

  ctx.save();
  roundRectPath(ctx, table.x, table.y, table.w, table.h, 72);
  ctx.clip();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(table.x, table.y + 218);
  ctx.lineTo(table.x + table.w, table.y + 218);
  ctx.moveTo(table.x + 602, table.y);
  ctx.lineTo(table.x + 602, table.y + table.h);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#000000";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `${76.109}px ${fonts.title}`;
  ctx.fillText("FROM", table.x + 175, table.y + 86 + 61 / 2);
  ctx.fillText(data.amountLabel, table.x + 112, table.y + 302 + 61 / 2);

  ctx.textAlign = "center";
  ctx.font = `500 ${60}px ${fonts.body}`;
  fillTextTracked(ctx, data.from, table.x + 649 + 881 / 2, table.y + 94 + 64 / 2, 3.6);

  ctx.font = `500 ${70}px ${fonts.body}`;
  fillTextTracked(ctx, data.amount, table.x + 666 + 864 / 2, table.y + 302 + 74 / 2, 4.2);

  drawFooterTagline(ctx, fonts, data.colorway);

  ctx.restore();
}

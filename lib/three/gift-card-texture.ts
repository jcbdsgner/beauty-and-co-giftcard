/**
 * Face art is redrawn on a 2D canvas at these exact proportions, lifted from
 * the Figma frames (node 9722:6 front / 9722:4885 back — Beauty & Co gift
 * card, "Beauty and Co _ Salon site overview", node-id=9722-4899). Drawing in
 * raw Figma units and applying one canvas-wide scale keeps every coordinate
 * below a literal 1:1 copy of the design instead of a hand-guessed layout.
 */
const FRONT_W = 1712;
const FRONT_H = 1080;
const BACK_W = 1712;
const BACK_H = 1104;

export const CARD_ASPECT = FRONT_W / ((FRONT_H + BACK_H) / 2);

const CARD_PINK = "#fdcfca";
const TEXT_TAUPE = "#886666";
const BOX_BLUSH = "#fff1f1";

// Shown on the back in place of a personal message when none was written —
// the front's own tagline, so an unpersonalized card still reads as intentional.
const DEFAULT_BACK_MESSAGE = "A  GIFT  OF  BEAUTY,  A  GIFT  OF  BLISS!";

// "Vector 6" path data from node 9722:4888 (back card ribbon/bow line art),
// drawn in a 3010.264x2118 container offset at (-390,-127) inside the
// 1712x1104 back frame — the coordinates below are already local to that
// frame (path + container offset combined).
const RIBBON_PATH =
  "M128.436 537.403C150.007 556.385 202.294 579.509 238.878 520.146C262.837 481.268 290.308 455.181 350.766 437.415M350.766 437.415C384.704 362.603 491.866 222.758 555.074 309.475C618.28 396.193 383.353 430.559 350.766 437.415ZM350.766 437.415C271.099 424.152 170.23 359.02 188.834 259.571C207.438 160.121 366.297 277.893 350.766 437.415ZM350.766 437.415C462.07 464.417 692.36 719.576 785.54 496.102M350.766 437.415L2620.28 433.44M350.766 437.415L-389.979 433.44M350.766 437.415V1991M350.766 437.415V-127";

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draws `text` with manual per-glyph spacing — cross-browser stand-in for CSS letter-spacing on canvas. */
function fillTextTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  spacing: number,
) {
  const glyphs = [...text];
  const widths = glyphs.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (glyphs.length - 1);
  const prevAlign = ctx.textAlign;
  ctx.textAlign = "left";
  let x = cx - total / 2;
  glyphs.forEach((ch, i) => {
    ctx.fillText(ch, x, cy);
    x += widths[i] + spacing;
  });
  ctx.textAlign = prevAlign;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let line = words[0];
  for (let i = 1; i < words.length; i++) {
    const candidate = `${line} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
    } else {
      lines.push(line);
      line = words[i];
    }
  }
  lines.push(line);
  return lines;
}

/** Word-wraps into a box, shrinking font size until the block fits (or the min size is hit), then draws it vertically centered. */
function fillFittedParagraph(
  ctx: CanvasRenderingContext2D,
  text: string,
  box: { x: number; y: number; w: number; h: number },
  font: { family: string; size: number; lineHeightRatio: number; minSize?: number },
  color: string,
) {
  const minSize = font.minSize ?? font.size * 0.45;
  let size = font.size;
  let lines: string[] = [];
  let lineHeight = 0;

  for (;;) {
    ctx.font = `${size}px ${font.family}`;
    lineHeight = size * font.lineHeightRatio;
    lines = wrapLines(ctx, text, box.w);
    const blockHeight = lines.length * lineHeight;
    if (blockHeight <= box.h || size <= minSize) break;
    size -= 4;
  }

  // Still overflowing at the floor size: clip to what fits and ellipsize the last visible line.
  const maxLines = Math.max(1, Math.floor(box.h / lineHeight));
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = `${last.replace(/[.,;: ]+$/, "")}…`;
  }

  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const cx = box.x + box.w / 2;
  const blockHeight = lines.length * lineHeight;
  const firstBaselineY = box.y + box.h / 2 - blockHeight / 2 + lineHeight / 2;
  lines.forEach((l, i) => ctx.fillText(l, cx, firstBaselineY + i * lineHeight));
}

export type FrontFaceData = {
  badgeImage: HTMLImageElement | null;
};

export function drawFrontFace(canvas: HTMLCanvasElement, data: FrontFaceData, fonts: FontFamilies) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const sx = canvas.width / FRONT_W;
  const sy = canvas.height / FRONT_H;

  ctx.save();
  ctx.scale(sx, sy);

  roundRectPath(ctx, 0, 0, FRONT_W, FRONT_H, 96);
  ctx.fillStyle = CARD_PINK;
  ctx.fill();
  ctx.clip();

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 90, FRONT_W, 926);

  if (data.badgeImage) {
    // The badge sits a little above the white panel's top edge (y=-38
    // relative to it, per Figma's node 9722:8) and is clipped there by the
    // panel's own overflow-clip — reproduce that clip so the badge doesn't
    // bleed into the pink band above it.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 90, FRONT_W, 926);
    ctx.clip();
    ctx.drawImage(data.badgeImage, 630, 52, 452, 452);
    ctx.restore();
  }

  ctx.fillStyle = TEXT_TAUPE;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${164}px ${fonts.title}`;
  ctx.fillText("GIFT CARD", 378 + 957 / 2, 446 + 251 / 2);

  ctx.font = `${48}px ${fonts.title}`;
  fillTextTracked(ctx, "A  GIFT  OF  BEAUTY,  A  GIFT  OF  BLISS!", 298 + 1116 / 2, 652 + 82 / 2, 2.88);

  roundRectPath(ctx, 464, 768, 786, 200, 32);
  ctx.fillStyle = BOX_BLUSH;
  ctx.fill();

  ctx.restore();
}

export type BackFaceData = {
  message: string | undefined;
  signature: string | undefined;
  wordmarkImage: HTMLImageElement | null;
};

/**
 * The mesh's back face is a physically rotated copy of the front plane (see
 * gift-card-scene.tsx) rather than a second, separately-UV'd face — so this
 * texture is drawn straight, with no mirroring baked in.
 */
export function drawBackFace(canvas: HTMLCanvasElement, data: BackFaceData, fonts: FontFamilies) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const sx = canvas.width / BACK_W;
  const sy = canvas.height / BACK_H;

  ctx.save();
  ctx.scale(sx, sy);

  roundRectPath(ctx, 0, 0, BACK_W, BACK_H, 96);
  ctx.fillStyle = CARD_PINK;
  ctx.fill();
  ctx.clip();

  ctx.strokeStyle = TEXT_TAUPE;
  ctx.lineWidth = 7.72523;
  ctx.lineCap = "round";
  ctx.stroke(new Path2D(RIBBON_PATH));

  if (data.wordmarkImage) {
    ctx.drawImage(data.wordmarkImage, 782, 106.2, 559, 257.7);
  }

  fillFittedParagraph(
    ctx,
    data.message?.trim() || DEFAULT_BACK_MESSAGE,
    { x: 466, y: 648, w: 1191, h: 280 },
    { family: fonts.title, size: 119, lineHeightRatio: 1.18 },
    TEXT_TAUPE,
  );

  if (data.signature?.trim()) {
    ctx.font = `500 48px ${fonts.body}`;
    ctx.fillStyle = TEXT_TAUPE;
    fillTextTracked(ctx, `— ${data.signature.trim()}`, 557 + 1010 / 2, 949 + 74 / 2, 2.88);
  }

  ctx.restore();
}

export type FontFamilies = { title: string; body: string };

/** Resolves next/font's generated family name from the CSS variable it sets on <html>, so canvas text uses the same brand fonts as the rest of the page. */
export function readFontFamilies(): FontFamilies {
  const style = getComputedStyle(document.documentElement);
  const clean = (v: string) => v.trim() || "serif";
  return {
    title: clean(style.getPropertyValue("--font-prata")),
    body: clean(style.getPropertyValue("--font-cabinet-grotesk")),
  };
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

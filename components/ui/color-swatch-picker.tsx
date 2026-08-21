"use client";

import { CARD_COLORWAYS, type CardColorwayId } from "@/lib/three/gift-card-colors";

type ColorSwatchPickerProps = {
  value: CardColorwayId;
  onChange: (id: CardColorwayId) => void;
};

/** A horizontal row of color swatches, meant to sit centered above the rotate-hint caption. */
export function ColorSwatchPicker({ value, onChange }: ColorSwatchPickerProps) {
  return (
    <div
      className="flex shrink-0 items-center gap-4"
      role="radiogroup"
      aria-label="Couleur de la carte"
    >
      {Object.values(CARD_COLORWAYS).map((colorway) => {
        const selected = colorway.id === value;
        return (
          <button
            key={colorway.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={colorway.label}
            title={colorway.label}
            onClick={() => onChange(colorway.id)}
            className={`size-[45px] shrink-0 rounded-full border-2 shadow-sm transition sm:size-[55px] ${
              selected
                ? "border-[var(--on-core-brand-color)] scale-110"
                : "border-white/80 hover:scale-105"
            }`}
            style={{ background: colorway.swatch }}
          />
        );
      })}
    </div>
  );
}

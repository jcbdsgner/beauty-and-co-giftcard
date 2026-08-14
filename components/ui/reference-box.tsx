"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

type ReferenceBoxProps = {
  reference: string;
  /** Extra content rendered above the reference inside the same box (e.g. a QR code). */
  children?: React.ReactNode;
};

export function ReferenceBox({ reference, children }: ReferenceBoxProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(reference).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex w-[min(90vw,26rem)] flex-col items-center gap-4 rounded-3xl border border-[var(--brand-color-1)] bg-white px-8 py-8">
      {children}

      <span className="text-[var(--text-secondary)] text-sm font-medium tracking-wide uppercase">
        Référence de commande
      </span>

      <div className="flex items-center gap-3">
        <span className="font-heading text-3xl tracking-wide text-[var(--on-core-brand-color)] sm:text-4xl">
          {reference}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copier la référence de commande"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[var(--brand-color-1)] text-[var(--button-2-color)] transition hover:bg-[#f5f5f5]"
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
        </button>
      </div>

      {copied && <span className="text-sm text-[var(--button-2-color)]">Copié !</span>}
    </div>
  );
}

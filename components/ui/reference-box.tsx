"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

type ReferenceBoxProps = {
  reference: string;
  /** Extra content rendered above the reference inside the same box (e.g. a QR code). */
  children?: React.ReactNode;
  /** Override the default "use this in salon" caption, or pass null to omit it —
   * e.g. the retrait confirmation screen already explains this above the box. */
  hint?: string | null;
};

const DEFAULT_HINT = "À présenter en salon pour utiliser votre carte cadeau";

// Figma: https://www.figma.com/design/TAz7BDNBnBy4Xf4u3CcAfV/Beauty---Co---Icons?node-id=2287-2536
function ForwardIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinejoin="round"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22 12L14.0361 20V16.0138C9.00033 14.9763 5.02083 16.1206 2 19.9288C2.52409 12.0955 7.90658 8.31479 14.0361 8.06393V4L22 12Z"
      />
    </svg>
  );
}

export function ReferenceBox({ reference, children, hint = DEFAULT_HINT }: ReferenceBoxProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(reference).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({ title: "Code cadeau Beauty & Co", text: reference })
        .catch(() => {});
      return;
    }
    handleCopy();
  };

  return (
    <div className="flex w-[min(90vw,26rem)] flex-col items-center gap-4 rounded-3xl border border-[var(--brand-color-1)] bg-white px-8 py-8">
      {children}

      <span className="text-[var(--text-secondary)] text-sm font-medium tracking-wide uppercase">
        Code cadeau
      </span>

      <div className="flex items-center gap-3">
        <span className="font-heading text-3xl tracking-wide text-[var(--on-core-brand-color)] sm:text-4xl">
          {reference}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copier le code cadeau"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[var(--brand-color-1)] text-[var(--button-2-color)] transition hover:bg-[#f5f5f5]"
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
        </button>
        <button
          type="button"
          onClick={handleShare}
          aria-label="Transférer le code cadeau"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[var(--brand-color-1)] text-[var(--button-2-color)] transition hover:bg-[#f5f5f5]"
        >
          <ForwardIcon />
        </button>
      </div>

      {copied ? (
        <span className="text-sm text-[var(--button-2-color)]">Copié !</span>
      ) : (
        hint && <span className="text-[var(--text-secondary)] text-center text-sm">{hint}</span>
      )}
    </div>
  );
}

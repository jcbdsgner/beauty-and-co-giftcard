"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { SiteLogo } from "@/components/layout/site-logo";
import { Button } from "@/components/ui/button";
import { TiltCard } from "@/components/ui/tilt-card";
import { CONTACT_INFO, SOCIAL_LINKS } from "@/lib/contact";

const WatercolorBackground = dynamic(
  () => import("@/components/canvas/watercolor-background").then((m) => m.WatercolorBackground),
  { ssr: false },
);

export function Hero() {
  return (
    <section className="relative flex min-h-svh flex-col items-center overflow-hidden px-6 py-12 sm:justify-center sm:py-0">
      <WatercolorBackground />

      {/* In flow on mobile so the gap to the card below is a deterministic
          92px margin rather than a guess at absolute-positioning math; pinned
          to the top edge like before from sm up, once the card is centered
          by the section itself again. */}
      <div className="flex justify-center sm:absolute sm:inset-x-0 sm:top-8">
        <SiteLogo sizeClassName="h-[72px] w-auto min-w-[155px] sm:h-[101px] sm:min-w-[218px]" />
      </div>

      <div className="mt-[92px] sm:mt-0">
        <TiltCard className="w-[min(90vw,34rem)] bg-gradient-to-br from-[var(--core-brand-color)] to-[var(--core-brand-color-2)] px-8 py-10 sm:px-12 sm:py-12 lg:w-[min(90vw,56rem)]">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex flex-col gap-3">
              <h1 className="font-heading text-[32px] leading-tight text-[var(--on-core-brand-color)] sm:text-[48px]">
                Le plus beau des cadeaux à offrir
              </h1>
              <p className="text-[var(--text-secondary)] text-[16px] sm:text-[24px]">
                Une carte cadeau Beauty and Co, à utiliser dans tous nos salons, sur toutes nos
                prestations.
              </p>
            </div>
            <div className="flex w-full flex-col items-center justify-center gap-4 lg:w-auto lg:flex-row">
              <Button
                href="/mes-cartes-cadeaux"
                variant="outline"
                size="lg"
                className="w-full bg-transparent text-[var(--on-core-brand-color)] hover:bg-white/15 lg:w-auto"
              >
                Gérer mes cartes
              </Button>
              <Button
                href="/pour-qui"
                variant="brand"
                size="lg"
                className="w-full bg-white lg:w-auto"
              >
                Acheter une carte
              </Button>
            </div>
          </div>
        </TiltCard>
      </div>

      {/* In normal flow on mobile — stacked below the card, nav above
          contacts, 92px down — so both stay visible and the section grows
          (scrolls) instead of overlapping the card when content doesn't fit
          a short viewport. From sm up it pops back to the original absolute
          two-column layout, nav left / contacts right, pinned to the
          viewport edges like before. */}
      <div className="relative z-10 mt-[92px] flex flex-col items-center gap-6 sm:absolute sm:inset-x-12 sm:bottom-10 sm:mt-0 sm:flex-row sm:items-end sm:justify-between lg:inset-x-[72px]">
        <nav className="flex flex-col items-center gap-2 sm:items-start">
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-sans text-sm uppercase tracking-[0.2em] text-[var(--on-core-brand-color)] transition hover:opacity-70"
          >
            Prendre rendez-vous
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-sans text-sm uppercase tracking-[0.2em] text-[var(--on-core-brand-color)] transition hover:opacity-70"
          >
            notre boutique en ligne
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </nav>

        <div className="flex flex-col items-center gap-3 sm:items-end">
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="transition hover:opacity-70"
              >
                <Image src={social.icon} alt="" width={18} height={18} />
              </a>
            ))}
          </div>
          <div className="flex flex-col items-center gap-1 font-sans text-sm text-[var(--text-secondary)] sm:items-end">
            <span>{CONTACT_INFO.phone}</span>
            <a href={`mailto:${CONTACT_INFO.email}`} className="transition hover:opacity-70">
              {CONTACT_INFO.email}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

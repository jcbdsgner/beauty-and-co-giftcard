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
    <section className="relative flex min-h-svh items-center justify-center overflow-hidden px-6">
      <WatercolorBackground />

      <div className="absolute inset-x-0 top-8 flex justify-center">
        <SiteLogo />
      </div>

      <nav className="absolute bottom-8 left-6 z-10 flex flex-col items-start gap-2 sm:bottom-10 sm:left-12 lg:left-[72px]">
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

      {/* Hidden below sm: the nav opposite it can wrap to two lines at
          narrow widths, and both blocks share the same bottom row — kept
          only from sm up, where there's room for both side by side. */}
      <div className="absolute right-6 bottom-8 z-10 hidden flex-col items-end gap-3 sm:right-12 sm:bottom-10 sm:flex lg:right-[72px]">
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
        <div className="flex flex-col items-end gap-1 font-sans text-sm text-[var(--text-secondary)]">
          <span>{CONTACT_INFO.phone}</span>
          <a href={`mailto:${CONTACT_INFO.email}`} className="transition hover:opacity-70">
            {CONTACT_INFO.email}
          </a>
        </div>
      </div>

      <TiltCard className="w-[min(90vw,34rem)] bg-gradient-to-br from-[var(--core-brand-color)] to-[var(--core-brand-color-2)] px-8 py-12 sm:px-12 sm:py-14 lg:w-[min(90vw,56rem)]">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex flex-col gap-3">
            <h1 className="font-heading text-4xl leading-tight text-[var(--on-core-brand-color)] sm:text-5xl">
              Le plus beau des cadeaux à offrir
            </h1>
            <p className="text-[var(--text-secondary)] text-[24px]">
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
              href="/mode-de-livraison"
              variant="brand"
              size="lg"
              className="w-full bg-white lg:w-auto"
            >
              Acheter une carte
            </Button>
          </div>
        </div>
      </TiltCard>
    </section>
  );
}

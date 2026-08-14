"use client";

import dynamic from "next/dynamic";
import { SiteLogo } from "@/components/layout/site-logo";
import { Button } from "@/components/ui/button";
import { TiltCard } from "@/components/ui/tilt-card";

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

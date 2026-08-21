"use client";

import { use, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { ColorSwatchPicker } from "@/components/ui/color-swatch-picker";
import { FlowScreen } from "@/components/ui/flow-screen";
import { OrderExpired } from "@/components/ui/order-expired";
import { buildQuery } from "@/lib/flow-params";
import { formatFcfa } from "@/lib/format";
import { isOrderComplete, randomReference } from "@/lib/order";
import { getPackById } from "@/lib/packs";
import { CARD_COLORWAYS, type CardColorwayId } from "@/lib/three/gift-card-colors";

function isCardColorwayId(value: string | undefined): value is CardColorwayId {
  return !!value && value in CARD_COLORWAYS;
}

const DEFAULT_OCCASION = "A gift of beauty, a gift of bliss!";

const GiftCardLandingScene = dynamic(
  () => import("@/components/canvas/gift-card-landing-scene").then((m) => m.GiftCardLandingScene),
  { ssr: false },
);

// How long the scene takes to shrink from covering the full viewport down
// into its normal embedded slot once the card has landed.
const DOCK_DURATION = 1.1;

/** Shared entrance transition for the chrome that stays hidden until the card lands — "inOut", not "out", for the same reason as the 3D scene's own eases: these elements are sitting perfectly still beforehand, so a snap-free ramp up from rest reads as deliberate rather than jumpy. The `delay-150` lets the eye register the scene starting to shrink before the rest of the page follows. Transitions "translate", not "transform" — Tailwind v4's translate-y-* utilities set the native CSS `translate` property, not `transform`. */
const CHROME_REVEAL_TRANSITION = "transition-[translate,opacity] duration-700 ease-in-out delay-150";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default function ApercuCartePage({ searchParams }: PageProps) {
  const carried = use(searchParams);
  const isForSomeoneElse = carried.pour !== "moi";
  // Minted once here (not at /paiement) so the barcode on the card the
  // visitor is looking at is the exact code they'll get at the end of
  // checkout. Starts from whatever the URL already carries (identical on
  // server and client, so hydration matches) and only falls back to a fresh
  // Math.random() reference client-side, after mount — generating it inline
  // during render would make the server and the hydrating client mint two
  // different random codes and desync the "Voir le récapitulatif" href.
  const [code, setCode] = useState(carried.code);
  useEffect(() => {
    // Minting a random value has to happen post-mount, client-only, or it
    // would re-run with a different Math.random() result during hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!code) setCode(randomReference());
  }, [code]);

  const [colorwayId, setColorwayId] = useState<CardColorwayId>(
    isCardColorwayId(carried.couleur) ? carried.couleur : "rose",
  );

  const carriedWithCode = { ...carried, ...(code && { code }), couleur: colorwayId };
  const chosenPack = getPackById(carried.pack);

  const backHref =
    carried.mode !== "retrait"
      ? `/quand-envoyer${buildQuery(carried)}`
      : isForSomeoneElse
        ? `/signature${buildQuery(carried)}`
        : `/vos-coordonnees${buildQuery(carried)}`;

  // The scene wrapper stays permanently sized to the full viewport (`inset-0`)
  // — before AND after landing — so the WebGL canvas itself never resizes
  // and R3F never has to recompute the camera's aspect/frustum mid-animation.
  // "Docking" into `slotRef`'s embedded position/size is done entirely with
  // a `transform: translate() scale()` on top of that fixed-size box: a pure
  // compositor operation on the already-rendered pixels, so the 3D content
  // itself never re-renders during the shrink. Resizing the real DOM box
  // instead (the previous approach) meant R3F's ResizeObserver had to catch
  // up with the box's size on every animation frame, and any frame where the
  // renderer's aspect lagged the CSS box's true size for even a moment would
  // show the composition sitting at the wrong spot within the canvas — read,
  // from the outside, as the card suddenly dropping before re-settling.
  const slotRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [landed, setLanded] = useState(false);

  // Uniform "contain" scale (never stretches, so the 3D content keeps its
  // proportions) that maps the always-fullscreen wrapper onto `slotRef`'s
  // real rect, plus the translate that recenters it there.
  const computeDockTransform = () => {
    const slot = slotRef.current;
    if (!slot) return null;
    const target = slot.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const scale = Math.min(target.width / viewportW, target.height / viewportH);
    return {
      x: target.left + target.width / 2 - viewportW / 2,
      y: target.top + target.height / 2 - viewportH / 2,
      scale,
    };
  };

  const dockScene = () => {
    const scene = sceneRef.current;
    const transform = computeDockTransform();
    if (!scene || !transform) return;
    gsap.to(scene, { ...transform, duration: DOCK_DURATION, ease: "power2.inOut" });
  };

  useEffect(() => {
    if (!landed) return;
    // Keeps the docked scene glued to its slot's real position/size across
    // resizes and orientation changes — snaps to the new transform, doesn't
    // replay the dock tween.
    const onResize = () => {
      const scene = sceneRef.current;
      const transform = computeDockTransform();
      if (!scene || !transform) return;
      gsap.set(scene, transform);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [landed]);

  if (!isOrderComplete(carried)) {
    return (
      <FlowScreen backHref="/pour-qui">
        <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
          Aperçu de la carte
        </h1>
        <OrderExpired />
      </FlowScreen>
    );
  }

  const bottomRevealClass = `${CHROME_REVEAL_TRANSITION} ${
    landed ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
  }`;

  return (
    <>
      <FlowScreen backHref={backHref} carried={carried} fillViewport revealed={landed}>
        {/* Empty in-flow placeholder — reserves the scene's real embedded
            position/size so the fixed overlay below has a rect to dock into. */}
        <div ref={slotRef} className="min-h-0 w-full flex-1" />

        <div className={`flex shrink-0 flex-col items-center gap-2 ${bottomRevealClass}`}>
          <ColorSwatchPicker value={colorwayId} onChange={setColorwayId} />
          <p className="text-center font-sans text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            Choisissez votre couleur
          </p>
        </div>

        <Button
          href={`/recapitulatif${buildQuery(carriedWithCode)}`}
          size="lg"
          className={`w-[min(92vw,34rem)] shrink-0 ${bottomRevealClass}`}
        >
          Voir le récapitulatif
        </Button>
      </FlowScreen>

      {/* Covers the full viewport (above the header) until the card lands,
          then docks into `slotRef`'s position — see `dockScene`. */}
      <div ref={sceneRef} className="fixed inset-0 z-40 touch-none">
        {code && (
          <GiftCardLandingScene
            message={isForSomeoneElse ? carried.message : undefined}
            signature={isForSomeoneElse ? carried.signature : undefined}
            code={code}
            colorwayId={colorwayId}
            occasion={carried.message?.trim() || DEFAULT_OCCASION}
            from={[carried.buyer_prenom, carried.buyer_nom].filter(Boolean).join(" ")}
            amountLabel={chosenPack ? "SERVICES" : "AMOUNT"}
            amount={chosenPack ? chosenPack.label : formatFcfa(carried.amount)}
            onLanded={() => {
              setLanded(true);
              dockScene();
            }}
          />
        )}
      </div>
    </>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import * as THREE from "three";
import {
  CARD_DEPTH as DIGITAL_CARD_DEPTH,
  CARD_HEIGHT as DIGITAL_CARD_HEIGHT,
  CARD_WIDTH as DIGITAL_CARD_WIDTH,
  GiftCardMesh,
  TurntableControls,
} from "@/components/canvas/gift-card-scene";
import {
  CARD_DEPTH as RECAP_CARD_DEPTH,
  CARD_HEIGHT as RECAP_CARD_HEIGHT,
  CARD_WIDTH as RECAP_CARD_WIDTH,
  RecapCardMesh,
} from "@/components/canvas/gift-card-recap-scene";
import { CARD_SLOT, TEMPLATE_H, TEMPLATE_W } from "@/lib/three/gift-card-recap-texture";
import { CARD_COLORWAYS, type CardColorwayId } from "@/lib/three/gift-card-colors";

gsap.registerPlugin(useGSAP);

/**
 * Converts CARD_SLOT (a rect in the recap texture's TEMPLATE_W×TEMPLATE_H
 * pixel space) into the recap mesh's local, origin-centered, Y-up world
 * space — so the digital card can dock exactly on the placeholder instead of
 * a hand-guessed position. Canvas y grows downward; local y grows upward,
 * hence the sign flip on the vertical axis.
 */
function slotToLocal() {
  const centerPxX = CARD_SLOT.x + CARD_SLOT.w / 2;
  const centerPxY = CARD_SLOT.y + CARD_SLOT.h / 2;
  return {
    x: (centerPxX / TEMPLATE_W - 0.5) * RECAP_CARD_WIDTH,
    y: (0.5 - centerPxY / TEMPLATE_H) * RECAP_CARD_HEIGHT,
    w: (CARD_SLOT.w / TEMPLATE_W) * RECAP_CARD_WIDTH,
    h: (CARD_SLOT.h / TEMPLATE_H) * RECAP_CARD_HEIGHT,
  };
}

const SLOT = slotToLocal();
// Uniform "contain" fit — the min of the two axis ratios — so the digital
// card's own aspect ratio (close to, but not pixel-identical to, the slot's)
// never stretches; it just sits with a hair of slack on one axis.
const DOCK_SCALE = Math.min(SLOT.w / DIGITAL_CARD_WIDTH, SLOT.h / DIGITAL_CARD_HEIGHT);
// A hair off the recap front face so the two don't z-fight, plus half the
// (scaled) digital card's own thickness — the two face meshes sit symmetric
// around the group's own origin, so this offset is what actually meets that
// surface regardless of which face ends up nearest it (see DOCK_ROTATION_Y).
const DOCK_Z = RECAP_CARD_DEPTH / 2 + 0.002 + (DIGITAL_CARD_DEPTH * DOCK_SCALE) / 2;

const START_POSITION: [number, number, number] = [0, 0.3, 1.5];
const DOCK_POSITION: [number, number, number] = [SLOT.x, SLOT.y, DOCK_Z];
// How high above the straight line between start and dock the card arcs at
// the midpoint of its flight — a real toss, not a ruler-straight glide.
// Kept modest on purpose: the card is still close to its full anticipation
// size for most of the rise (see the scale tween below), and its own
// unscaled height is close to the support's — too high an arc lifts that
// still-large card's top edge above the support's own top edge, which reads
// as the card poking out through the support rather than floating in front
// of it.
const ARC_HEIGHT = 0.18;
// No extra full spins on top of the mandatory half-turn below — simplified
// to the minimum rotation possible (0.5 total) while still landing on the
// card's back face.
const SPIN_TURNS = 0;
// An extra half turn on top of the full spins: the card must come to rest
// showing its BACK face to the viewer (message/signature/ribbon), with the
// FRONT face — the one that duplicates the support's own branding — pressed
// against the support instead. Rotating the whole group by 180° is the same
// transform as the camera orbiting around a stationary card (both just swap
// viewpoint by π), so the back mesh's existing "straight, unmirrored"
// texture (see gift-card-texture.ts) still reads correctly here. Because
// it's an odd multiple of π, the group is always back to an axis-aligned
// orientation whenever this rotation completes — which the impact squash
// below relies on to stay a clean width/height squash instead of a shear.
const DOCK_ROTATION_Y = -Math.PI * (2 * SPIN_TURNS + 1);

// Anticipation + flight are the "before the card is apposed on the support"
// portion the whole scene is judged by — net 2x their original, snappier cut
// (3x slower, then sped back up by 50%) so the throw still reads as
// deliberate without dragging. Impact's squash/settle stay quick: that beat
// should still land with a punch.
const ANTICIPATION_DURATION = 0.5 * 2;
const FLIGHT_DURATION = 2.2 * 2;
const SQUASH_DURATION = 0.1;
const SETTLE_DURATION = 0.42;
const IMPACT_TIME = ANTICIPATION_DURATION + FLIGHT_DURATION;

// The support's own reveal (rotation + dezoom, see SupportReveal below) —
// timed to finish well before the card actually touches down.
const REVEAL_DURATION = 2.0;
const SUPPORT_SPIN = Math.PI * 2;
// Kept modest on purpose: at this tight a zoom, the support's own full
// height nearly fills the frame, so the digital card's comparably-tall
// anticipation pose — floating in front of it at the very same time (see
// LandingCardGroup) — has almost no headroom before it visually exceeds the
// support's own top/bottom edges. That reads as the card poking out through
// the support well before either animation is finished settling. A less
// aggressive zoom leaves enough margin in frame for both to coexist.
const SUPPORT_ZOOM_IN_FACTOR = 1.35;

// A second, smaller zoom-in fired once the card actually lands — the intro
// reveal above settles back at the base camera zoom (tuned for the
// fullscreen intro), which then reads as too far-out once the scene has
// docked down into its much smaller embedded slot: the visitor had to
// scroll-zoom in by hand just to inspect the card comfortably. This closes
// that gap on its own instead, without touching the intro's own zoom curve.
const DOCK_ZOOM_FACTOR = 1.5;
const DOCK_ZOOM_DURATION = 0.9;

// The impact glow ring's soft white-to-transparent radial sprite, generated
// once and reused, tinted with the card's own accent color and additive
// blending for a burst of light on contact.
function useGlowTexture() {
  return useMemo(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.55, "rgba(255,255,255,0.4)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }, []);
}

const RING_RADIUS = Math.max(SLOT.w, SLOT.h) * 1.2;
// Sits between the recap card's own surface and the docked digital card, so
// it reads as light on the support rather than in front of the card.
const RING_Z = RECAP_CARD_DEPTH / 2 + 0.0015;

type SupportRevealProps = {
  supportRef: React.RefObject<THREE.Group | null>;
  /** Gated on the same signal that starts the card's own flight (its texture finishing load) — otherwise the reveal fires the instant the scene mounts, well before the card is ready to move, and the two read as sequential instead of simultaneous. */
  ready: boolean;
  /** Fires the post-landing comfort zoom-in (see DOCK_ZOOM_FACTOR) once the card has docked. */
  landed: boolean;
};

/** The support's own entrance: it spins a full turn while the camera pulls back from a tight dezoom, running at the same time as (and settling well before) the digital card's own flight onto it. */
function SupportReveal({ supportRef, ready, landed }: SupportRevealProps) {
  const { camera } = useThree();

  useGSAP(
    () => {
      const support = supportRef.current;
      if (!ready || !support) return;
      const targetZoom = camera.zoom;

      // "inOut", not "out" — same reasoning as the card's own wind-up: the
      // support and camera are both fully at rest the instant before this
      // starts, and an "out" ease's velocity is highest right at t=0, which
      // reads as an instant snap into a full-speed spin/dezoom instead of a
      // motion that visibly gathers speed.
      gsap
        .timeline()
        .fromTo(support.rotation, { y: -SUPPORT_SPIN }, { y: 0, duration: REVEAL_DURATION, ease: "power3.inOut" }, 0)
        .fromTo(
          camera,
          { zoom: targetZoom * SUPPORT_ZOOM_IN_FACTOR },
          {
            zoom: targetZoom,
            duration: REVEAL_DURATION,
            ease: "power3.inOut",
            onUpdate: () => camera.updateProjectionMatrix(),
          },
          0,
        );
    },
    { dependencies: [ready] },
  );

  // Runs after the reveal above has long since settled back at the base
  // zoom, so this is another motion starting from rest — "inOut", same
  // reasoning as everywhere else in this file.
  useGSAP(
    () => {
      if (!landed) return;
      gsap.to(camera, {
        zoom: camera.zoom * DOCK_ZOOM_FACTOR,
        duration: DOCK_ZOOM_DURATION,
        ease: "power2.inOut",
        onUpdate: () => camera.updateProjectionMatrix(),
      });
    },
    { dependencies: [landed] },
  );

  return null;
}

type LandingCardGroupProps = {
  message: string | undefined;
  signature: string | undefined;
  code: string;
  colorwayId: CardColorwayId;
  /** Fired once the card's textures are ready — lets the parent flip the single `ready` flag that starts the support's own reveal and this card's own flight in the very same render, instead of on mount. */
  onCardReady: () => void;
  /** The same flag passed to `SupportReveal` — reading it here instead of tracking a second, separate "ready" state keeps both animations gated on one state transition instead of two that could resolve a render apart. */
  ready: boolean;
  /** Fired the instant the card touches the support — drives the support's own reaction (shake) independently of the card's own settle. */
  onImpact: () => void;
  onLanded: () => void;
};

/** The digital card, animated from a floating "presentation" pose down onto the recap card's slot, with a glow/shake sold at the moment of contact. */
function LandingCardGroup({ message, signature, code, colorwayId, onCardReady, ready, onImpact, onLanded }: LandingCardGroupProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const glowTexture = useGlowTexture();
  const colorway = CARD_COLORWAYS[colorwayId];

  useGSAP(
    () => {
      if (!ready || !groupRef.current) return;
      const group = groupRef.current;
      const ring = ringRef.current;
      const ringMaterial = ring?.material as THREE.MeshBasicMaterial | undefined;
      const apexY = Math.max(START_POSITION[1], DOCK_POSITION[1]) + ARC_HEIGHT;

      const timeline = gsap.timeline({ onComplete: onLanded });

      // Wind-up: a small pull back and up before the throw, like a real toss.
      // Eased "inOut", not "out" — the card is sitting perfectly still the
      // instant before this tween starts, and an "out" ease has its highest
      // velocity at t=0, which reads as an instant snap into motion rather
      // than a gathering pull-back. "inOut" ramps up from zero velocity too.
      timeline
        .to(
          group.position,
          { x: START_POSITION[0] - 0.12, y: START_POSITION[1] + 0.18, z: START_POSITION[2] + 0.25, duration: ANTICIPATION_DURATION, ease: "power2.inOut" },
          0,
        )
        .to(group.scale, { x: 1.08, y: 1.08, z: 1.08, duration: ANTICIPATION_DURATION, ease: "power2.inOut" }, 0);

      // Flight: arcs up and over on the way down, spinning the whole way.
      // Horizontal travel and spin ease "in", not "inOut" — they keep
      // building speed for the whole flight instead of leveling off
      // mid-arc, so the card is visibly accelerating right up to the
      // instant it touches the support. The fall itself steps that up
      // further (power3, not power2) for a sharper last-moment lunge into
      // contact; the rise stays "out" (decelerating toward the apex) since
      // that's the one leg of the arc that's still physically slowing down,
      // like a real toss losing momentum against gravity.
      timeline
        .to(group.position, { x: DOCK_POSITION[0], z: DOCK_POSITION[2], duration: FLIGHT_DURATION, ease: "power2.in" }, ANTICIPATION_DURATION)
        .to(group.position, { y: apexY, duration: FLIGHT_DURATION * 0.45, ease: "sine.out" }, ANTICIPATION_DURATION)
        .to(
          group.position,
          { y: DOCK_POSITION[1], duration: FLIGHT_DURATION * 0.55, ease: "power3.in" },
          ANTICIPATION_DURATION + FLIGHT_DURATION * 0.45,
        )
        .to(group.rotation, { y: DOCK_ROTATION_Y, duration: FLIGHT_DURATION, ease: "power2.in" }, ANTICIPATION_DURATION)
        .to(
          // Front-loaded ("out"), not "power2.in" — a back-loaded shrink
          // stays close to full (anticipation) size well into the flight,
          // while the card is still rising toward the arc's apex. Since the
          // card's own unscaled height is close to the support's, that
          // still-large card's top edge pokes up past the support's own top
          // edge during the rise — reading as the card poking out through
          // the support rather than floating gracefully in front of it.
          // Shrinking quickly right from the start (paired with the reduced
          // ARC_HEIGHT above) keeps the card's silhouette inside the
          // support's bounds for the whole flight, at every rotation angle.
          group.scale,
          { x: DOCK_SCALE, y: DOCK_SCALE, z: DOCK_SCALE, duration: FLIGHT_DURATION, ease: "sine.out" },
          ANTICIPATION_DURATION,
        );

      // Impact: squash on contact, a bright glow burst on the support, a
      // shake fired up to the support itself, then an elastic settle.
      timeline
        .to(group.scale, { x: DOCK_SCALE * 1.18, y: DOCK_SCALE * 0.78, duration: SQUASH_DURATION, ease: "power2.out" }, IMPACT_TIME)
        .to(
          group.scale,
          { x: DOCK_SCALE, y: DOCK_SCALE, z: DOCK_SCALE, duration: SETTLE_DURATION, ease: "elastic.out(1, 0.55)" },
          IMPACT_TIME + SQUASH_DURATION,
        )
        .call(() => onImpact(), [], IMPACT_TIME);

      if (ring && ringMaterial) {
        timeline
          .set(ring.scale, { x: 0.25, y: 0.25 }, IMPACT_TIME)
          .set(ringMaterial, { opacity: 0.85 }, IMPACT_TIME)
          .to(ring.scale, { x: 1, y: 1, duration: 0.55, ease: "power2.out" }, IMPACT_TIME)
          .to(ringMaterial, { opacity: 0, duration: 0.55, ease: "power2.out" }, IMPACT_TIME);
      }
    },
    { dependencies: [ready] },
  );

  return (
    <>
      <group ref={groupRef} position={START_POSITION}>
        <GiftCardMesh
          message={message}
          signature={signature}
          code={code}
          colorwayId={colorwayId}
          onReady={onCardReady}
        />
      </group>
      {glowTexture && (
        <mesh ref={ringRef} position={[SLOT.x, SLOT.y, RING_Z]} scale={[0, 0, 1]}>
          <circleGeometry args={[RING_RADIUS, 32]} />
          <meshBasicMaterial
            map={glowTexture}
            color={colorway.edgeColor}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </>
  );
}

type GiftCardLandingSceneProps = {
  message: string | undefined;
  signature: string | undefined;
  code: string;
  colorwayId: CardColorwayId;
  occasion: string;
  from: string;
  amountLabel: string;
  amount: string;
  /** Fired once the card has fully docked onto the support — lets the page react (e.g. shrink the fullscreen scene back into its embedded slot and reveal the rest of the chrome) independently of this component's own internal `landed` state, which only gates the orbit controls. */
  onLanded?: () => void;
};

const DESKTOP_ZOOM = 110;
const MOBILE_ZOOM = DESKTOP_ZOOM * 0.8;

function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    setIsMobile(query.matches);
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

/**
 * Composites the digital gift card onto the printable recap card: on mount,
 * the support itself spins in while the camera dezooms from a tight
 * close-up, then the digital card spins in from a large floating
 * "presentation" pose and settles precisely onto the recap card's
 * `CARD_SLOT` placeholder (see `slotToLocal`). Orbit/zoom is withheld until
 * it lands — fighting a user-driven camera against the scripted landing
 * looks chaotic — then behaves exactly like the standalone previews (yields
 * on drag, resumes auto-rotate after).
 */
export function GiftCardLandingScene({
  message,
  signature,
  code,
  colorwayId,
  occasion,
  from,
  amountLabel,
  amount,
  onLanded,
}: GiftCardLandingSceneProps) {
  const isMobile = useIsMobileViewport();
  const [landed, setLanded] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const supportRef = useRef<THREE.Group>(null);

  // A small "thud" on the support itself, fired the instant the card makes
  // contact — separate from the card's own settle so the support reacts to
  // being landed on rather than just watching the card animate over it.
  const shakeSupport = () => {
    const support = supportRef.current;
    if (!support) return;
    gsap
      .timeline()
      .to(support.position, { y: "+=0.035", duration: 0.06, ease: "power1.out" })
      .to(support.position, { y: "-=0.035", duration: 0.32, ease: "elastic.out(1, 0.4)" });
  };

  return (
    <div className="h-full w-full touch-none">
      <Canvas
        flat
        orthographic
        dpr={[1, 2]}
        camera={{ position: [0, 0.3, 10], zoom: isMobile ? MOBILE_ZOOM : DESKTOP_ZOOM, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <group ref={supportRef}>
          <RecapCardMesh occasion={occasion} from={from} amountLabel={amountLabel} amount={amount} colorwayId={colorwayId} />
        </group>
        <SupportReveal supportRef={supportRef} ready={cardReady} landed={landed} />
        <LandingCardGroup
          message={message}
          signature={signature}
          code={code}
          colorwayId={colorwayId}
          ready={cardReady}
          onCardReady={() => setCardReady(true)}
          onImpact={shakeSupport}
          onLanded={() => {
            setLanded(true);
            onLanded?.();
          }}
        />
        {landed && <TurntableControls />}
      </Canvas>
    </div>
  );
}

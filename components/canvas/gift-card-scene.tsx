"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import * as THREE from "three";
import {
  CARD_ASPECT,
  drawBackFace,
  drawFrontFace,
  loadImage,
  readFontFamilies,
  type FontFamilies,
} from "@/lib/three/gift-card-texture";
import { CARD_COLORWAYS, type CardColorwayId } from "@/lib/three/gift-card-colors";

gsap.registerPlugin(useGSAP);

export const CARD_WIDTH = 3.2;
export const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT;
export const CARD_DEPTH = 0.0275;
const CORNER_RADIUS = (96 / 1712) * CARD_WIDTH * 1.3;
const TEXTURE_W = 1536;
const TEXTURE_H = Math.round(TEXTURE_W / CARD_ASPECT);

/** A rounded-rect outline, centered at the origin — shared by the front/back face plates and the edge slab so all three line up exactly. */
function roundedRectShape(width: number, height: number, radius: number) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x, y + radius);
  shape.lineTo(x, y + height - radius);
  shape.quadraticCurveTo(x, y + height, x + radius, y + height);
  shape.lineTo(x + width - radius, y + height);
  shape.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
  shape.lineTo(x + width, y + radius);
  shape.quadraticCurveTo(x + width, y, x + width - radius, y);
  shape.lineTo(x + radius, y);
  shape.quadraticCurveTo(x, y, x, y + radius);
  return shape;
}

/**
 * three.js's ShapeGeometry writes raw local (x, y) as the uv attribute
 * ("world uvs", per its own source comment) instead of normalizing to the
 * shape's bounding box — fine for a unit shape, but ours spans several world
 * units, so a texture map would only show through the tiny (-1..1) sliver
 * near the origin and clamp-repeat everywhere else. Rewriting uv here to the
 * standard 0..1 range is what makes `map` line up with the actual face.
 */
function buildFaceGeometry(width: number, height: number, radius: number) {
  const geometry = new THREE.ShapeGeometry(roundedRectShape(width, height, radius), 24);
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, position.getX(i) / width + 0.5, position.getY(i) / height + 0.5);
  }
  uv.needsUpdate = true;
  return geometry;
}

export type GiftCardMeshProps = {
  message: string | undefined;
  signature: string | undefined;
  code: string;
  colorwayId: CardColorwayId;
  /** Fires once both face textures are ready — lets a parent (e.g. the landing animation) wait for a real card instead of an empty group. */
  onReady?: () => void;
};

/**
 * Built from three pieces instead of a single boxy mesh: a front plate and a
 * back plate (identical rounded-rect geometry, the back one physically
 * rotated 180° around Y so it faces -z and reads correctly to a viewer who's
 * walked around — no texture-mirroring tricks needed) sandwiching a thin
 * edge slab for the cardstock thickness. A single extruded RoundedBox can't
 * do this: three.js's ExtrudeGeometry puts both caps in one material group,
 * so front and back can never take different textures on that geometry.
 */
export function GiftCardMesh({ message, signature, code, colorwayId, onReady }: GiftCardMeshProps) {
  const colorway = CARD_COLORWAYS[colorwayId];
  const [frontTexture, setFrontTexture] = useState<THREE.CanvasTexture | null>(null);
  const [backTexture, setBackTexture] = useState<THREE.CanvasTexture | null>(null);

  const faceGeometry = useMemo(
    () => buildFaceGeometry(CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS),
    [],
  );
  const edgeGeometry = useMemo(() => {
    // Slightly shorter than the face-to-face span so its caps sit just
    // behind the face plates instead of exactly coincident with them —
    // coincident coplanar triangles z-fight at oblique viewing angles.
    const depth = CARD_DEPTH - 0.002;
    const geometry = new THREE.ExtrudeGeometry(roundedRectShape(CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS), {
      depth,
      bevelEnabled: false,
      curveSegments: 12,
    });
    geometry.translate(0, 0, -depth / 2);
    return geometry;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function build() {
      const fonts: FontFamilies = readFontFamilies();
      await document.fonts.ready;

      const wordmarkSrc = colorway.logo === "light" ? "/images/logo-white.svg" : "/images/logo.svg";
      const [badgeImage, wordmarkImage] = await Promise.all([
        loadImage("/images/gift-card-badge.png").catch(() => null),
        loadImage(wordmarkSrc).catch(() => null),
      ]);
      if (cancelled) return;

      const frontCanvas = document.createElement("canvas");
      frontCanvas.width = TEXTURE_W;
      frontCanvas.height = TEXTURE_H;
      drawFrontFace(frontCanvas, { badgeImage, code, colorway }, fonts);

      const backCanvas = document.createElement("canvas");
      backCanvas.width = TEXTURE_W;
      backCanvas.height = TEXTURE_H;
      drawBackFace(backCanvas, { message, signature, wordmarkImage, colorway }, fonts);

      if (cancelled) return;

      const front = new THREE.CanvasTexture(frontCanvas);
      front.colorSpace = THREE.SRGBColorSpace;
      front.anisotropy = 4;
      front.needsUpdate = true;

      const back = new THREE.CanvasTexture(backCanvas);
      back.colorSpace = THREE.SRGBColorSpace;
      back.anisotropy = 4;
      back.needsUpdate = true;

      setFrontTexture(front);
      setBackTexture(back);
      onReady?.();
    }

    build();
    return () => {
      cancelled = true;
    };
    // onReady is fired imperatively, not tracked as a dependency — most
    // callers pass an inline function, which would otherwise re-run this
    // (and rebuild both textures) on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, signature, code, colorway]);

  if (!frontTexture || !backTexture) return null;

  return (
    <group>
      {/*
        Everything here is meshBasicMaterial (unlit) on purpose, edge
        included: meshStandardMaterial — even at moderate light intensity —
        produced a stray bright streak across the rounded top/bottom bands
        at oblique angles (looked like a detached duplicate band; reproduced
        with the edge slab and back face removed, so it traced to lit
        shading, not z-fighting). The card art is a flat, pre-lit design
        already baked from Figma — meshBasic just shows those exact pixels,
        which is both the fix and the more correct choice: colors stay
        faithful to the source and never dim or blow out under scene
        lighting, on any face.
      */}
      <mesh geometry={edgeGeometry}>
        <meshBasicMaterial color={colorway.edgeColor} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={faceGeometry} position={[0, 0, CARD_DEPTH / 2]}>
        <meshBasicMaterial map={frontTexture} side={THREE.FrontSide} polygonOffset polygonOffsetFactor={-4} polygonOffsetUnits={-4} />
      </mesh>
      <mesh geometry={faceGeometry} position={[0, 0, -CARD_DEPTH / 2]} rotation={[0, Math.PI, 0]}>
        <meshBasicMaterial map={backTexture} side={THREE.FrontSide} polygonOffset polygonOffsetFactor={-4} polygonOffsetUnits={-4} />
      </mesh>
    </group>
  );
}

const IDLE_SPEED = 4.5;

/**
 * Gentle idle auto-rotate that yields the moment the visitor grabs the card,
 * and picks back up a couple of seconds after they let go.
 *
 * On mount (this is also what the landing scene mounts the instant its own
 * scripted throw-and-dock finishes), rotation stays off for a short beat and
 * then ramps its speed up from zero instead of starting at full cruising
 * speed on its very first frame — three.js's `autoRotate` applies a constant
 * angular velocity with no ramp of its own, so an immediate full-speed start
 * right on the heels of the scripted settle reads as a hard cut into a
 * different, mechanical motion rather than the same object continuing to
 * rest. The resume after a user drag skips this beat/ramp on purpose — by
 * then the visitor has already established the card is theirs to turn.
 */
export function TurntableControls() {
  const [autoRotate, setAutoRotate] = useState(false);
  const [autoRotateSpeed, setAutoRotateSpeed] = useState(0);
  const resumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
  }, []);

  useGSAP(() => {
    const speed = { value: 0 };
    gsap
      .timeline({ delay: 0.6 })
      .call(() => setAutoRotate(true))
      .to(
        speed,
        { value: IDLE_SPEED, duration: 1.2, ease: "power2.inOut", onUpdate: () => setAutoRotateSpeed(speed.value) },
        0,
      );
  }, []);

  return (
    <OrbitControls
      makeDefault
      enablePan={false}
      enableZoom
      minZoom={80}
      maxZoom={220}
      minPolarAngle={Math.PI / 3.4}
      maxPolarAngle={Math.PI - Math.PI / 3.4}
      autoRotate={autoRotate}
      autoRotateSpeed={autoRotateSpeed}
      onStart={() => {
        if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
        setAutoRotate(false);
      }}
      onEnd={() => {
        setAutoRotateSpeed(IDLE_SPEED);
        resumeTimeout.current = setTimeout(() => setAutoRotate(true), 2500);
      }}
    />
  );
}

type GiftCard3DPreviewProps = {
  message: string | undefined;
  signature: string | undefined;
  code: string;
  colorwayId: CardColorwayId;
};

/**
 * Transparent stage for the composed card — the page's own WatercolorBackground
 * shows through around (and, since there's no backdrop plane, through) the
 * card, so this reads as part of the page rather than a separate white panel
 * dropped on top of it. The visitor can spin it all the way around via
 * drag/touch to see both faces.
 *
 * Orthographic camera, not perspective: with the camera close enough for
 * the card to read as large in a short/wide container, a perspective lens
 * makes the near edge swing much closer to the camera as the card turns
 * past ~70°, magnifying it enough to poke past the frame — the card looked
 * "cropped" at those angles. Orthographic projection has no such
 * distance-based magnification, so apparent size stays constant through
 * the full turn regardless of how tight the container is.
 */
const DESKTOP_ZOOM = 130;
// Orthographic zoom scales the card's apparent size independently of the
// canvas's own pixel dimensions — a narrower mobile viewport doesn't shrink
// the card on its own, so the mobile-only 20% reduction has to come from
// lowering zoom (zooming out), not from anything CSS can do here.
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

export function GiftCard3DPreview({ message, signature, code, colorwayId }: GiftCard3DPreviewProps) {
  const isMobile = useIsMobileViewport();

  return (
    <div className="h-full w-full touch-none">
      <Canvas
        flat
        orthographic
        dpr={[1, 2]}
        camera={{ position: [0, 0.3, 10], zoom: isMobile ? MOBILE_ZOOM : DESKTOP_ZOOM, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <GiftCardMesh message={message} signature={signature} code={code} colorwayId={colorwayId} />
        <TurntableControls />
      </Canvas>
    </div>
  );
}

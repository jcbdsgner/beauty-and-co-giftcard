"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  RECAP_CARD_ASPECT,
  drawRecapBackFace,
  drawRecapFrontFace,
  type RecapBackData,
  type RecapFrontData,
} from "@/lib/three/gift-card-recap-texture";
import { loadImage, readFontFamilies, type FontFamilies } from "@/lib/three/gift-card-texture";
import { CARD_COLORWAYS, type CardColorwayId } from "@/lib/three/gift-card-colors";

/**
 * 3D preview for the *printable* recap card (Figma node 9803:10392 — recto
 * "GIFT CARD" template / verso occasion+FROM/AMOUNT summary), built the same
 * way as `GiftCard3DPreview` in gift-card-scene.tsx: two textured plates
 * sandwiching a thin edge slab, unlit materials so the flat pre-lit Figma
 * art reads with faithful color at any angle.
 *
 * `RecapCardMesh` is also reused directly by `gift-card-landing-scene.tsx`,
 * which docks a `GiftCardMesh` onto this card's `CARD_SLOT` placeholder.
 */

export const CARD_HEIGHT = 3.2;
export const CARD_WIDTH = CARD_HEIGHT * RECAP_CARD_ASPECT;
export const CARD_DEPTH = 0.0275;
const TEXTURE_H = 1536;
const TEXTURE_W = Math.round(TEXTURE_H * RECAP_CARD_ASPECT);

function buildFaceGeometry(width: number, height: number) {
  const geometry = new THREE.PlaneGeometry(width, height);
  return geometry;
}

export type RecapCardMeshProps = {
  occasion: string;
  from: string;
  amountLabel: string;
  amount: string;
  colorwayId: CardColorwayId;
};

export function RecapCardMesh({ occasion, from, amountLabel, amount, colorwayId }: RecapCardMeshProps) {
  const colorway = CARD_COLORWAYS[colorwayId];
  const [frontTexture, setFrontTexture] = useState<THREE.CanvasTexture | null>(null);
  const [backTexture, setBackTexture] = useState<THREE.CanvasTexture | null>(null);

  const faceGeometry = useMemo(() => buildFaceGeometry(CARD_WIDTH, CARD_HEIGHT), []);
  const edgeGeometry = useMemo(() => {
    const depth = CARD_DEPTH - 0.002;
    const geometry = new THREE.BoxGeometry(CARD_WIDTH, CARD_HEIGHT, depth);
    return geometry;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function build() {
      const fonts: FontFamilies = readFontFamilies();
      await document.fonts.ready;

      const badgeImage = await loadImage("/images/gift-card-badge.png").catch(() => null);
      if (cancelled) return;

      const frontCanvas = document.createElement("canvas");
      frontCanvas.width = TEXTURE_W;
      frontCanvas.height = TEXTURE_H;
      const frontData: RecapFrontData = { badgeImage, colorway };
      drawRecapFrontFace(frontCanvas, frontData, fonts);

      const backCanvas = document.createElement("canvas");
      backCanvas.width = TEXTURE_W;
      backCanvas.height = TEXTURE_H;
      const backData: RecapBackData = { badgeImage, occasion, from, amountLabel, amount, colorway };
      drawRecapBackFace(backCanvas, backData, fonts);

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
    }

    build();
    return () => {
      cancelled = true;
    };
  }, [occasion, from, amountLabel, amount, colorway]);

  if (!frontTexture || !backTexture) return null;

  return (
    <group>
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

function TurntableControls() {
  const [autoRotate, setAutoRotate] = useState(true);
  const resumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
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
      autoRotateSpeed={4.5}
      onStart={() => {
        if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
        setAutoRotate(false);
      }}
      onEnd={() => {
        resumeTimeout.current = setTimeout(() => setAutoRotate(true), 2500);
      }}
    />
  );
}

type GiftCardRecap3DPreviewProps = {
  occasion: string;
  from: string;
  amountLabel: string;
  amount: string;
  colorwayId: CardColorwayId;
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

export function GiftCardRecap3DPreview({ occasion, from, amountLabel, amount, colorwayId }: GiftCardRecap3DPreviewProps) {
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
        <RecapCardMesh occasion={occasion} from={from} amountLabel={amountLabel} amount={amount} colorwayId={colorwayId} />
        <TurntableControls />
      </Canvas>
    </div>
  );
}

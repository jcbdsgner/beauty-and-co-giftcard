"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  CARD_ASPECT,
  drawBackFace,
  drawFrontFace,
  loadImage,
  readFontFamilies,
  type FontFamilies,
} from "@/lib/three/gift-card-texture";

const CARD_WIDTH = 3.2;
const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT;
const CARD_DEPTH = 0.0275;
const CORNER_RADIUS = (96 / 1712) * CARD_WIDTH * 1.3;
const EDGE_COLOR = "#e6cfc9";
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

type GiftCardMeshProps = {
  message: string | undefined;
  signature: string | undefined;
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
function GiftCardMesh({ message, signature }: GiftCardMeshProps) {
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

      const [badgeImage, wordmarkImage] = await Promise.all([
        loadImage("/images/gift-card-badge.png").catch(() => null),
        loadImage("/images/logo.svg").catch(() => null),
      ]);
      if (cancelled) return;

      const frontCanvas = document.createElement("canvas");
      frontCanvas.width = TEXTURE_W;
      frontCanvas.height = TEXTURE_H;
      drawFrontFace(frontCanvas, { badgeImage }, fonts);

      const backCanvas = document.createElement("canvas");
      backCanvas.width = TEXTURE_W;
      backCanvas.height = TEXTURE_H;
      drawBackFace(backCanvas, { message, signature, wordmarkImage }, fonts);

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
  }, [message, signature]);

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
        <meshBasicMaterial color={EDGE_COLOR} side={THREE.DoubleSide} />
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

/** Gentle idle auto-rotate that yields the moment the visitor grabs the card, and picks back up a couple of seconds after they let go. */
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

type GiftCard3DPreviewProps = {
  message: string | undefined;
  signature: string | undefined;
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
export function GiftCard3DPreview({ message, signature }: GiftCard3DPreviewProps) {
  return (
    <div className="h-full w-full touch-none">
      <Canvas
        flat
        orthographic
        dpr={[1, 2]}
        camera={{ position: [0, 0.3, 10], zoom: 130, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <GiftCardMesh message={message} signature={signature} />
        <TurntableControls />
      </Canvas>
    </div>
  );
}

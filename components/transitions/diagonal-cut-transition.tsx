"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap/register";

type DiagonalCutTransitionProps = {
  frameImage: string | null;
  reduceMotion: boolean;
  onComplete: () => void;
};

/**
 * Reveal transition for the video intro gate (components/sections/intro-gate.tsx).
 * Splits the frozen frame along a corner-to-corner diagonal — which always
 * passes through the exact center of the screen — into two triangular
 * halves, then flings them apart toward opposite corners: a hard cut instead
 * of a soft dissolve.
 *
 * Pure CSS clip-path + transform, no WebGL/Canvas: nothing to pre-warm and
 * nothing that can lag behind the moment it's needed.
 *
 * To reuse elsewhere: capture a snapshot of whatever should be cut away as a
 * data URL (`canvas.toDataURL(...)` from a 2D `drawImage` works fine —
 * replicate any CSS object-fit/transform on the source so the capture
 * doesn't visually pop), then render this with that image once the reveal
 * should start.
 */
export function DiagonalCutTransition({ frameImage, reduceMotion, onComplete }: DiagonalCutTransitionProps) {
  const topLeftRef = useRef<HTMLDivElement>(null);
  const bottomRightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const topLeft = topLeftRef.current;
    const bottomRight = bottomRightRef.current;
    if (!frameImage || !topLeft || !bottomRight) return;

    const duration = reduceMotion ? 0.3 : 0.85;
    const tl = gsap.timeline({ onComplete });
    tl.set([topLeft, bottomRight], { xPercent: 0, yPercent: 0 })
      .to(topLeft, { xPercent: -115, yPercent: -115, duration, ease: "power2.in" }, 0)
      .to(bottomRight, { xPercent: 115, yPercent: 115, duration, ease: "power2.in" }, 0);

    return () => {
      tl.kill();
    };
  }, [frameImage, reduceMotion, onComplete]);

  if (!frameImage) return null;

  const faceStyle = {
    backgroundImage: `url(${frameImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
      {/* Top-left triangle, bounded by the diagonal from the top-right corner
          to the bottom-left corner — flung up-left. */}
      <div
        ref={topLeftRef}
        className="absolute inset-0"
        style={{ ...faceStyle, clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
      />
      {/* Complementary bottom-right triangle — flung down-right. */}
      <div
        ref={bottomRightRef}
        className="absolute inset-0"
        style={{ ...faceStyle, clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
      />
    </div>
  );
}

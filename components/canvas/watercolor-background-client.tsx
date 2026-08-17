"use client";

import dynamic from "next/dynamic";

// `next/dynamic`'s `ssr: false` can't be called directly from a Server
// Component file (app/layout.tsx) — this "use client" wrapper is the
// boundary that lets layout.tsx mount the background without itself
// becoming a client component.
export const WatercolorBackgroundClient = dynamic(
  () => import("@/components/canvas/watercolor-background").then((m) => m.WatercolorBackground),
  { ssr: false },
);

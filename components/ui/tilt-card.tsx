"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type TiltCardProps = {
  children: ReactNode;
  className?: string;
};

/**
 * A flat card that fakes a 3D presence: CSS perspective + a pointer-driven
 * rotateX/rotateY (eased toward the cursor, same damped-follow feel as an
 * R3F mesh tracking `pointer.x/y` in a `useFrame` loop) plus a specular
 * sheen that slides opposite the tilt. No WebGL — it's a real DOM element,
 * so the buttons inside it stay natively clickable.
 */
export function TiltCard({ children, className }: TiltCardProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      target.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: (event.clientY / window.innerHeight) * 2 - 1,
      };
    };
    window.addEventListener("pointermove", handlePointerMove);

    let raf = 0;
    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * 0.12;
      current.current.y += (target.current.y - current.current.y) * 0.12;

      const surface = surfaceRef.current;
      const sheen = sheenRef.current;
      if (surface) {
        const rotateY = current.current.x * 16;
        const rotateX = -current.current.y * 12;
        surface.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      }
      if (sheen) {
        const sheenX = 50 + current.current.x * 35;
        const sheenY = 50 + current.current.y * 35;
        sheen.style.background = `radial-gradient(circle at ${sheenX}% ${sheenY}%, rgba(255,255,255,0.4), transparent 60%)`;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="animate-card-float [perspective:1200px]">
      <div
        ref={surfaceRef}
        className={cn(
          "relative overflow-hidden rounded-[2rem] border border-white/40 [transform-style:preserve-3d]",
          "shadow-[0_30px_60px_-15px_rgba(45,20,20,0.35)]",
          className,
        )}
      >
        <div
          ref={sheenRef}
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          aria-hidden
        />
        {children}
      </div>
    </div>
  );
}

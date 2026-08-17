"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Phase = "idle" | "entering" | "exiting";

const EXIT_MS = 150;

/**
 * Screen-to-screen fade played only on real screen changes (pathname
 * changes), never on the watercolor background — each page portals that
 * into a persistent root above this wrapper (see
 * components/canvas/watercolor-background.tsx), so it sits outside this
 * subtree entirely and is unaffected by the opacity below.
 *
 * Sequential, not an overlapping dissolve: the outgoing screen fades
 * fully out first, then the incoming one fades in — so navigation itself
 * is delayed until the outgoing fade finishes. Clicks on internal links
 * are intercepted in the capture phase (before next/link's own
 * bubble-phase handler runs) and `preventDefault`ed — next/link checks
 * `e.defaultPrevented` and bails, so its own `router.push` never fires.
 * Only once our own exit animation completes do we call `router.push`
 * ourselves; whatever pathname change follows — from that delayed push,
 * or from back/forward navigation we can't intercept — triggers the enter
 * fade on whatever `children` Next hands us next.
 *
 * An earlier version tried to keep the outgoing page's element tree alive
 * in React state so it could stay on screen while fading. That doesn't
 * work under the App Router: the "frozen" tree still contains Next's own
 * router-context consumers, so the instant the navigation's context value
 * updates, React re-renders through it anyway — the outgoing content
 * silently *becomes* the incoming one mid-fade, and every portalled
 * child (the watercolor canvas) unmounts and remounts at that moment
 * instead of staying put, which is what caused a white flash (the canvas
 * briefly resets to its default 300×150 size with nothing behind it).
 * Delaying the navigation instead of freezing content sidesteps that
 * entirely: the background is never disturbed mid-transition, so there's
 * nothing left to flash.
 */
export function ScreenTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("entering");
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Adjusting state when a prop changes (React's documented pattern) rather
  // than an effect, since an effect-driven setState here would commit an
  // extra, visible intermediate render.
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setPhase("entering");
  }

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement).closest("a");
      if (!anchor || anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return; // same screen — no transition

      event.preventDefault();
      setPhase("exiting");
      window.setTimeout(() => {
        router.push(url.pathname + url.search + url.hash);
      }, EXIT_MS);
    }

    // Capture phase: runs before next/link's own bubble-phase click
    // handler, so our preventDefault reaches it in time.
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [router]);

  const handleAnimationEnd = (event: React.AnimationEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (phase === "entering") setPhase("idle");
  };

  const className = phase === "exiting" ? "animate-screen-exit" : phase === "entering" ? "animate-screen-enter" : "";

  // Keyed by pathname so browser back/forward (and any other navigation we
  // can't intercept in handleClick, e.g. an OS edge-swipe-back gesture) still
  // gets the enter fade: a plain class swap on the *same* element can lose
  // the animation restart if the class is reapplied within the same paint
  // the router already used to swap `children` in — a fresh key forces React
  // to mount a brand-new DOM node, which always starts its animation from
  // frame 0 regardless of how the navigation happened.
  return (
    <div key={pathname} className={className} onAnimationEnd={handleAnimationEnd}>
      {children}
    </div>
  );
}

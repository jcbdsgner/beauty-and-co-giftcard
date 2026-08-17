"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DiagonalCutTransition } from "@/components/transitions/diagonal-cut-transition";
import { CONTACT_INFO, SOCIAL_LINKS } from "@/lib/contact";

const STOP_TIME = 1.8;

type GateState = "idle" | "playing" | "transitioning" | "done";

// Module-scoped, not React state or sessionStorage: it lives only as long as
// this JS module stays loaded in memory. A client-side navigation back to
// "/" (e.g. the logo/back link) keeps the module alive, so the gate is
// skipped — but an actual page load/refresh re-evaluates the module from
// scratch, resetting this to false, so the gate shows again.
let hasSeenIntro = false;

// Mirrors CSS `object-fit: cover`: crops the video's source rect so it fills
// a canvas of a different aspect ratio without distortion.
function getCoverSourceRect(mediaWidth: number, mediaHeight: number, targetWidth: number, targetHeight: number) {
  const mediaRatio = mediaWidth / mediaHeight;
  const targetRatio = targetWidth / targetHeight;
  if (mediaRatio > targetRatio) {
    const sWidth = mediaHeight * targetRatio;
    return { sx: (mediaWidth - sWidth) / 2, sy: 0, sWidth, sHeight: mediaHeight };
  }
  const sHeight = mediaWidth / targetRatio;
  return { sx: 0, sy: (mediaHeight - sHeight) / 2, sWidth: mediaWidth, sHeight };
}

/**
 * Video gate shown at the site's entry (Landing). It plays again on every
 * actual page load/refresh, but is skipped when the visitor merely
 * navigates back to "/" from elsewhere in the app without reloading (see
 * `hasSeenIntro` above). The visitor clicks to play a short "unboxing"
 * clip; at STOP_TIME the frame is frozen, captured to a canvas, and cut
 * away diagonally with DiagonalCutTransition to reveal the real Hero
 * mounted underneath.
 */
export function IntroGate() {
  const [state, setState] = useState<GateState>(hasSeenIntro ? "done" : "idle");
  const [frameImage, setFrameImage] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const revealedRef = useRef(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const handleReveal = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const { sx, sy, sWidth, sHeight } = getCoverSourceRect(
        video.videoWidth,
        video.videoHeight,
        canvas.width,
        canvas.height,
      );
      ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
    }
    setFrameImage(canvas.toDataURL("image/jpeg", 0.9));
    setState("transitioning");
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (state !== "playing" || !video) return;

    const onTimeUpdate = () => {
      // timeupdate can fire more than once past STOP_TIME before this
      // listener is torn down (removal rides on React's effect cleanup,
      // which lands after the DOM event, not synchronously with it) — the
      // ref guard makes the reveal fire exactly once instead of restarting
      // the transition on every extra tick.
      if (revealedRef.current || video.currentTime < STOP_TIME) return;
      revealedRef.current = true;
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.pause();
      handleReveal();
    };
    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, [state, handleReveal]);

  const handleStart = useCallback(() => {
    const video = videoRef.current;
    if (!video || state !== "idle") return;
    revealedRef.current = false;
    video.currentTime = 0;
    void video.play();
    setState("playing");
  }, [state]);

  // Swipe-to-open: mouse/pen drag goes through Pointer Events below; touch is
  // handled separately via native (non-React) touch listeners further down.
  // A tap still opens via the button's own onClick either way. handleStart's
  // own idle guard makes it safe to fire from any of these paths without
  // double-triggering.
  const dragOriginRef = useRef<{ x: number; y: number } | null>(null);
  const SWIPE_THRESHOLD_PX = 40;

  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    if (event.pointerType === "touch") return; // native touch listeners below own this path
    dragOriginRef.current = { x: event.clientX, y: event.clientY };
  }, []);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (event.pointerType === "touch") return; // native touch listeners below own this path
      const origin = dragOriginRef.current;
      if (!origin) return;
      const distance = Math.hypot(event.clientX - origin.x, event.clientY - origin.y);
      if (distance < SWIPE_THRESHOLD_PX) return;
      dragOriginRef.current = null;
      handleStart();
    },
    [handleStart],
  );

  const handlePointerEnd = useCallback(() => {
    dragOriginRef.current = null;
  }, []);

  // Touch is handled via native (non-React, non-Pointer-Events) listeners
  // with `{ passive: false }`: iOS Safari/WebKit special-cases interactive
  // elements like <button> for its own tap/gesture recognition and doesn't
  // reliably honor `touch-action: none` on them the way it does on plain
  // divs, so pointermove-based drag detection alone silently never fired on
  // real iOS devices (confirmed: worked in Blink/Chromium touch emulation,
  // not on an actual iPhone). Calling `preventDefault()` from a non-passive
  // `touchmove` is the one mechanism WebKit reliably respects to override
  // that native handling.
  const buttonRef = useRef<HTMLButtonElement>(null);
  const touchOriginRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      touchOriginRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const onTouchMove = (event: TouchEvent) => {
      const origin = touchOriginRef.current;
      const touch = event.touches[0];
      if (!origin || !touch) return;
      // preventDefault unconditionally, from the very first touchmove: iOS
      // Safari decides within the first few pixels of movement whether a
      // touch is a native scroll/pan, and once it commits to that, calling
      // preventDefault later (e.g. only after our own distance threshold is
      // crossed) is too late to cancel it — the gesture has already been
      // handed to the browser's own scroll handling, which is why our
      // threshold logic below was silently never reached on a real device.
      event.preventDefault();
      const distance = Math.hypot(touch.clientX - origin.x, touch.clientY - origin.y);
      if (distance < SWIPE_THRESHOLD_PX) return;
      touchOriginRef.current = null;
      handleStart();
    };

    const onTouchEnd = () => {
      touchOriginRef.current = null;
    };

    button.addEventListener("touchstart", onTouchStart, { passive: true });
    button.addEventListener("touchmove", onTouchMove, { passive: false });
    button.addEventListener("touchend", onTouchEnd, { passive: true });
    button.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      button.removeEventListener("touchstart", onTouchStart);
      button.removeEventListener("touchmove", onTouchMove);
      button.removeEventListener("touchend", onTouchEnd);
      button.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [handleStart]);

  const handleComplete = useCallback(() => {
    hasSeenIntro = true;
    setState("done");
  }, []);

  if (state === "done") return null;

  return (
    <>
      {state === "transitioning" && (
        <DiagonalCutTransition frameImage={frameImage} reduceMotion={reduceMotion} onComplete={handleComplete} />
      )}
      {state !== "transitioning" && (
        // The click-to-open button and the "Prendre rendez-vous" / "notre
        // boutique en ligne" links are siblings, not nested — an <a> inside
        // a <button> is invalid HTML and would fight the button's own click
        // handler. The links sit in a higher z-index layer so they stay
        // independently clickable on top of the full-bleed button.
        <div className="fixed inset-0 z-[100]">
          <button
            ref={buttonRef}
            type="button"
            onClick={handleStart}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            aria-label="Cliquer ou glisser pour ouvrir le cadeau"
            className="absolute inset-0 h-full w-full touch-none cursor-pointer overflow-hidden bg-[var(--stage-black)] p-0"
          >
            <video
              ref={videoRef}
              aria-hidden="true"
              // pointer-events-none: iOS Safari's <video> carries its own
              // internal touch handling (media-controls hit-testing,
              // drag-to-save callout) even with no visible controls, which
              // can swallow the pointermove sequence mid-swipe before it
              // reaches this button. Keeping the video fully non-interactive
              // guarantees every touch/pointer event resolves to the button
              // from the first pixel, on every browser.
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              src="/videos/gift-intro.mp4"
              poster="/images/gift-intro-poster.jpg"
              muted
              playsInline
              preload="auto"
              disablePictureInPicture
            />
            {state === "idle" && (
              // Overlaid on top of the video, not composited into it —
              // left-aligned, vertically centered, per design.
              <div className="absolute inset-0 flex flex-col items-start justify-center gap-8 pt-6 pl-6 sm:gap-10 sm:pl-12 lg:pl-[72px]">
                <Image
                  src="/images/logo.svg"
                  alt="Beauty and Co"
                  width={358}
                  height={165}
                  priority
                  className="h-24 w-auto sm:h-32 lg:h-40 xl:h-[165px]"
                />
                <p className="hidden font-sans text-base uppercase tracking-[0.2em] text-black sm:block">
                  Cliquer pour ouvrir le cadeau
                </p>
                <p className="font-sans text-base uppercase tracking-[0.2em] text-black sm:hidden">
                  Glisser pour ouvrir le cadeau
                </p>
              </div>
            )}
          </button>

          {state === "idle" && (
            // Scrim behind the bottom links: the video's content varies by frame, so
            // a fixed crop can't guarantee contrast — a gradient guarantees it regardless
            // of what's underneath (here, the ribbon tail was crossing right through them).
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/70 via-black/25 to-transparent sm:h-72 lg:h-80"
            />
          )}

          {state === "idle" && (
            <div className="pointer-events-none absolute inset-x-0 bottom-6 z-[101] flex items-end justify-between pr-6 pl-6 sm:bottom-10 sm:pr-12 sm:pl-12 lg:bottom-14 lg:pr-[72px] lg:pl-[72px]">
              <nav className="pointer-events-auto flex flex-col items-start gap-2">
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-sans text-lg uppercase tracking-[0.2em] text-white transition hover:opacity-80 sm:text-xl"
                >
                  Prendre rendez-vous
                  <ArrowUpRight className="size-6" aria-hidden="true" />
                </a>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-sans text-lg uppercase tracking-[0.2em] text-white transition hover:opacity-80 sm:text-xl"
                >
                  notre boutique en ligne
                  <ArrowUpRight className="size-6" aria-hidden="true" />
                </a>
              </nav>

              {/* Hidden below sm: "notre boutique en ligne" wraps to two
                  lines at narrow widths and collides with this block, which
                  shares the same bottom row — kept only from sm up. */}
              <div className="pointer-events-auto hidden flex-col items-end gap-3 sm:flex">
                <div className="flex items-center gap-3">
                  {SOCIAL_LINKS.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="transition hover:opacity-80"
                    >
                      <Image
                        src={social.icon}
                        alt=""
                        width={20}
                        height={20}
                        className="brightness-0 invert"
                      />
                    </a>
                  ))}
                </div>
                <div className="flex flex-col items-end gap-1 font-sans text-sm text-white">
                  <span>{CONTACT_INFO.phone}</span>
                  <a href={`mailto:${CONTACT_INFO.email}`} className="transition hover:opacity-80">
                    {CONTACT_INFO.email}
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

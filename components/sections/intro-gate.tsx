"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { DiagonalCutTransition } from "@/components/transitions/diagonal-cut-transition";

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
        <button
          type="button"
          onClick={handleStart}
          aria-label="Cliquer pour ouvrir le cadeau"
          className="fixed inset-0 z-[100] h-full w-full cursor-pointer overflow-hidden bg-[var(--stage-black)] p-0"
        >
          <video
            ref={videoRef}
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
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
              <p className="font-sans text-base uppercase tracking-[0.2em] text-black">
                Cliquer pour ouvrir le cadeau
              </p>
            </div>
          )}
        </button>
      )}
    </>
  );
}

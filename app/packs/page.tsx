"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FlowScreen } from "@/components/ui/flow-screen";
import { buildQuery } from "@/lib/flow-params";
import { formatFcfa } from "@/lib/format";
import { SERVICE_PACKS, type ServicePack } from "@/lib/packs";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

/** A card counts as "on screen" for the position indicator past this share of its width. */
const VISIBLE_RATIO = 0.6;

export default function PacksPage({ searchParams }: PageProps) {
  const carried = use(searchParams);

  const nextHref = (packId: string, price: number) => {
    const next = { ...carried, pack: packId, amount: String(price), type: "pack" };
    if (carried.from === "recap") return `/recapitulatif${buildQuery({ ...next, from: undefined })}`;
    return `/mode-de-livraison${buildQuery(next)}`;
  };

  return (
    <FlowScreen backHref={`/type-cadeau${buildQuery(carried)}`} carried={carried} fillViewport>
      {/* Title and carousel are centered together as one block, scrolling
          internally on a short viewport rather than clipping the controls. */}
      <div className="flex w-full min-h-0 flex-1 flex-col items-center justify-center-safe gap-6 overflow-y-auto py-4 sm:gap-8 [@media(max-height:900px)]:gap-4 [@media(max-height:900px)]:py-0">
        <div className="flex shrink-0 flex-col items-center gap-2 text-center">
          <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">Pack de services</h1>
          <p className="text-[15px] text-[var(--text-secondary)] sm:text-[17px]">
            Faites défiler pour tous les découvrir
          </p>
        </div>
        <PackCarousel packs={SERVICE_PACKS} hrefFor={nextHref} initialPackId={carried.pack} />
      </div>
    </FlowScreen>
  );
}

/**
 * Horizontal, snap-scrolling pack carousel built for a large touch screen
 * as much as for a phone. "There's more than what you see" is signalled
 * redundantly, so it still reads without the arrows:
 * - the track is sized to show a fraction of the next card, cut by the edge;
 * - that edge fades out while there are cards behind it;
 * - a segmented indicator (one segment per pack) shows which ones are on
 *   screen out of the total, and the subtitle states the count;
 * - on first arrival the cards make one small leftward nudge, the "this
 *   slides" cue a kiosk visitor won't get from anyone explaining it.
 * Touch swipes are native scrolling; mouse users also get click-and-drag.
 */
function PackCarousel({
  packs,
  hrefFor,
  initialPackId,
}: {
  packs: ServicePack[];
  hrefFor: (packId: string, price: number) => string;
  initialPackId?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [visible, setVisible] = useState<boolean[]>(() => packs.map(() => false));

  const cards = useCallback(
    () => Array.from(trackRef.current?.children ?? []) as HTMLElement[],
    [],
  );

  /**
   * Snapped cards sit this far in from the left edge (the track's
   * scroll-padding, set per breakpoint via `--edge`), leaving room for a
   * sliver of the previous card — the edge fade covers only that sliver,
   * never the card being looked at.
   */
  const edge = useCallback(() => {
    const track = trackRef.current;
    return track ? parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0 : 0;
  }, []);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    setAtStart(track.scrollLeft <= 2);
    setAtEnd(track.scrollLeft >= max - 2);
    const viewLeft = track.scrollLeft;
    const viewRight = viewLeft + track.clientWidth;
    setVisible(
      cards().map((card) => {
        const left = card.offsetLeft;
        const right = left + card.offsetWidth;
        const shown = Math.max(0, Math.min(right, viewRight) - Math.max(left, viewLeft));
        return shown / card.offsetWidth >= VISIBLE_RATIO;
      }),
    );
  }, [cards]);

  // Keep edge/indicator state in sync with scrolling and resizing.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    const resize = new ResizeObserver(onScroll);
    resize.observe(track);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", onScroll);
      resize.disconnect();
    };
  }, [measure]);

  // Coming back to change the pack (e.g. from the recap): bring the chosen
  // one into view. Otherwise, play the one-time "it slides" nudge.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const initialIndex = packs.findIndex((pack) => pack.id === initialPackId);
    if (initialIndex > 0) {
      track.scrollLeft = cards()[initialIndex].offsetLeft - edge();
      return;
    }
    if (initialIndex === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const animations = cards().map((card) =>
      card.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-72px)", offset: 0.45 },
          { transform: "translateX(0)" },
        ],
        { duration: 1300, delay: 650, easing: "cubic-bezier(0.45, 0, 0.25, 1)" },
      ),
    );
    // The visitor is already interacting — don't fight their finger.
    const stop = () => animations.forEach((animation) => animation.cancel());
    track.addEventListener("pointerdown", stop, { once: true });
    track.addEventListener("wheel", stop, { once: true, passive: true });
    return () => {
      stop();
      track.removeEventListener("pointerdown", stop);
      track.removeEventListener("wheel", stop);
    };
  }, [cards, edge, packs, initialPackId]);

  // Click-and-drag for mouse users (touch already pans natively). Snapping
  // is suspended while the pointer holds the track, then the release settles
  // on the nearest card in the direction of the drag.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let startX = 0;
    let startScroll = 0;
    let pointerId: number | null = null;
    let dragging = false;
    let suppressClick = false;

    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startScroll = track.scrollLeft;
      dragging = false;
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      const dx = event.clientX - startX;
      if (!dragging && Math.abs(dx) < 6) return;
      if (!dragging) {
        dragging = true;
        track.setPointerCapture(event.pointerId);
        track.style.scrollSnapType = "none";
        track.style.cursor = "grabbing";
      }
      track.scrollLeft = startScroll - dx;
    };
    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      pointerId = null;
      if (!dragging) return;
      dragging = false;
      suppressClick = true;
      setTimeout(() => (suppressClick = false), 0);
      track.style.cursor = "";

      const direction = Math.sign(startScroll - track.scrollLeft) * -1;
      const offsets = cards().map((card) => card.offsetLeft - edge());
      const current = track.scrollLeft;
      const target =
        direction > 0
          ? (offsets.find((offset) => offset > current + 1) ?? current)
          : ([...offsets].reverse().find((offset) => offset < current - 1) ?? 0);
      track.style.scrollSnapType = "";
      track.scrollTo({ left: target, behavior: "smooth" });
    };
    // Window-level capture runs before ScreenTransition's document-level
    // capture handler, so a drag that ends over a card never navigates.
    const onClick = (event: MouseEvent) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
    };

    track.addEventListener("pointerdown", onDown);
    track.addEventListener("pointermove", onMove);
    track.addEventListener("pointerup", onUp);
    track.addEventListener("pointercancel", onUp);
    window.addEventListener("click", onClick, true);
    return () => {
      track.removeEventListener("pointerdown", onDown);
      track.removeEventListener("pointermove", onMove);
      track.removeEventListener("pointerup", onUp);
      track.removeEventListener("pointercancel", onUp);
      window.removeEventListener("click", onClick, true);
    };
  }, [cards, edge]);

  const scrollBehavior = (): ScrollBehavior =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

  /** One arrow tap pages by however many cards are fully on screen. */
  const page = (direction: 1 | -1) => {
    const track = trackRef.current;
    const [first, second] = cards();
    if (!track || !first) return;
    const step = second ? second.offsetLeft - first.offsetLeft : first.offsetWidth;
    const perPage = Math.max(1, Math.floor((track.clientWidth + 1) / step));
    track.scrollBy({ left: direction * perPage * step, behavior: scrollBehavior() });
  };

  const showCard = (index: number) => {
    const track = trackRef.current;
    const card = cards()[index];
    if (!track || !card) return;
    const left = card.offsetLeft;
    const right = left + card.offsetWidth;
    // Already fully on screen: nothing to do. Otherwise move just enough.
    if (left >= track.scrollLeft && right <= track.scrollLeft + track.clientWidth) return;
    const target = left < track.scrollLeft ? left - edge() : right - track.clientWidth + edge();
    track.scrollTo({ left: target, behavior: scrollBehavior() });
  };

  const fadeLeft = atStart ? "0px" : "var(--edge)";
  const fadeRight = atEnd ? "0px" : "var(--edge)";
  const mask = `linear-gradient(to right, transparent 0, #000 ${fadeLeft}, #000 calc(100% - ${fadeRight}), transparent 100%)`;

  return (
    <section
      aria-roledescription="carrousel"
      aria-label="Packs de services"
      className="flex w-[min(100%,92rem)] shrink-0 flex-col items-center gap-5 sm:gap-7 [@media(max-height:900px)]:gap-2"
    >
      <div className="flex w-full items-center gap-4 lg:gap-6">
        <ArrowButton direction={-1} disabled={atStart} onClick={() => page(-1)} className="hidden md:flex" />

        <div
          ref={trackRef}
          id="packs-track"
          style={{ maskImage: mask, WebkitMaskImage: mask }}
          className="relative flex min-w-0 flex-1 snap-x snap-mandatory gap-4 overflow-x-auto [--edge:1.75rem] [scroll-padding-inline:var(--edge)] sm:[--edge:2.75rem] overscroll-x-contain py-1 select-none [scrollbar-width:none] sm:gap-5 [&::-webkit-scrollbar]:hidden"
        >
          {packs.map((pack) => (
            <PackCard key={pack.id} pack={pack} href={hrefFor(pack.id, pack.price)} />
          ))}
        </div>

        <ArrowButton direction={1} disabled={atEnd} onClick={() => page(1)} className="hidden md:flex" />
      </div>

      <div className="flex items-center gap-3">
        <ArrowButton direction={-1} disabled={atStart} onClick={() => page(-1)} className="flex md:hidden" />
        <div className="flex items-center" role="group" aria-label="Position dans les packs">
          {packs.map((pack, index) => (
            <button
              key={pack.id}
              type="button"
              onClick={() => showCard(index)}
              aria-label={`Voir le pack ${index + 1} sur ${packs.length} : ${pack.label}`}
              aria-current={visible[index] ? "true" : undefined}
              className="group flex h-11 w-7 items-center justify-center lg:h-14 lg:w-10 [@media(max-height:820px)]:h-10"
            >
              <span
                className={`h-1.5 rounded-full transition-all duration-300 lg:h-2 ${
                  visible[index]
                    ? "w-5 bg-[var(--brand-taupe-muted)] lg:w-8"
                    : "w-3 bg-[rgba(136,102,102,0.25)] group-hover:bg-[rgba(136,102,102,0.45)] lg:w-4"
                }`}
              />
            </button>
          ))}
        </div>
        <ArrowButton direction={1} disabled={atEnd} onClick={() => page(1)} className="flex md:hidden" />
      </div>
    </section>
  );
}

function ArrowButton({
  direction,
  disabled,
  onClick,
  className,
}: {
  direction: 1 | -1;
  disabled: boolean;
  onClick: () => void;
  className: string;
}) {
  const Icon = direction > 0 ? ChevronRight : ChevronLeft;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-controls="packs-track"
      aria-label={direction > 0 ? "Packs suivants" : "Packs précédents"}
      className={`${className} size-12 shrink-0 items-center justify-center rounded-full border border-[var(--brand-color-1)] bg-white text-[var(--button-2-color)] shadow-[0_6px_20px_-8px_rgba(45,45,45,0.35)] transition active:scale-95 enabled:hover:border-[var(--brand-taupe-muted)]/60 disabled:opacity-35 disabled:shadow-none md:size-16 2xl:size-20`}
    >
      <Icon aria-hidden strokeWidth={1.75} className="size-6 md:size-8 2xl:size-10" />
    </button>
  );
}

function PackCard({ pack, href }: { pack: ServicePack; href: string }) {
  return (
    <Link
      href={href}
      draggable={false}
      className="flex shrink-0 grow-0 basis-[calc((100%-1rem)/1.2)] snap-start flex-col overflow-hidden rounded-lg border border-[#e5e7eb] bg-white transition hover:border-[var(--brand-taupe-muted)]/50 sm:basis-[calc((100%-2*1.25rem)/2.3)] lg:basis-[calc((100%-3*1.25rem)/3.3)] 2xl:basis-[calc((100%-4*1.25rem)/4.3)] lg:portrait:basis-[calc((100%-2*1.25rem)/2.3)]"
    >
      <div className="relative aspect-[4/3] max-h-[20svh] w-full shrink-0 portrait:max-h-none">
        {pack.video ? (
          <video
            aria-hidden
            src={pack.video}
            poster={pack.image}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <Image
            src={pack.image}
            alt=""
            fill
            draggable={false}
            sizes="(min-width: 1536px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 85vw"
            className="object-cover"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5 [@media(max-height:820px)]:py-3.5">
        <p className="text-[17px] font-bold text-[var(--brand-taupe-muted)] sm:text-[19px]">{pack.label}</p>
        <p className="mt-1.5 text-[13px] leading-[1.4] text-[#667085] sm:text-[14px]">{pack.description}</p>

        <ul className="mt-3 flex flex-col gap-1.5 sm:mt-4">
          {pack.items.map((item) => (
            <li key={item.label} className="flex items-start gap-2 text-[13px] leading-[1.5] text-[#475467] sm:text-[14px]">
              <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-[rgba(136,102,102,0.5)]" />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-1 flex-col justify-end gap-3 sm:mt-5 [@media(max-height:820px)]:mt-3 [@media(max-height:820px)]:gap-2">
          <p className="text-[19px] font-bold text-[#1d2939] sm:text-[21px]">{formatFcfa(pack.price)}</p>
          <span className="w-full rounded-full border border-[var(--brand-color-1,rgba(216,184,180,0.5))] bg-white py-2 text-center text-[14px] font-bold text-[var(--button-2-color,#a27576)] sm:text-[15px]">
            Offrir ce pack
          </span>
        </div>
      </div>
    </Link>
  );
}

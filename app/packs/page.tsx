"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { FlowScreen } from "@/components/ui/flow-screen";
import { buildQuery } from "@/lib/flow-params";
import { formatFcfa } from "@/lib/format";
import { SERVICE_PACKS, type ServicePack } from "@/lib/packs";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default function PacksPage({ searchParams }: PageProps) {
  const carried = use(searchParams);

  const nextHref = (packId: string, price: number) => {
    const next = { ...carried, pack: packId, amount: String(price), type: "pack" };
    if (carried.from === "recap") return `/recapitulatif${buildQuery({ ...next, from: undefined })}`;
    return `/mode-de-livraison${buildQuery(next)}`;
  };

  return (
    <FlowScreen backHref={`/type-cadeau${buildQuery(carried)}`} carried={carried} fillViewport>
      {/* Title and grid are centered together as one block (not the title
          pinned to the top with the grid centered in the space left over) —
          otherwise on a tall viewport the leftover space below the title
          gets centered on its own, stranding the title far above the cards
          it's the heading for. On a short mobile viewport where 2 rows of
          full-size cards don't fit, this scrolls internally instead of the
          fillViewport shell silently clipping the bottom row. */}
      <div className="flex w-full min-h-0 flex-1 flex-col items-center justify-center-safe gap-8 overflow-y-auto py-4">
        <h1 className="shrink-0 font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
          Pack de services
        </h1>
        <div className="grid w-[min(94vw,72rem)] shrink-0 grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-4">
          {SERVICE_PACKS.map((pack) => (
            <PackCard key={pack.id} pack={pack} href={nextHref(pack.id, pack.price)} />
          ))}
        </div>
      </div>
    </FlowScreen>
  );
}

function PackCard({ pack, href }: { pack: ServicePack; href: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col overflow-hidden rounded-lg border border-[#e5e7eb] bg-white transition hover:border-[var(--brand-taupe-muted)]/50"
    >
      <div className="relative aspect-[4/3] w-full shrink-0">
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
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
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

        <div className="mt-4 flex flex-1 flex-col justify-end gap-3 sm:mt-5">
          <p className="text-[19px] font-bold text-[#1d2939] sm:text-[21px]">{formatFcfa(pack.price)}</p>
          <span className="w-full rounded-full border border-[var(--brand-color-1,rgba(216,184,180,0.5))] bg-white py-2 text-center text-[14px] font-bold text-[var(--button-2-color,#a27576)] sm:text-[15px]">
            Offrir ce pack
          </span>
        </div>
      </div>
    </Link>
  );
}

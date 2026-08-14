"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { FlowScreen } from "@/components/ui/flow-screen";
import { Calendar } from "@/components/ui/calendar";
import { buildQuery } from "@/lib/flow-params";
import { startOfDay } from "@/lib/calendar";

const WatercolorBackground = dynamic(
  () => import("@/components/canvas/watercolor-background").then((m) => m.WatercolorBackground),
  { ssr: false },
);

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

function toLocalDateKey(date: Date) {
  const local = new Date(date);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 10);
}

export default function ProgrammerEnvoiPage({ searchParams }: PageProps) {
  const carried = use(searchParams);
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    if (!carried.envoi_date) return null;
    const parsed = new Date(carried.envoi_date);
    return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed);
  });

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    router.push(
      `/recapitulatif${buildQuery({
        ...carried,
        envoi: "programme",
        envoi_date: toLocalDateKey(date),
      })}`,
    );
  };

  return (
    <>
      <WatercolorBackground />
      <FlowScreen backHref={`/quand-envoyer${buildQuery(carried)}`} carried={carried}>
        <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
          Programmer l&apos;envoi
        </h1>

        <div className="flex w-[min(92vw,28rem)] flex-col items-center gap-4 sm:w-[32rem]">
          <Calendar selectedDate={selectedDate} onSelectDate={handleSelectDate} />
        </div>
      </FlowScreen>
    </>
  );
}

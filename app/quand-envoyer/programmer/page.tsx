"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { FlowScreen } from "@/components/ui/flow-screen";
import { Calendar } from "@/components/ui/calendar";
import { buildQuery } from "@/lib/flow-params";
import { startOfDay } from "@/lib/calendar";

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
    const next = { ...carried, envoi: "programme", envoi_date: toLocalDateKey(date) };
    router.push(
      carried.from === "recap"
        ? `/recapitulatif${buildQuery({ ...next, from: undefined })}`
        : `/apercu-carte${buildQuery(next)}`,
    );
  };

  return (
    <FlowScreen backHref={`/quand-envoyer${buildQuery(carried)}`} carried={carried} fillViewport>
      <h1 className="shrink-0 font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
        {carried.mode === "postal" ? "Programmer l'expédition" : "Programmer l'envoi"}
      </h1>

      <div className="flex min-h-0 w-[min(92vw,28rem)] flex-1 flex-col items-center justify-center sm:w-[32rem]">
        <Calendar selectedDate={selectedDate} onSelectDate={handleSelectDate} />
      </div>
    </FlowScreen>
  );
}

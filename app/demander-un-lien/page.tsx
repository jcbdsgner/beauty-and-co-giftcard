"use client";

import { use, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { BackLinkWithLogo } from "@/components/layout/back-link-with-logo";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { buildQuery } from "@/lib/flow-params";

const WatercolorBackground = dynamic(
  () => import("@/components/canvas/watercolor-background").then((m) => m.WatercolorBackground),
  { ssr: false },
);

type PageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default function DemanderUnLienPage({ searchParams }: PageProps) {
  const carried = use(searchParams);
  const router = useRouter();
  const [email, setEmail] = useState(carried.email ?? "");

  const isValid = email.trim() !== "";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) return;
    router.push(`/lien-envoye${buildQuery({ email })}`);
  };

  return (
    <section className="relative flex min-h-svh flex-col items-center justify-center gap-10 px-6 py-16">
      <WatercolorBackground />

      <BackLinkWithLogo backHref={`/mes-cartes-cadeaux${buildQuery(carried)}`} />

      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
          Recevoir un lien par email
        </h1>
        <p className="text-[var(--text-secondary)] max-w-sm">
          L&apos;email utilisé lors d&apos;un achat précédent — le lien est valable 15 minutes.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex w-[min(90vw,28rem)] flex-col items-center gap-4"
      >
        <TextField
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          aria-label="Email"
        />
        <Button type="submit" size="lg" disabled={!isValid} className="w-full">
          Envoyer le lien
        </Button>
      </form>
    </section>
  );
}

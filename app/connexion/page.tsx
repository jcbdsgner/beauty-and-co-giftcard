"use client";

import { use, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { BackLinkWithLogo } from "@/components/layout/back-link-with-logo";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { login } from "@/lib/account/persistence";
import { buildQuery } from "@/lib/flow-params";

const WatercolorBackground = dynamic(
  () => import("@/components/canvas/watercolor-background").then((m) => m.WatercolorBackground),
  { ssr: false },
);

type PageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default function ConnexionPage({ searchParams }: PageProps) {
  const carried = use(searchParams);
  const router = useRouter();
  const [email, setEmail] = useState(carried.email ?? "");
  const [password, setPassword] = useState("");

  const isValid = email.trim() !== "" && password.trim() !== "";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) return;
    // No real auth backend yet (see docs/userflow.md, "Constat technique — le
    // même compte que b&co") — any email/password combination succeeds.
    login({ email });
    router.push(`/mes-cartes-cadeaux/liste${buildQuery({ email })}`);
  };

  return (
    <section className="relative flex min-h-svh flex-col items-center justify-center gap-10 px-6 py-16">
      <WatercolorBackground />

      <BackLinkWithLogo backHref={`/mes-cartes-cadeaux${buildQuery(carried)}`} />

      <h1 className="font-heading text-3xl text-[var(--on-core-brand-color)] sm:text-4xl">
        Connexion
      </h1>

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
        <TextField
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mot de passe"
          aria-label="Mot de passe"
        />

        <Button type="submit" size="lg" disabled={!isValid} className="w-full">
          Se connecter
        </Button>

        <Link
          href={`/demander-un-lien${buildQuery({ email })}`}
          className="text-[var(--button-2-color)] mt-1 text-base underline-offset-2 hover:underline"
        >
          Recevoir un lien par email
        </Link>
      </form>
    </section>
  );
}

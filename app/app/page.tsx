"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import StarField from "@/components/StarField";

export default function Splash() {
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("2am:profile");
      if (!raw) return;
      const parsed = JSON.parse(raw) as { onboardingComplete?: boolean };
      setHasProfile(!!parsed.onboardingComplete);
    } catch {
      setHasProfile(false);
    }
  }, []);

  const nextHref = hasProfile ? "/app/home" : "/app/chat";

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-between overflow-hidden bg-midnight px-6 pt-24 pb-10">
      <StarField count={50} />
      <div className="pointer-events-none absolute inset-0 bg-peach-radial" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.35em] text-cream/50">
          hey2am.app
        </div>
        <h1 className="mt-6 text-gradient-peach text-[96px] font-black leading-none tracking-tight">
          2am
        </h1>
        <p className="mt-6 italic text-cream/85 text-lg">
          myla&apos;s always up.
        </p>
        <p className="mt-3 max-w-[18rem] text-sm leading-relaxed text-cream/60">
          the judgment-free ai companion for pregnancy &amp; motherhood
        </p>
      </div>

      <div className="relative z-10 flex w-full flex-col items-center gap-6">
        <Link
          href={nextHref}
          className="inline-flex w-full max-w-xs items-center justify-center rounded-full bg-peach-gradient px-10 py-4 text-base font-semibold text-midnight shadow-glow transition active:scale-[0.98]"
        >
          meet myla
        </Link>
        <p className="text-center font-mono text-[11px] uppercase tracking-[0.25em] text-cream/40">
          no judgment. no google history. just answers.
        </p>
      </div>
    </main>
  );
}

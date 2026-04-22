"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StarField from "@/components/StarField";
import { createClient } from "@/lib/supabase/client";

type Status = "loading" | "firstTime";

export default function Splash() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;
        if (user) {
          router.replace("/app/home");
          return;
        }
        setStatus("firstTime");
      } catch {
        if (!cancelled) setStatus("firstTime");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (status === "loading") {
    // Blank midnight canvas while we decide — prevents splash flash for
    // returning users about to be redirected to /app/home.
    return <main className="min-h-svh bg-midnight" />;
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-between overflow-hidden bg-midnight px-6 pt-24 pb-10">
      <StarField count={50} />
      <div className="pointer-events-none absolute inset-0 bg-peach-radial" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.35em] text-cream/50">
          for every stage of motherhood
        </div>
        <h1 className="mt-6 text-gradient-peach text-[96px] font-black leading-none tracking-tight">
          2am
        </h1>
        <p className="mt-6 italic text-cream/85 text-lg">
          myla&apos;s always up.
        </p>
        <p className="mt-3 max-w-[22rem] text-sm leading-relaxed text-cream/60">
          the judgment-free friend for your journey — whether you&apos;re
          trying, expecting, or navigating life as a new mom.
        </p>
      </div>

      <div className="relative z-10 flex w-full flex-col items-center gap-6">
        <Link
          href="/app/auth"
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

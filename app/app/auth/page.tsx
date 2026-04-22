"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import StarField from "@/components/StarField";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export default function AuthPage() {
  return (
    <Suspense fallback={<main className="min-h-svh bg-midnight" />}>
      <AuthPageInner />
    </Suspense>
  );
}

function AuthPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/app/home";

  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("email and password are both required.");
      return;
    }
    if (password.length < 8) {
      setError("password needs to be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });
        if (error) {
          setError(error.message.toLowerCase());
          return;
        }
        // If email confirmations are on, session will be null until they click.
        if (!data.session) {
          setInfo(
            "check your inbox — we sent you a link to confirm your email.",
          );
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (error) {
          setError(error.message.toLowerCase());
          return;
        }
      }
      router.replace(next);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "something went wrong.";
      setError(msg.toLowerCase());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-between overflow-hidden bg-midnight px-6 pt-24 pb-10">
      <StarField count={40} />
      <div className="pointer-events-none absolute inset-0 bg-peach-radial" />

      <div className="relative z-10 flex w-full flex-col items-center text-center">
        <Link
          href="/app"
          className="text-gradient-peach font-display text-[64px] font-black leading-none tracking-tight"
        >
          2am
        </Link>
        <p className="mt-4 italic text-cream/85 text-lg">
          myla&apos;s always up.
        </p>
        <p className="mt-3 max-w-[22rem] text-sm leading-relaxed text-cream/60">
          sign in to keep your conversations with myla across all your devices.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="relative z-10 flex w-full max-w-sm flex-col gap-3"
      >
        <div className="flex items-center justify-center gap-1 rounded-full bg-navy/60 p-1 font-mono text-[11px] uppercase tracking-[0.22em]">
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
              setInfo(null);
            }}
            className={`flex-1 rounded-full px-4 py-2 transition ${
              mode === "signup"
                ? "bg-peach-gradient text-midnight"
                : "text-cream/60"
            }`}
          >
            sign up
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
              setInfo(null);
            }}
            className={`flex-1 rounded-full px-4 py-2 transition ${
              mode === "login"
                ? "bg-peach-gradient text-midnight"
                : "text-cream/60"
            }`}
          >
            log in
          </button>
        </div>

        <input
          type="email"
          autoComplete="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-full border border-cream/10 bg-navy/70 px-5 py-3 text-[15px] text-cream placeholder:text-cream/40 focus:border-peach/50 focus:outline-none"
          required
        />
        <input
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-full border border-cream/10 bg-navy/70 px-5 py-3 text-[15px] text-cream placeholder:text-cream/40 focus:border-peach/50 focus:outline-none"
          required
          minLength={8}
        />

        {error && (
          <p className="text-center text-[13px] text-coral">{error}</p>
        )}
        {info && (
          <p className="text-center text-[13px] text-sage">{info}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 inline-flex items-center justify-center rounded-full bg-peach-gradient px-10 py-4 text-base font-semibold text-midnight shadow-glow transition active:scale-[0.98] disabled:opacity-60"
        >
          {submitting
            ? mode === "signup"
              ? "creating account…"
              : "signing in…"
            : mode === "signup"
              ? "create account"
              : "log in"}
        </button>

        <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-cream/40">
          no judgment. no google history. just answers.
        </p>
      </form>
    </main>
  );
}

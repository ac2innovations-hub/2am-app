"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import {
  clearProfile,
  getProfile,
  hydrateProfileFromSupabase,
  type LocalProfile,
} from "@/lib/profile";
import { clearAllLocalData } from "@/lib/local-data";
import { createClient } from "@/lib/supabase/client";

const STAGE_LABEL: Record<string, string> = {
  pregnant: "pregnant",
  postpartum: "postpartum",
  ttc: "trying to conceive",
};

// The stage identity line takes its stage color (matches the home reskin).
const STAGE_COLOR: Record<string, string> = {
  pregnant: "text-peach",
  postpartum: "text-lavender",
  ttc: "text-sage",
};

// The three promises (static — framed as promises, not toggles).
const PROMISES = [
  "no ads, ever",
  "never sold, never shared",
  "no judgment, ever",
];

export default function SettingsClient() {
  const router = useRouter();
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const [remote, userRes] = await Promise.all([
        hydrateProfileFromSupabase(),
        supabase.auth.getUser(),
      ]);
      if (cancelled) return;
      const p = remote ?? getProfile();
      const user = userRes.data.user;
      // Settings is an authenticated surface. Bounce unauthenticated visitors
      // back to the auth page rather than render a half-empty screen.
      if (!user) {
        router.replace("/app/auth");
        return;
      }
      setProfile(p);
      setEmail(user.email ?? null);
      setMounted(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) {
        setDeleteError(
          "couldn't delete your account just now. please try again.",
        );
        setDeleting(false);
        return;
      }
    } catch {
      setDeleteError(
        "couldn't delete your account just now. please try again.",
      );
      setDeleting(false);
      return;
    }
    // Account is gone on the server. Wipe the client and head to the
    // landing page.
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // The auth row no longer exists; cookies will clear on redirect.
    }
    // Delete means delete: clear the entire 2am: namespace, not just the
    // conversation keys. Transcripts, profile, and every onboarding/push flag
    // leave the device — otherwise "delete my account" leaves full chat
    // history sitting in localStorage.
    clearAllLocalData();
    router.replace("/");
    router.refresh();
  }

  async function handleSignOut() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore — clear local state regardless so the next visit is clean.
    }
    clearProfile();
    try {
      localStorage.removeItem("2am:conversations");
      localStorage.removeItem("2am:activeConversation");
    } catch {
      // ignore
    }
    router.replace("/app");
    router.refresh();
  }

  if (!mounted || !profile) {
    return <div className="p-6 text-cream/60">loading…</div>;
  }

  const stageLabel = profile.stage
    ? STAGE_LABEL[profile.stage] ?? profile.stage
    : null;

  return (
    <main className="relative min-h-svh bg-midnight pb-12">
      <header className="safe-top flex items-center gap-2 px-5 pb-3">
        <Link
          href="/app/home"
          aria-label="back"
          className="-ml-1 rounded-full p-1.5 text-cream/60 transition hover:text-cream/90 active:scale-95"
        >
          <ChevronLeft size={22} strokeWidth={1.75} aria-hidden />
        </Link>
        <h1 className="font-display text-2xl font-semibold text-cream">
          settings
        </h1>
      </header>

      {/* identity */}
      <section className="mx-5 mt-4">
        <div className="flex items-center gap-3 rounded-2xl border border-cream/10 bg-navy/60 px-4 py-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-peach-gradient font-display text-lg font-semibold text-midnight">
            {(profile.name ?? "m").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-[15px] font-semibold text-cream">
              {profile.name ?? "—"}
            </div>
            <div className="mt-0.5 truncate text-[12.5px] text-cream/55">
              {stageLabel && (
                <span className={STAGE_COLOR[profile.stage!] ?? "text-cream/55"}>
                  {stageLabel}
                </span>
              )}
              {stageLabel ? " · " : ""}
              {email ?? "—"}
            </div>
          </div>
        </div>
      </section>

      {/* the 2am promise */}
      <section className="mx-5 mt-5">
        <div
          className="rounded-2xl border border-peach/20 p-4"
          style={{
            background:
              "linear-gradient(160deg, rgba(162,200,162,0.06), rgba(248,200,168,0.05))",
          }}
        >
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-peach">
            the 2am promise
          </div>
          <ul className="flex flex-col gap-3">
            {PROMISES.map((p) => (
              <li key={p} className="flex items-center gap-3">
                <span className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border border-sage/50 bg-sage/[0.16] text-[11px] text-sage">
                  ✓
                </span>
                <span className="text-[14px] text-cream/85">{p}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-cream/10 pt-3 text-[12.5px] italic text-cream/45">
            these aren&rsquo;t settings you can turn off. they&rsquo;re promises.
          </p>
        </div>
      </section>

      {/* your data */}
      <section className="mx-5 mt-6">
        <h2 className="mb-2 font-mono text-[10px] uppercase tracking-[0.28em] text-cream/55">
          your data
        </h2>
        <div className="overflow-hidden rounded-2xl border border-cream/10 bg-navy/60">
          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setDeleteOpen(true);
            }}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition active:scale-[0.99]"
          >
            <span className="text-[14.5px] text-red-300">delete everything</span>
            <span className="text-red-300/70">›</span>
          </button>
        </div>
        <p className="mt-2 px-1 text-[11px] leading-relaxed text-cream/45">
          permanently deletes your account, profile, and conversations.
        </p>
      </section>

      {/* about */}
      <section className="mx-5 mt-8">
        <p className="mb-3 text-center text-[12.5px] italic text-cream/55">
          myla is a friend, not a doctor.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-5">
          <Link
            href="/privacy"
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-cream/55 transition hover:text-peach"
          >
            privacy
          </Link>
          <Link
            href="/terms"
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-cream/55 transition hover:text-peach"
          >
            terms
          </Link>
        </div>
      </section>

      {/* sign out */}
      <section className="mx-5 mt-6">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center justify-center rounded-full border border-cream/15 py-3.5 text-[14px] font-medium text-cream/80 transition hover:bg-cream/5 active:scale-[0.99]"
        >
          sign out
        </button>
      </section>

      {/* version — App Store marketing version; bump per release */}
      <p className="mt-8 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-cream/30">
        2am · v1.2
      </p>

      {deleteOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-midnight/85 px-5 pb-8 pt-10 backdrop-blur-sm sm:items-center"
          onClick={() => {
            if (!deleting) setDeleteOpen(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-cream/10 bg-navy p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="delete-title"
              className="text-[17px] font-semibold lowercase text-cream"
            >
              are you sure?
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-cream/70">
              this will permanently delete your account and all your
              conversations with myla. this can&apos;t be undone.
            </p>
            {deleteError && (
              <p className="mt-3 text-[12px] leading-relaxed text-red-300">
                {deleteError}
              </p>
            )}
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="flex w-full items-center justify-center rounded-full bg-red-500 py-3 text-[14px] font-semibold text-white shadow-glow transition active:scale-[0.99] disabled:opacity-60"
              >
                {deleting ? "deleting…" : "delete my account"}
              </button>
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="flex w-full items-center justify-center rounded-full border border-cream/15 py-3 text-[14px] font-medium text-cream/80 transition active:scale-[0.99] disabled:opacity-60"
              >
                cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

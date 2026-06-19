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
import { createClient } from "@/lib/supabase/client";

const STAGE_LABEL: Record<string, string> = {
  pregnant: "pregnant",
  postpartum: "postpartum",
  ttc: "trying to conceive",
};

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
    clearProfile();
    try {
      localStorage.removeItem("2am:conversations");
      localStorage.removeItem("2am:activeConversation");
    } catch {
      // ignore
    }
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

  const stageLabel = profile.stage ? STAGE_LABEL[profile.stage] ?? profile.stage : "—";

  return (
    <main className="relative min-h-svh bg-midnight pb-10">
      <header className="safe-top flex items-center gap-2 px-5 pb-3">
        <Link
          href="/app/home"
          aria-label="back"
          className="-ml-1 rounded-full p-1.5 text-cream/60 transition hover:text-cream/90 active:scale-95"
        >
          <ChevronLeft size={22} strokeWidth={1.75} aria-hidden />
        </Link>
        <h1 className="font-display text-xl font-semibold text-cream">
          settings
        </h1>
      </header>

      <section className="mx-5 mt-4">
        <h2 className="mb-2 font-mono text-[10px] uppercase tracking-[0.28em] text-cream/55">
          account
        </h2>
        <dl className="divide-y divide-cream/5 overflow-hidden rounded-2xl border border-cream/10 bg-navy/60">
          <Row label="name" value={profile.name ?? "—"} />
          <Row label="email" value={email ?? "—"} />
          <Row label="stage" value={stageLabel} />
        </dl>
      </section>

      <section className="mx-5 mt-6">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center justify-center rounded-full border border-cream/15 py-3.5 text-[14px] font-medium text-cream/80 transition hover:bg-cream/5 active:scale-[0.99]"
        >
          sign out
        </button>
      </section>

      <section className="mx-5 mt-10">
        <button
          type="button"
          onClick={() => {
            setDeleteError(null);
            setDeleteOpen(true);
          }}
          className="flex w-full items-center justify-center rounded-full border border-red-500/50 bg-red-500/10 py-3.5 text-[14px] font-semibold text-red-300 transition hover:bg-red-500/20 active:scale-[0.99]"
        >
          delete my account
        </button>
        <p className="mt-2 text-center text-[11px] leading-relaxed text-cream/45">
          permanently deletes your account, profile, and conversations.
        </p>
      </section>

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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-cream/45">
        {label}
      </span>
      <span className="truncate text-[14px] text-cream">{value}</span>
    </div>
  );
}

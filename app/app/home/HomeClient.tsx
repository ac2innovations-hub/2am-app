"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getProfile, type LocalProfile } from "@/lib/profile";
import {
  listConversations,
  setActiveConversationId,
  type LocalConversation,
} from "@/lib/conversations";
import {
  babySizeForWeek,
  formatDueDate,
  greetingFor,
  relativeTime,
  timeBand,
  trimester,
} from "@/lib/utils";

const MOODS: { key: string; label: string; emoji: string }[] = [
  { key: "great", label: "great", emoji: "😊" },
  { key: "okay", label: "okay", emoji: "🙂" },
  { key: "meh", label: "meh", emoji: "😐" },
  { key: "rough", label: "rough", emoji: "😔" },
  { key: "anxious", label: "anxious", emoji: "😰" },
];

export default function HomeClient() {
  const router = useRouter();
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [conversations, setConversations] = useState<LocalConversation[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const p = getProfile();
    if (!p || !p.onboardingComplete) {
      router.replace("/app/chat");
      return;
    }
    setProfile(p);
    setConversations(listConversations().slice(0, 5));
    setMounted(true);
  }, [router]);

  const greeting = useMemo(
    () => greetingFor(profile?.name ?? undefined, timeBand()),
    [profile?.name],
  );

  if (!mounted || !profile) {
    return <div className="p-6 text-cream/60">loading…</div>;
  }

  const week = profile.week ?? 1;
  const tri = trimester(week);
  const size = babySizeForWeek(week);
  const progress = Math.min(100, Math.round((week / 40) * 100));
  const initial = (profile.name ?? "m").charAt(0).toUpperCase();

  const startNew = () => {
    setActiveConversationId(null);
    router.push("/app/chat?new=1");
  };

  const openConversation = (id: string) => {
    setActiveConversationId(id);
    router.push("/app/chat");
  };

  const pickMood = (m: string) => {
    router.push(`/app/chat?new=1&mood=${m}`);
  };

  return (
    <main className="relative min-h-svh bg-midnight pb-10">
      {/* Header */}
      <header className="safe-top flex items-center justify-between px-5 pb-3">
        <div className="text-gradient-peach font-display text-2xl font-black">
          2am
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-peach-gradient font-display text-sm font-semibold text-midnight">
          {initial}
        </div>
      </header>

      {/* Greeting */}
      <section className="px-5 pt-4">
        <h1 className="text-[26px] font-semibold leading-tight text-cream">
          {greeting}
        </h1>
        {profile.stage === "pregnant" && (
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-cream/50">
            week {week}
            {profile.dueDate ? ` · due ${formatDueDate(profile.dueDate)}` : ""}
          </p>
        )}
        {profile.stage === "postpartum" && profile.babyAgeMonths !== null && (
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-cream/50">
            baby · {profile.babyAgeMonths} months
          </p>
        )}
      </section>

      {/* Week card */}
      {profile.stage === "pregnant" && (
        <section className="mx-5 mt-5 rounded-3xl border border-peach/20 bg-navy p-5 shadow-[0_0_0_1px_rgba(248,200,168,0.06)]">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-peach/80">
                week {week}
              </div>
              <div className="mt-1 text-[13px] text-cream/60">
                trimester {tri}
              </div>
            </div>
            <div className="text-right text-[12px] text-cream/55">
              {40 - week > 0 ? `${40 - week} wks to go` : "any day now 🤍"}
            </div>
          </div>
          <p className="mt-4 text-[15px] leading-relaxed text-cream/90">
            baby is about the size of <span className="text-peach">{size}</span>
            .
          </p>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-midnight">
            <div
              className="h-full rounded-full bg-peach-gradient transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-cream/45">
            <span>1</span>
            <span>40</span>
          </div>
        </section>
      )}

      {/* Myla check-in */}
      <section className="mx-5 mt-4 rounded-3xl bg-navy/70 p-5">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-peach-gradient font-display text-sm font-bold text-midnight">
            M
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-peach/80">
                myla
              </span>
              <span className="inline-block h-2 w-2 rounded-full bg-coral" />
            </div>
            <p className="mt-1 text-[15px] leading-relaxed text-cream/90">
              {checkInMessage(profile)}
            </p>
            <button
              onClick={startNew}
              className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-peach hover:text-coral"
            >
              tap to reply →
            </button>
          </div>
        </div>
      </section>

      {/* Primary CTA */}
      <div className="px-5 pt-5">
        <button
          onClick={startNew}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-peach-gradient py-4 text-base font-semibold text-midnight shadow-glow active:scale-[0.99]"
        >
          talk to myla
        </button>
      </div>

      {/* Can I…? */}
      <div className="mx-5 mt-4">
        <Link
          href="/app/cani"
          className="flex items-center justify-between rounded-2xl border border-cream/10 bg-navy/60 px-4 py-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sage/20 text-sage">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path
                  d="M4 10l4 4 8-8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <div className="text-[15px] text-cream">can i…?</div>
              <div className="text-[12px] text-cream/50">
                quick safety check
              </div>
            </div>
          </div>
          <span className="text-cream/40">›</span>
        </Link>
      </div>

      {/* Recent conversations */}
      <section className="mx-5 mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.28em] text-cream/55">
            recent
          </h2>
          {conversations.length > 0 && (
            <button
              onClick={startNew}
              className="font-mono text-[10px] uppercase tracking-[0.22em] text-peach"
            >
              + new
            </button>
          )}
        </div>
        <div className="divide-y divide-cream/5 rounded-2xl bg-navy/50">
          {conversations.length === 0 && (
            <div className="p-4 text-sm text-cream/50">
              no conversations yet.
            </div>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => openConversation(c.id)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] text-cream/90">
                  {c.title || "new chat"}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/40">
                  {relativeTime(c.updatedAt)}
                </div>
              </div>
              <span className="text-cream/30">›</span>
            </button>
          ))}
        </div>
      </section>

      {/* Mood row */}
      <section className="mx-5 mt-6">
        <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-cream/55">
          how are you feeling?
        </h2>
        <div className="flex items-center justify-between gap-2">
          {MOODS.map((m) => (
            <button
              key={m.key}
              onClick={() => pickMood(m.key)}
              className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-navy/50 py-3 text-2xl active:scale-95"
              aria-label={m.label}
            >
              <span>{m.emoji}</span>
              <span className="text-[10px] lowercase text-cream/60">
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <p className="mx-5 mt-8 text-center text-[11px] leading-relaxed text-cream/45">
        myla is an ai companion, not a doctor. always consult your provider
        for medical decisions.
      </p>
    </main>
  );
}

function checkInMessage(p: LocalProfile): string {
  const name = p.name ? p.name : "you";
  if (p.stage === "pregnant" && p.week) {
    const concerns = p.concerns?.[0];
    if (concerns) {
      return `thinking about ${name} — last time we talked, ${concerns} was on your mind. how's that feeling today?`;
    }
    if (p.week >= 36) {
      return `hey ${name} — you're in the home stretch 🤍 anything showing up today i can help with?`;
    }
    return `hey ${name} — week ${p.week} brings its own stuff. anything weird, worrying, or curious today?`;
  }
  if (p.stage === "postpartum") {
    return `hi ${name} — how's your body feeling today? anything on your mind about baby or you?`;
  }
  return `hi ${name} — what's been on your mind today?`;
}

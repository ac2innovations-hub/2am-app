"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  getProfile,
  hydrateProfileFromSupabase,
  type LocalProfile,
} from "@/lib/profile";
import {
  hydrateConversationsFromSupabase,
  listConversations,
  setActiveConversationId,
  type LocalConversation,
} from "@/lib/conversations";
import MylaAvatar from "@/components/MylaAvatar";
import {
  formatDueDate,
  greetingFor,
  relativeTime,
  timeBand,
} from "@/lib/utils";
import TrackerCard from "./TrackerCard";
import {
  currentBabyAge,
  currentPregnancyWeek,
  formatBabyAge,
} from "@/lib/tracker";

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
    let cancelled = false;
    (async () => {
      // Pull latest from Supabase first so a sign-in on another device
      // shows up here without the user having to re-onboard. Falls back
      // to localStorage on any failure.
      const [remoteProfile] = await Promise.all([
        hydrateProfileFromSupabase(),
        hydrateConversationsFromSupabase(),
      ]);
      if (cancelled) return;
      const p = remoteProfile ?? getProfile();
      // Only bounce if there's genuinely no profile to show (e.g. signed out).
      // Un-onboarded users (missing name/stage — including someone who just
      // continued an anonymous conversation) get a graceful minimal view below
      // instead of being trapped or redirected.
      if (!p) {
        router.replace("/app/chat");
        return;
      }
      setProfile(p);
      setConversations(listConversations().slice(0, 5));
      setMounted(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);


  const greeting = useMemo(
    () => greetingFor(profile?.name ?? undefined, timeBand()),
    [profile?.name],
  );

  if (!mounted || !profile) {
    return <div className="p-6 text-cream/60">loading…</div>;
  }

  // No stage yet (e.g. a continued anon thread that hasn't revealed it): render
  // a graceful, stage-free view with working navigation and a gentle "finish
  // your profile" nudge — never the trapped/blank dashboard. Stage is the key
  // signal for the dashboard/tracker; name is optional (falls back to defaults).
  if (!profile.stage) {
    return (
      <main className="relative min-h-svh bg-midnight pb-10">
        <header className="safe-top flex items-center justify-between px-5 pb-3">
          <span className="text-gradient-peach font-display text-2xl font-black -ml-2 px-2 py-1">
            2am
          </span>
          <Link
            href="/app/settings"
            aria-label="settings"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-peach-gradient font-display text-sm font-semibold text-midnight active:scale-95"
          >
            {(profile.name ?? "m").charAt(0).toUpperCase()}
          </Link>
        </header>

        <section className="px-5 pt-6">
          <div className="rounded-3xl border border-cream/10 bg-navy/60 p-6">
            <h1 className="font-display text-xl font-semibold text-cream">
              finish setting up
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-cream/70">
              tell myla a little about where you are — trying, pregnant, or a new
              mom — so she can tailor things to you. it only takes a sec in the
              chat.
            </p>
            <Link
              href="/app/chat"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-peach-gradient px-5 py-3 text-[14px] font-semibold text-midnight shadow-glow transition active:scale-[0.99]"
            >
              continue with myla
            </Link>
          </div>

          {conversations.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-2 font-mono text-[10px] uppercase tracking-[0.28em] text-cream/55">
                recent
              </h2>
              <div className="flex flex-col gap-2">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setActiveConversationId(c.id);
                      router.push("/app/chat");
                    }}
                    className="truncate rounded-2xl border border-cream/10 bg-navy/60 px-4 py-3 text-left text-[14px] text-cream/80 transition hover:bg-navy active:scale-[0.99]"
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    );
  }

  const initial = (profile.name ?? "m").charAt(0).toUpperCase();
  // Derived live from profile + today's date so the snapshot moves on its own.
  const curWeek =
    profile.stage === "pregnant" ? currentPregnancyWeek(profile) : null;
  const babyAge =
    profile.stage === "postpartum" ? currentBabyAge(profile) : null;

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
        <Link
          href="/app/home"
          aria-label="home"
          className="text-gradient-peach font-display text-2xl font-black rounded-md -ml-2 px-2 py-1 transition hover:opacity-80 active:scale-95"
        >
          2am
        </Link>
        <Link
          href="/app/settings"
          aria-label="settings"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-peach-gradient font-display text-sm font-semibold text-midnight active:scale-95"
        >
          {initial}
        </Link>
      </header>

      {/* Greeting */}
      <section className="px-5 pt-4">
        <h1 className="font-display text-[25px] font-semibold leading-tight text-cream">
          {greeting}
        </h1>
        {profile.stage === "pregnant" && (
          <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-peach">
            <span className="h-[5px] w-[5px] rounded-full bg-peach" />
            {curWeek != null ? `week ${curWeek}` : "pregnant"}
            {profile.dueDate ? ` · due ${formatDueDate(profile.dueDate)}` : ""}
          </p>
        )}
        {profile.stage === "postpartum" && (
          <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-lavender">
            <span className="h-[5px] w-[5px] rounded-full bg-lavender" />
            {babyAge
              ? `baby is ${formatBabyAge(babyAge)}`
              : "first year · you're doing it"}
          </p>
        )}
        {profile.stage === "ttc" && (
          <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-sage">
            <span className="h-[5px] w-[5px] rounded-full bg-sage" />
            trying to conceive
            {profile.monthsTrying !== null
              ? ` · ${profile.monthsTrying} mo in`
              : ""}
          </p>
        )}
      </section>

      {/* Myla check-in */}
      {(() => {
        const effectiveWeek = curWeek ?? profile.week ?? 0;
        const checkInText =
          (profile.stage === "pregnant" &&
            pregnantMilestoneCheckIn(profile, effectiveWeek)) ||
          checkInMessage(profile, effectiveWeek);
        const replyToCheckIn = () => {
          setActiveConversationId(null);
          router.push(
            `/app/chat?new=1&checkin=${encodeURIComponent(checkInText)}`,
          );
        };
        return (
          <section
            className="mx-5 mt-4 border bg-navy p-5"
            style={{
              borderColor: "rgba(255,250,245,0.08)",
              borderRadius: "18px",
            }}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <MylaAvatar size={36} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-peach/80">
                    myla
                  </span>
                  <span className="inline-block h-2 w-2 rounded-full bg-coral" />
                </div>
                <p className="mt-1 text-[15px] leading-relaxed text-cream/90">
                  {checkInText}
                </p>
                <button
                  onClick={replyToCheckIn}
                  className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-peach hover:text-coral"
                >
                  tap to reply →
                </button>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Tracking snapshot — stage-aware, self-updating */}
      <TrackerCard profile={profile} />

      {/* Can I…? */}
      <div className="mx-5 mt-5">
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
                {profile.stage === "ttc"
                  ? "while trying · food, habits, supplements"
                  : profile.stage === "postpartum"
                    ? "postpartum safety · meds, foods, habits"
                    : "quick safety check · food, meds, activities"}
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
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m.key}
              onClick={() => pickMood(m.key)}
              aria-label={m.label}
              className="flex items-center gap-1.5 rounded-full border border-cream/[0.14] bg-white/[0.04] px-3.5 py-2 text-[13px] text-cream/80 active:scale-95"
            >
              <span className="text-[15px]">{m.emoji}</span>
              <span className="lowercase">{m.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <p className="mx-5 mt-10 text-center font-mono text-[11px] text-cream/40">
        myla is a friend, not a doctor.
      </p>
    </main>
  );
}

// Pregnant-stage milestone check-ins. Myla proactively nudges at the right
// moments to capture baby sex intent/result and name brainstorming.
// Returns null when no milestone fits, so the generic check-in can run.
// Weeks chosen conservatively — 16+ for sex (not earlier; insensitive for
// early losses), 25-30 for names (second/third trimester).
function pregnantMilestoneCheckIn(
  p: LocalProfile,
  week: number,
): string | null {
  const name = p.name ? p.name : "you";

  // Week 16-18: first sex conversation — find out or keep it a surprise?
  if (week >= 16 && week <= 18 && !p.babySex) {
    return `hey ${name} — some moms start finding out the sex around now. are you planning to find out, or keeping it a surprise?`;
  }

  // Week 18-22: follow-up if they said they were finding out
  if (week >= 18 && week <= 22 && p.babySex === "finding out") {
    return `hey ${name} — did you find out? boy or girl? or still waiting?`;
  }

  // Week 25-30: nudge toward names (only when sex plan is settled and no
  // name yet). "surprise" counts as settled; "finding out" doesn't.
  const sexSettled =
    p.babySex === "boy" ||
    p.babySex === "girl" ||
    p.babySex === "surprise" ||
    p.babySex === "not sharing";
  if (week >= 25 && week <= 30 && sexSettled && !p.babyName) {
    return `hi ${name} — have you started thinking about names yet?`;
  }

  return null;
}

function checkInMessage(p: LocalProfile, week: number): string {
  const name = p.name ? p.name : "you";
  // The concern is the user's own first-person words; quote it so "you
  // mentioned '...'" reads consistently instead of mixing voices. Strip a
  // trailing period/space so the quote doesn't double-stop ("...anxious." last
  // time.). Blank after stripping → drop the memory clause entirely.
  const rawConcern = p.concerns?.[0];
  const concern = rawConcern ? rawConcern.replace(/[.\s]+$/, "") : "";

  if (p.stage === "pregnant" && week) {
    if (concern) {
      return `thinking about ${name} — you mentioned "${concern}" last time. how's that feeling today?`;
    }
    if (week >= 36) {
      return `hey ${name} — you're in the home stretch 🤍 anything showing up today i can help with?`;
    }
    return `hey ${name} — week ${week} brings its own stuff. anything weird, worrying, or curious today?`;
  }

  if (p.stage === "postpartum") {
    if (concern) {
      return `hi ${name} — you mentioned "${concern}" last time. how's that landing today?`;
    }
    return `hi ${name} — how's your body feeling? and more importantly, how are YOU?`;
  }

  if (p.stage === "ttc") {
    if (concern) {
      return `hey ${name} — you mentioned "${concern}" last time. want to dig into that a little?`;
    }
    if (p.monthsTrying !== null && p.monthsTrying >= 12) {
      return `hey ${name} — a year is a totally reasonable moment to check in with a doctor. want to talk through what to ask?`;
    }
    return `hey ${name} — how's this cycle treating you? anything weird, hopeful, or worrying on your mind?`;
  }

  return `hi ${name} — what's been on your mind today?`;
}

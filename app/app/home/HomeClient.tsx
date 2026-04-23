"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  getProfile,
  hydrateProfileFromSupabase,
  clearProfile,
  type LocalProfile,
} from "@/lib/profile";
import {
  hydrateConversationsFromSupabase,
  listConversations,
  setActiveConversationId,
  type LocalConversation,
} from "@/lib/conversations";
import { createClient } from "@/lib/supabase/client";
import MylaAvatar from "@/components/MylaAvatar";
import {
  babyMilestoneForMonths,
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

const FEATURES: {
  emoji: string;
  title: string;
  desc: string;
  accent: "peach" | "sage" | "lavender" | "gold";
}[] = [
  {
    emoji: "💬",
    title: "ask anything anytime",
    desc: "no question too weird. no topic off-limits. always judgment-free.",
    accent: "peach",
  },
  {
    emoji: "🧠",
    title: "she remembers you",
    desc: "your name, your week, your worries — myla holds the context so you never start over.",
    accent: "lavender",
  },
  {
    emoji: "✅",
    title: "can i…? instant answers",
    desc: "sushi, tylenol, hair dye — yes/no with the source, not a rabbit hole.",
    accent: "sage",
  },
  {
    emoji: "🔒",
    title: "private by design",
    desc: "no google history. no targeted ads. your questions stay yours.",
    accent: "gold",
  },
  {
    emoji: "🌙",
    title: "built for 2am",
    desc: "wide awake and scared to bother anyone? myla's up too.",
    accent: "peach",
  },
  {
    emoji: "🌱",
    title: "trying to first year",
    desc: "cycles, trimesters, milestones — one companion for every chapter.",
    accent: "sage",
  },
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
      // Direct signal-based check: if there's no name or no stage, the
      // user hasn't gone through Myla's onboarding yet. More reliable
      // than the derived `onboardingComplete` flag, which can be stale
      // or missing when the profile was hydrated from a fresh device.
      if (!p || !p.name || !p.stage) {
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
        <Link
          href="/app/home"
          aria-label="home"
          className="text-gradient-peach font-display text-2xl font-black rounded-md -ml-2 px-2 py-1 transition hover:opacity-80 active:scale-95"
        >
          2am
        </Link>
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
        {profile.stage === "postpartum" && (
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-cream/50">
            {profile.babyAgeMonths !== null
              ? `baby is ${profile.babyAgeMonths} ${profile.babyAgeMonths === 1 ? "month" : "months"} old`
              : "first year · you're doing it"}
          </p>
        )}
        {profile.stage === "ttc" && (
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-cream/50">
            trying to conceive
            {profile.monthsTrying !== null
              ? ` · ${profile.monthsTrying} mo in`
              : ""}
          </p>
        )}
      </section>

      {/* Stage card */}
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

      {profile.stage === "postpartum" && (
        <section className="mx-5 mt-5 rounded-3xl border border-peach/20 bg-navy p-5 shadow-[0_0_0_1px_rgba(248,200,168,0.06)]">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-peach/80">
                {profile.babyAgeMonths !== null
                  ? `${profile.babyAgeMonths} months`
                  : "new mom"}
              </div>
              <div className="mt-1 text-[13px] text-cream/60">
                first year · you&apos;re doing it
              </div>
            </div>
            <div className="text-right text-[12px] text-cream/55">
              🤍
            </div>
          </div>
          <p className="mt-4 text-[15px] leading-relaxed text-cream/90">
            {babyMilestoneForMonths(profile.babyAgeMonths ?? 0)}
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-cream/55">
            ranges vary wildly — your baby&apos;s on their own timeline.
          </p>
        </section>
      )}

      {profile.stage === "ttc" &&
        (() => {
          const ttc = ttcCardCopy(profile.monthsTrying);
          return (
            <section className="mx-5 mt-5 rounded-3xl border border-sage/25 bg-navy p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-sage">
                    trying to conceive
                  </div>
                  <div className="mt-1 text-[13px] text-cream/80">
                    {ttc.tagline}
                  </div>
                </div>
                <div className="text-right text-[12px] text-cream/55">
                  {profile.monthsTrying !== null
                    ? `${profile.monthsTrying} mo`
                    : "🌱"}
                </div>
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-cream/90">
                {ttc.body}
              </p>
            </section>
          );
        })()}

      {/* Myla check-in */}
      {(() => {
        const checkInText =
          (profile.stage === "pregnant" &&
            pregnantMilestoneCheckIn(profile)) ||
          checkInMessage(profile);
        const replyToCheckIn = () => {
          setActiveConversationId(null);
          router.push(
            `/app/chat?new=1&checkin=${encodeURIComponent(checkInText)}`,
          );
        };
        return (
          <section className="mx-5 mt-4 rounded-3xl bg-navy/70 p-5">
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

      {/* Features */}
      <section className="mx-5 mt-10">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.28em] text-cream/55">
            what myla can do
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-cream/35">
            scroll
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`rounded-2xl border bg-navy/50 p-4 ${
                f.accent === "peach"
                  ? "border-peach/20"
                  : f.accent === "sage"
                    ? "border-sage/25"
                    : f.accent === "lavender"
                      ? "border-lavender/25"
                      : "border-gold/25"
              }`}
            >
              <div className="text-xl">{f.emoji}</div>
              <div className="mt-2 text-[13px] font-medium lowercase text-cream">
                {f.title}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-cream/55">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <p className="mx-5 mt-8 text-center text-[11px] leading-relaxed text-cream/45">
        myla is a friend, not a doctor. always consult your provider
        for medical decisions.
      </p>
      <p className="mx-5 mt-2 text-center font-mono text-[10px] uppercase tracking-[0.28em] text-cream/30">
        powered by ai
      </p>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={handleSignOut}
          className="font-mono text-[10px] uppercase tracking-[0.28em] text-cream/40 underline decoration-cream/20 underline-offset-4 hover:text-cream/70"
        >
          sign out
        </button>
      </div>
    </main>
  );
}

function ttcCardCopy(monthsTrying: number | null): {
  tagline: string;
  body: string;
} {
  // Default (unknown duration) reads like the earliest stage — hopeful,
  // not clinical. The "you're not behind" framing stops at 12 months; after
  // that we gently bridge to professional care.
  const m = monthsTrying ?? 0;
  if (m < 6) {
    return {
      tagline: "one cycle at a time",
      body: "you're right on track. most couples take a few months — it's completely normal for it not to happen right away. 🌱",
    };
  }
  if (m < 12) {
    return {
      tagline: "still in the window",
      body: "you've been at this for a bit — and that's still within the normal range. 85% of couples conceive within 12 months. hang in there. 💛",
    };
  }
  if (m < 18) {
    return {
      tagline: "you're not alone in this",
      body: "a year is a really reasonable moment to talk to your doctor about next steps — not because anything is wrong, but because they may have tools that can help. you're being smart about this. 💛",
    };
  }
  return {
    tagline: "your journey, your pace",
    body: "you've been on this journey for a while, and that takes real strength. if you haven't already, talking to a fertility specialist could open up options you might not know about. whatever you're feeling right now is valid. 💛",
  };
}

// Pregnant-stage milestone check-ins. Myla proactively nudges at the right
// moments to capture baby sex intent/result and name brainstorming.
// Returns null when no milestone fits, so the generic check-in can run.
// Weeks chosen conservatively — 16+ for sex (not earlier; insensitive for
// early losses), 25-30 for names (second/third trimester).
function pregnantMilestoneCheckIn(p: LocalProfile): string | null {
  const week = p.week ?? 0;
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

function checkInMessage(p: LocalProfile): string {
  const name = p.name ? p.name : "you";
  const concerns = p.concerns?.[0];

  if (p.stage === "pregnant" && p.week) {
    if (concerns) {
      return `thinking about ${name} — last time we talked, ${concerns} was on your mind. how's that feeling today?`;
    }
    if (p.week >= 36) {
      return `hey ${name} — you're in the home stretch 🤍 anything showing up today i can help with?`;
    }
    return `hey ${name} — week ${p.week} brings its own stuff. anything weird, worrying, or curious today?`;
  }

  if (p.stage === "postpartum") {
    if (concerns) {
      return `hi ${name} — you mentioned ${concerns} last time. how's that landing today?`;
    }
    return `hi ${name} — how's your body feeling? and more importantly, how are YOU?`;
  }

  if (p.stage === "ttc") {
    if (concerns) {
      return `hey ${name} — ${concerns} was on your mind last time. want to dig into that a little?`;
    }
    if (p.monthsTrying !== null && p.monthsTrying >= 12) {
      return `hey ${name} — a year is a totally reasonable moment to check in with a doctor. want to talk through what to ask?`;
    }
    return `hey ${name} — how's this cycle treating you? anything weird, hopeful, or worrying on your mind?`;
  }

  return `hi ${name} — what's been on your mind today?`;
}

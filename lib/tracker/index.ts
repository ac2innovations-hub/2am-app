import type { LocalProfile } from "@/lib/profile";
import { calcWeekFromDueDate } from "@/lib/utils";
import pregnancyWeeks from "./pregnancy-weeks.json";
import postpartumMonths from "./postpartum-months.json";

export type PregnancyWeek = {
  size: string;
  developing: string;
  symptoms: string;
};

export type PostpartumMonth = {
  milestone: string;
  expect: string;
};

const WEEKS = pregnancyWeeks as Record<string, PregnancyWeek>;
const MONTHS = postpartumMonths as Record<string, PostpartumMonth>;

const DAY_MS = 24 * 60 * 60 * 1000;
const DAYS_PER_MONTH = 30.44; // average, good enough for an age snapshot

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// Current pregnancy week — advances on its own as time passes.
// Priority: a due date is self-dating, so it wins. Otherwise we take the
// week the user gave at onboarding and add the weeks elapsed since they
// told us (anchored to profile.createdAt). Returns null if we have neither.
export function currentPregnancyWeek(p: LocalProfile): number | null {
  if (p.dueDate) {
    return calcWeekFromDueDate(p.dueDate); // already clamped to 1..42
  }
  if (p.week != null) {
    const anchor = p.createdAt ? new Date(p.createdAt).getTime() : Date.now();
    const elapsedWeeks = Math.floor((Date.now() - anchor) / (7 * DAY_MS));
    return clamp(p.week + Math.max(0, elapsedWeeks), 1, 42);
  }
  return null;
}

export function getPregnancyWeek(week: number): PregnancyWeek | null {
  return WEEKS[String(clamp(Math.round(week), 1, 42))] ?? null;
}

export function trimesterLabel(week: number): string {
  if (week <= 13) return "first trimester";
  if (week <= 27) return "second trimester";
  return "third trimester";
}

export type BabyAge = { months: number; weeks: number };

// Postpartum age — also advances over time. We don't store a birthdate,
// only the age the user gave at onboarding, so we anchor that age to when
// they told us (profile.createdAt) and add elapsed time. Returns both
// months and weeks so the UI can show weeks for very young babies.
export function currentBabyAge(p: LocalProfile): BabyAge | null {
  if (p.babyAgeMonths == null) return null;
  let elapsedDays = 0;
  if (p.createdAt) {
    elapsedDays = Math.max(
      0,
      Math.floor((Date.now() - new Date(p.createdAt).getTime()) / DAY_MS),
    );
  }
  const totalDays = p.babyAgeMonths * DAYS_PER_MONTH + elapsedDays;
  return {
    months: clamp(Math.floor(totalDays / DAYS_PER_MONTH), 0, 60),
    weeks: clamp(Math.floor(totalDays / 7), 0, 320),
  };
}

// The developmental window to surface: the data is keyed by month-of-age
// 1..12. A newborn (0 months) maps to month 1; anything past a year maps
// to month 12 (the data tapers off there).
export function getPostpartumMonth(months: number): PostpartumMonth | null {
  return MONTHS[String(clamp(months === 0 ? 1 : months, 1, 12))] ?? null;
}

// Show weeks while the baby is tiny (under ~3 months), months after that.
export function formatBabyAge(age: BabyAge): string {
  if (age.months < 3) {
    if (age.weeks <= 0) return "newborn";
    return `${age.weeks} ${age.weeks === 1 ? "week" : "weeks"} old`;
  }
  return `${age.months} ${age.months === 1 ? "month" : "months"} old`;
}

export type TtcSnapshot = { label: string; body: string };

// Warm, non-clinical encouragement keyed to how long they've been trying.
// The "you're not behind" framing holds through 12 months, then gently
// bridges toward professional support without alarm.
export function ttcEncouragement(monthsTrying: number | null): TtcSnapshot {
  const m = monthsTrying ?? 0;
  if (m < 6) {
    return {
      label: "one cycle at a time",
      body: "you're right on track. most couples take a few months — it's completely normal for it not to happen right away. 🌱",
    };
  }
  if (m < 12) {
    return {
      label: "still in the window",
      body: "you've been at this a bit, and that's still squarely in the normal range — about 85% of couples conceive within a year. hang in there. 💛",
    };
  }
  if (m < 18) {
    return {
      label: "you're not alone in this",
      body: "a year is a really reasonable moment to talk to your doctor about next steps — not because anything's wrong, but because they may have tools that help. you're being smart about this. 💛",
    };
  }
  return {
    label: "your journey, your pace",
    body: "you've been on this road a while, and that takes real strength. a fertility specialist could open up options you might not know about. whatever you're feeling right now is valid. 💛",
  };
}

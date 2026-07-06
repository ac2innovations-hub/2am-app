"use client";

import { createClient } from "@/lib/supabase/client";
import type { Profile, Stage } from "@/lib/supabase/types";
import { calcWeekFromDueDate } from "@/lib/utils";
import { notifyPushRecheck } from "@/lib/push/signals";

export type LocalProfile = {
  name: string | null;
  stage: Stage | null;
  dueDate: string | null;
  week: number | null;
  babyAgeMonths: number | null;
  babyName: string | null;
  babySex: string | null;
  monthsTrying: number | null;
  firstPregnancy: boolean;
  concerns: string[];
  onboardingComplete: boolean;
  aiConsent: boolean;
  createdAt: string;
};

const KEY = "2am:profile";

// localStorage is the sync source of truth for the UI. When the user is
// authenticated, every write is mirrored to Supabase (fire-and-forget) and
// `hydrateProfileFromSupabase()` pulls the remote row into localStorage on
// mount so devices stay in sync.

export function getProfile(): LocalProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as LocalProfile;
    if (p.dueDate && (p.week === null || p.week === undefined)) {
      p.week = calcWeekFromDueDate(p.dueDate);
    }
    // Profiles saved before the consent flow existed won't have the field.
    if (p.aiConsent === undefined) p.aiConsent = false;
    return p;
  } catch {
    return null;
  }
}

export function saveProfile(p: LocalProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(p));
  void mirrorToSupabase(p);
}

export function updateProfile(patch: Partial<LocalProfile>): LocalProfile {
  const current = getProfile() ?? {
    name: null,
    stage: null,
    dueDate: null,
    week: null,
    babyAgeMonths: null,
    babyName: null,
    babySex: null,
    monthsTrying: null,
    firstPregnancy: true,
    concerns: [],
    onboardingComplete: false,
    aiConsent: false,
    createdAt: new Date().toISOString(),
  };
  const next = { ...current, ...patch };
  if (next.dueDate && !patch.week) {
    next.week = calcWeekFromDueDate(next.dueDate);
  }
  saveProfile(next);
  return next;
}

export function clearProfile() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

// Called from pages that mount while the user might already be signed in.
// Pulls the remote profiles row into localStorage so the rest of the app
// reads the latest data synchronously. Fails silently when offline / no
// session — localStorage remains authoritative.
export async function hydrateProfileFromSupabase(): Promise<LocalProfile | null> {
  if (typeof window === "undefined") return null;
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return getProfile();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !data) return getProfile();

    const remoteLocal = profileRowToLocal(data);
    const merged = mergeProfile(remoteLocal, getProfile());
    localStorage.setItem(KEY, JSON.stringify(merged));
    // The pre-prompt's onboarding gate reads getProfile() synchronously and can
    // run before this write lands on a fresh re-login device. Nudge it to
    // re-evaluate now that the hydrated profile is in localStorage.
    notifyPushRecheck();

    // Onboarded-before-signup: the signup trigger creates an empty profiles
    // row, so `data` has no name/stage but local does. The merge keeps the
    // local answers — push them up so the server row is no longer empty and
    // other devices pick them up. Fire-and-forget; localStorage is already
    // authoritative for the UI.
    const remoteHadOnboarding = isSet(data.name) && isSet(data.stage);
    const mergedHasOnboarding = isSet(merged.name) && isSet(merged.stage);
    if (!remoteHadOnboarding && mergedHasOnboarding) {
      void mirrorToSupabase(merged);
    }

    return merged;
  } catch {
    return getProfile();
  }
}

function isSet(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

// Field-level reconcile between the remote row and whatever is in
// localStorage. The remote value wins for any field the server actually
// has (so a profile edited on another device still propagates here); for
// fields the server hasn't got yet, the local value is kept. Without this,
// hydrate would overwrite a user who completed Myla's onboarding *before*
// signing up with the blank row the signup trigger creates.
function mergeProfile(
  remote: LocalProfile,
  local: LocalProfile | null,
): LocalProfile {
  if (!local) return remote;
  const pick = <K extends keyof LocalProfile>(k: K): LocalProfile[K] =>
    isSet(remote[k]) ? remote[k] : local[k];
  const remotePopulated = isSet(remote.name) || isSet(remote.stage);
  return {
    name: pick("name"),
    stage: pick("stage"),
    dueDate: pick("dueDate"),
    week: pick("week"),
    babyAgeMonths: pick("babyAgeMonths"),
    babyName: pick("babyName"),
    babySex: pick("babySex"),
    monthsTrying: pick("monthsTrying"),
    // A real `false` is meaningful for a boolean, so only defer to the
    // remote value when the remote row is otherwise populated.
    firstPregnancy: remotePopulated
      ? remote.firstPregnancy
      : local.firstPregnancy,
    concerns: pick("concerns"),
    onboardingComplete: local.onboardingComplete || remote.onboardingComplete,
    // Consent is sticky — once given on any device it stays given.
    aiConsent: remote.aiConsent || local.aiConsent,
    // Keep the earliest known creation time.
    createdAt:
      local.createdAt && local.createdAt < remote.createdAt
        ? local.createdAt
        : remote.createdAt,
  };
}

function profileRowToLocal(row: Profile): LocalProfile {
  const existing = getProfile();
  return {
    name: row.name ?? null,
    stage: row.stage ?? null,
    dueDate: row.due_date ?? null,
    week:
      row.week ??
      (row.due_date ? calcWeekFromDueDate(row.due_date) : null),
    babyAgeMonths: row.baby_age_months ?? null,
    babyName: row.baby_name ?? null,
    babySex: row.baby_sex ?? null,
    monthsTrying: row.months_trying ?? null,
    firstPregnancy: row.first_pregnancy ?? true,
    concerns: row.concerns ?? [],
    // onboardingComplete isn't on the remote row — infer it from whether
    // we have the core fields the onboarding flow collects, but prefer
    // the locally-cached value when present so we don't regress a user
    // who's mid-flow on a different device.
    onboardingComplete:
      existing?.onboardingComplete ??
      Boolean(row.name && row.stage && row.concerns && row.concerns.length > 0),
    aiConsent: row.ai_consent ?? existing?.aiConsent ?? false,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

// Grant AI-processing consent and ensure it reaches the DB before returning,
// so the server-side consent gate on /api/chat sees it on the user's first
// message. Falls back to the local write if the remote upsert can't complete
// (offline); the server gate then surfaces a retry rather than sending data.
export async function acceptAiConsent(): Promise<LocalProfile> {
  const next = updateProfile({ aiConsent: true });
  await mirrorToSupabase(next);
  return next;
}

async function mirrorToSupabase(p: LocalProfile) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").upsert(
      {
        id: user.id,
        name: p.name,
        stage: p.stage,
        due_date: p.dueDate,
        week: p.week,
        baby_age_months: p.babyAgeMonths,
        baby_name: p.babyName,
        baby_sex: p.babySex,
        months_trying: p.monthsTrying,
        first_pregnancy: p.firstPregnancy,
        concerns: p.concerns,
        ai_consent: p.aiConsent,
      },
      { onConflict: "id" },
    );
  } catch {
    // Silent — localStorage already has the write, we'll retry on next edit.
  }
}

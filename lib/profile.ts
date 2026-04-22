"use client";

import { createClient } from "@/lib/supabase/client";
import type { Profile, Stage } from "@/lib/supabase/types";
import { calcWeekFromDueDate } from "@/lib/utils";

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

    const local = profileRowToLocal(data);
    localStorage.setItem(KEY, JSON.stringify(local));
    return local;
  } catch {
    return getProfile();
  }
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
    createdAt: row.created_at ?? new Date().toISOString(),
  };
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
      },
      { onConflict: "id" },
    );
  } catch {
    // Silent — localStorage already has the write, we'll retry on next edit.
  }
}

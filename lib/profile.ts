"use client";

import type { Stage } from "@/lib/supabase/types";
import { calcWeekFromDueDate } from "@/lib/utils";

export type LocalProfile = {
  name: string | null;
  stage: Stage | null;
  dueDate: string | null;
  week: number | null;
  babyAgeMonths: number | null;
  firstPregnancy: boolean;
  concerns: string[];
  onboardingComplete: boolean;
  createdAt: string;
};

const KEY = "2am:profile";

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
}

export function updateProfile(patch: Partial<LocalProfile>): LocalProfile {
  const current = getProfile() ?? {
    name: null,
    stage: null,
    dueDate: null,
    week: null,
    babyAgeMonths: null,
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

// Server-authoritative answer to "may we show the soft pre-prompt sheet?".
// The client passes the first conversation's seeding mood; everything else
// (loss / pause / recent distress / prompt-already-seen) comes from the
// authenticated user's own profile row (RLS-scoped). The decision logic is the
// shared canShowPrePrompt gate, so client and scheduler can never disagree.

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { canShowPrePrompt, type PushState } from "@/lib/push/state";
import { PUSH_STATE_COLUMNS } from "@/lib/push/send";
import type { Mood } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MOODS: ReadonlySet<string> = new Set([
  "great",
  "okay",
  "meh",
  "rough",
  "anxious",
]);

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ show: false, reason: "not_authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(PUSH_STATE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) {
    return NextResponse.json({ show: false, reason: "no_profile" });
  }

  const moodParam = new URL(req.url).searchParams.get("mood");
  const firstChatMood: Mood | null =
    moodParam && MOODS.has(moodParam) ? (moodParam as Mood) : null;

  const decision = canShowPrePrompt(profile as PushState, { firstChatMood });
  return NextResponse.json({ show: decision.ok, reason: decision.reason });
}

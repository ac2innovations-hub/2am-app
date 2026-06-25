// Records the outcome of the soft pre-prompt so we never re-nag. "asked" = we
// fired the OS dialog; "dismissed" = soft no (we never touched the OS prompt, so
// it isn't burned); "denied" = OS dialog returned not-granted. A successful
// device registration sets "granted" from /api/push/register instead.
//
// Uses the authenticated client — the profiles "self update" RLS policy scopes
// the write to the caller's own row.

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set(["asked", "dismissed", "denied"]);

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  let body: { action?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (typeof body.action !== "string" || !ALLOWED.has(body.action)) {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ push_prompt_state: body.action })
    .eq("id", user.id);
  if (error) {
    console.error("/api/push/prompt: update failed: %s", error.message);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

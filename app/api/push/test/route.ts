// Phase-1 milestone tool: send one real push to the authenticated caller's own
// devices, so we can prove the APNs round-trip end to end. Secret-gated exactly
// like /api/health (PUSH_TEST_SECRET via x-push-test-secret header or ?key=),
// AND requires a logged-in session so it can only ever push to yourself.
//
// `force: true` bypasses the loss/pause/quiet-hours gate so a test always lands
// — the gate itself is exercised by the real (Phase-3) send path. Dead-token
// cleanup still runs.

import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function secretMatches(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  const secret = process.env.PUSH_TEST_SECRET;
  const provided =
    req.headers.get("x-push-test-secret") ??
    new URL(req.url).searchParams.get("key");
  if (!secret || !secretMatches(provided, secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const summary = await sendPushToUser(
    user.id,
    "gentle_checkin",
    {
      title: "myla",
      body: "just checking in — this is a test 💛",
      data: { type: "test" },
    },
    { force: true },
  );

  return NextResponse.json({ ok: true, summary });
}

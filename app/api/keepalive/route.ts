import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Pinged once a day by a Vercel cron (see vercel.json). A free-tier Supabase
// project pauses after a week of inactivity; a trivial read keeps it warm.
export async function GET() {
  try {
    const supabase = createServerSupabase();

    // Minimal read against an existing table. RLS may filter all rows for an
    // unauthenticated request — that's fine: an empty result with no error
    // still means the database answered, which is all we need here.
    const { error } = await supabase.from("profiles").select("id").limit(1);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Keep the detail in server logs only — don't leak DB internals to callers.
    console.error("/api/keepalive failed: %s", message);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

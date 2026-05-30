import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Permanently deletes the caller's account. Required by Apple App Store
// guideline 5.1.1(v): apps that support account creation must let users
// delete their account from within the app. CASCADE on auth.users wipes
// profiles, conversations, and mood_logs — see supabase/schema.sql.
export async function DELETE() {
  const supabase = createServerSupabase();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("/api/account: SUPABASE_SERVICE_ROLE_KEY is not configured");
    return NextResponse.json(
      { error: "server_misconfigured" },
      { status: 500 },
    );
  }

  const admin = createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  if (delErr) {
    console.error("/api/account: delete failed for %s: %s", user.id, delErr.message);
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }

  // Clear the session cookie now that the auth row is gone.
  try {
    await supabase.auth.signOut();
  } catch {
    // The session already references a deleted user; cookie clears either way.
  }

  return NextResponse.json({ ok: true });
}

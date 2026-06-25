// Stores a device's APNs token for the authenticated user, then flips the
// notification master switch on (registration implies the OS permission was
// granted) and records the device timezone for the quiet-hours gate.
//
// Service-role upsert by token: a device hands its token to whoever is logged
// in, so on a re-login the row's old user_id would block the owner-scoped RLS
// update. This route is the trusted boundary — user_id is always the
// authenticated caller, never client-supplied — so a service-role upsert is the
// correct way to reassign the token. RLS still protects all direct table access.

import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidToken(t: unknown): t is string {
  return typeof t === "string" && /^[a-fA-F0-9]{32,256}$/.test(t);
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  let body: {
    token?: unknown;
    environment?: unknown;
    timezone?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!isValidToken(body.token)) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }
  const token = body.token;

  // Environment comes from the client when it knows it; otherwise fall back to
  // the server default (set APNS_DEFAULT_ENVIRONMENT=sandbox while testing dev
  // builds). The sender self-heals a wrong guess on first send.
  const environment =
    body.environment === "sandbox" || body.environment === "production"
      ? body.environment
      : process.env.APNS_DEFAULT_ENVIRONMENT === "sandbox"
        ? "sandbox"
        : "production";

  const timezone =
    typeof body.timezone === "string" && body.timezone.length <= 64
      ? body.timezone
      : null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("/api/push/register: SUPABASE_SERVICE_ROLE_KEY not configured");
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }
  const admin = createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const nowIso = new Date().toISOString();
  const { error: upsertErr } = await admin.from("push_devices").upsert(
    {
      user_id: user.id,
      token,
      environment,
      platform: "ios",
      last_seen_at: nowIso,
      disabled_at: null,
      disabled_reason: null,
      updated_at: nowIso,
    },
    { onConflict: "token" },
  );
  if (upsertErr) {
    console.error("/api/push/register: upsert failed: %s", upsertErr.message);
    return NextResponse.json({ error: "register_failed" }, { status: 500 });
  }

  const profilePatch: Record<string, unknown> = {
    notifications_enabled: true,
    push_prompt_state: "granted",
    last_active_at: nowIso,
  };
  if (timezone) profilePatch.timezone = timezone;
  const { error: profileErr } = await admin
    .from("profiles")
    .update(profilePatch)
    .eq("id", user.id);
  if (profileErr) {
    // Token is stored; the master switch just didn't flip. Log and continue —
    // the user can still enable from settings, and re-register fixes it.
    console.error(
      "/api/push/register: profile update failed for %s: %s",
      user.id,
      profileErr.message,
    );
  }

  return NextResponse.json({ ok: true, environment });
}

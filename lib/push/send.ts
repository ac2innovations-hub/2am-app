// The single send chokepoint. EVERY push — the Phase-1 manual test and the
// Phase-3 scheduler alike — goes through sendPushToUser(), so the loss/pause/
// quiet-hours gate (canSend) and dead-token cleanup live in exactly one place.
//
// Uses the service-role client: it reads state + tokens across users and writes
// token health. Node `nodejs` runtime only (pulls in node:http2 via apns).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { canSend, type NotificationType, type PushState } from "./state";
import {
  sendApns,
  type ApnsEnvironment,
  type ApnsNotification,
} from "./apns";

// The exact columns canSend / canShowPrePrompt need. Shared so routes that read
// state (eligibility) select the same shape.
export const PUSH_STATE_COLUMNS =
  "notifications_enabled, push_paused, loss_at, last_distress_at, last_active_at, timezone, notify_window_start, notify_window_end, push_prompt_state";

function adminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type SendSummary = {
  attempted: number;
  sent: number;
  gated?: string; // set when canSend (or a precondition) blocked the whole send
  outcomes: { token: string; outcome: string; reason?: string }[];
};

function otherEnv(env: ApnsEnvironment): ApnsEnvironment {
  return env === "production" ? "sandbox" : "production";
}

/**
 * Send `notification` of `type` to all of a user's active devices, after the
 * gate. `opts.force` bypasses the gate (dev test only) — it never bypasses
 * token health handling.
 */
export async function sendPushToUser(
  userId: string,
  type: NotificationType,
  notification: ApnsNotification,
  opts: { force?: boolean } = {},
): Promise<SendSummary> {
  const db = adminClient();
  if (!db) {
    console.error("[push] SUPABASE_SERVICE_ROLE_KEY not configured");
    return { attempted: 0, sent: 0, gated: "server_misconfigured", outcomes: [] };
  }

  const { data: profile } = await db
    .from("profiles")
    .select(PUSH_STATE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return { attempted: 0, sent: 0, gated: "no_profile", outcomes: [] };

  if (!opts.force) {
    const decision = canSend(profile as PushState, type);
    if (!decision.ok) {
      console.info(
        "[push] gated send user=%s type=%s reason=%s",
        userId,
        type,
        decision.reason,
      );
      return { attempted: 0, sent: 0, gated: decision.reason, outcomes: [] };
    }
  }

  const { data: devices } = await db
    .from("push_devices")
    .select("id, token, environment")
    .eq("user_id", userId)
    .is("disabled_at", null);
  if (!devices || devices.length === 0) {
    return { attempted: 0, sent: 0, gated: "no_devices", outcomes: [] };
  }

  const nowIso = new Date().toISOString();
  const outcomes: SendSummary["outcomes"] = [];
  let sent = 0;

  for (const d of devices) {
    const env = d.environment as ApnsEnvironment;
    let res = await sendApns({ token: d.token, environment: env }, notification);

    // Self-heal a stored-environment mismatch: if the token was wrong for its
    // host, try the other environment once and persist it if that lands.
    if (res.outcome === "bad_device_token") {
      const flipped = otherEnv(env);
      const retry = await sendApns(
        { token: d.token, environment: flipped },
        notification,
      );
      if (retry.ok) {
        await db
          .from("push_devices")
          .update({ environment: flipped, updated_at: nowIso })
          .eq("id", d.id);
      }
      res = retry;
    }

    if (res.ok) {
      sent++;
      await db
        .from("push_devices")
        .update({ last_seen_at: nowIso })
        .eq("id", d.id);
    } else if (res.shouldDisableToken) {
      await db
        .from("push_devices")
        .update({ disabled_at: nowIso, disabled_reason: res.outcome })
        .eq("id", d.id);
    }

    outcomes.push({
      token: `${d.token.slice(0, 8)}…`,
      outcome: res.outcome,
      reason: res.reason,
    });
  }

  return { attempted: devices.length, sent, outcomes };
}

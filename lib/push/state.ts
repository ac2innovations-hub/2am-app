// The notification state model + the single gate every send passes through.
//
// This is intentionally a pure module (no DB, no I/O) so the loss/pause/
// quiet-hours rules are trivially testable and identical on the server (the
// scheduler, Phase 3) and in the pre-prompt eligibility check. The DB shape it
// reads is `PushState`; routes select exactly PUSH_STATE_COLUMNS into it.

import type { Mood } from "@/lib/supabase/types";

export type NotificationType =
  | "stage"
  | "milestone"
  | "inactivity"
  | "gentle_checkin"
  | "support";

// Types that assume engagement or reference the baby / weeks / milestones.
// A loss or a pause must suppress exactly these; gentle check-ins and explicit
// support messages stay safe in any state.
const ASSUMPTION_BASED: ReadonlySet<NotificationType> = new Set([
  "stage",
  "milestone",
  "inactivity",
]);

function isSupportSafe(type: NotificationType): boolean {
  return !ASSUMPTION_BASED.has(type);
}

export const LOSS_QUIET_DAYS = 7;
export const SEND_DISTRESS_QUIET_HOURS = 48;
export const PREPROMPT_DISTRESS_QUIET_HOURS = 72;
export const DEFAULT_NOTIFY_WINDOW_START = 9; // 09:00 local, inclusive
export const DEFAULT_NOTIFY_WINDOW_END = 21; // 21:00 local, exclusive
// Used only when a device hasn't reported a timezone yet. The register route
// captures the device tz, so this fallback is rare — but we never want to risk
// a 3am buzz against an unknown clock, so we still apply *a* window.
export const DEFAULT_TIMEZONE = "America/New_York";

export type PromptState =
  | "unseen"
  | "asked"
  | "granted"
  | "denied"
  | "dismissed";

export type PushState = {
  notifications_enabled: boolean;
  push_paused: boolean;
  loss_at: string | null;
  last_distress_at: string | null;
  last_active_at: string | null;
  timezone: string | null;
  notify_window_start: number | null;
  notify_window_end: number | null;
  push_prompt_state: PromptState | null;
};

export type Decision = { ok: boolean; reason: string };

const ALLOW: Decision = { ok: true, reason: "ok" };
const deny = (reason: string): Decision => ({ ok: false, reason });

function hoursSince(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return (now.getTime() - t) / 3_600_000;
}

// Local wall-clock hour (0–23) in a timezone, via Intl. Falls back to the
// default tz, then to UTC, rather than ever throwing.
export function localHour(now: Date, timezone: string | null): number {
  const tz = timezone || DEFAULT_TIMEZONE;
  try {
    const formatted = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: tz,
    }).format(now);
    const n = parseInt(formatted, 10) % 24; // "24" → 0 for midnight
    return Number.isNaN(n) ? now.getUTCHours() : n;
  } catch {
    return now.getUTCHours();
  }
}

function withinNotifyWindow(state: PushState, now: Date): boolean {
  const start = state.notify_window_start ?? DEFAULT_NOTIFY_WINDOW_START;
  const end = state.notify_window_end ?? DEFAULT_NOTIFY_WINDOW_END;
  const hour = localHour(now, state.timezone);
  // Normal daytime window (start < end): inside [start, end).
  if (start <= end) return hour >= start && hour < end;
  // Wrapped window (e.g. 21–6) — supported so a custom evening window can't
  // silently invert; allowed outside [end, start).
  return hour >= start || hour < end;
}

/**
 * The single gate every send passes through. Returns ok:false with a stable
 * reason string the caller logs. Order is deliberate:
 *   1. master switch
 *   2. loss → quiet period, then permanent support-mode
 *   3. user pause → support-mode
 *   4. recent in-conversation distress (Myla escalated) → hold milestones
 *   5. quiet hours → applies to EVERY type, including support (no 3am buzz)
 */
export function canSend(
  state: PushState,
  type: NotificationType,
  now: Date = new Date(),
): Decision {
  if (!state.notifications_enabled) return deny("notifications_disabled");

  if (state.loss_at) {
    const lossHours = hoursSince(state.loss_at, now);
    if (lossHours !== null) {
      // A fresh loss opens a quiet period: nothing at all for LOSS_QUIET_DAYS,
      // unless the user has re-engaged since the loss (then we may gently
      // support). Engagement is tracked by last_active_at.
      const engagedSinceLoss =
        !!state.last_active_at &&
        Date.parse(state.last_active_at) > Date.parse(state.loss_at);
      if (lossHours < LOSS_QUIET_DAYS * 24 && !engagedSinceLoss) {
        return deny("loss_quiet_period");
      }
      // After the quiet period we stay in support-mode indefinitely — never a
      // milestone/stage/inactivity nudge again for this loss.
      if (!isSupportSafe(type)) return deny("loss_support_mode");
    }
  }

  if (state.push_paused && !isSupportSafe(type)) return deny("paused");

  const distressHours = hoursSince(state.last_distress_at, now);
  if (
    distressHours !== null &&
    distressHours < SEND_DISTRESS_QUIET_HOURS &&
    !isSupportSafe(type)
  ) {
    return deny("recent_distress");
  }

  if (!withinNotifyWindow(state, now)) return deny("quiet_hours");

  return ALLOW;
}

export type PrePromptSignals = {
  // The seeding mood of the user's first conversation, if any. `null` means no
  // mood signal at all — treated as unknown and therefore suppressed.
  firstChatMood: Mood | null;
};

const HARD_MOODS: ReadonlySet<Mood> = new Set<Mood>(["rough", "anxious"]);

/**
 * Pre-prompt suppression gate — a STRICTER superset of canSend. We only offer
 * the "want gentle check-ins from myla?" sheet at a genuinely light moment.
 * Suppress after a loss, a pause, a recent escalation, or a hard/!known first
 * message. Unknown signals suppress (fail-safe): a missed prompt is cheap, a
 * prompt on the heels of a hard moment is not. Note this does NOT require
 * notifications_enabled (it's how the user gets there) — instead it requires a
 * clean, first-time prompt state.
 */
export function canShowPrePrompt(
  state: PushState,
  signals: PrePromptSignals,
  now: Date = new Date(),
): Decision {
  // Auto-offer only once, on a clean first impression. Any prior outcome
  // (granted/denied/asked/dismissed) routes the user to the settings toggle.
  if (state.push_prompt_state && state.push_prompt_state !== "unseen") {
    return deny("already_prompted");
  }
  if (state.notifications_enabled) return deny("already_enabled");

  if (state.loss_at) return deny("loss");
  if (state.push_paused) return deny("paused");

  const distressHours = hoursSince(state.last_distress_at, now);
  if (
    distressHours !== null &&
    distressHours < PREPROMPT_DISTRESS_QUIET_HOURS
  ) {
    return deny("recent_distress");
  }

  // Mood must be present AND light. Unknown (null) or hard → suppress.
  if (signals.firstChatMood === null) return deny("mood_unknown");
  if (HARD_MOODS.has(signals.firstChatMood)) return deny("mood_hard");

  return ALLOW;
}

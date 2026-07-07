"use client";

// Client-side push registration, used only inside the native app (guarded by
// isPushPluginAvailable — must be native AND ship the push plugin). The OS
// permission dialog is fired ONLY from enablePush(), which the pre-prompt sheet
// calls after a soft "yes" — so a soft "no" never burns the one-shot iOS prompt.

import { PushNotifications } from "@capacitor/push-notifications";
import { isPushPluginAvailable } from "@/lib/isCapacitor";
import { pushDebugLog, isPushDebugEnabled } from "@/lib/push/debug";

let listenersWired = false;

// TEMPORARY (debug overlay): compact error string for verbatim logging.
function errStr(err: unknown): string {
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err);
}

async function postToken(value: string): Promise<void> {
  try {
    const timezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
    // The web deployment serves both dev and prod app builds, so it can't know
    // the APNs environment on its own; send it only if a build-time hint is
    // present, otherwise let the server default decide (and self-heal on send).
    const envHint = process.env.NEXT_PUBLIC_APNS_ENVIRONMENT;
    const environment =
      envHint === "sandbox" || envHint === "production" ? envHint : undefined;
    const res = await fetch("/api/push/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: value, environment, timezone }),
    });
    const body = isPushDebugEnabled()
      ? await res.text().catch(() => "(body read failed)")
      : "";
    pushDebugLog(`register → HTTP ${res.status} · ${body}`);
  } catch (err) {
    pushDebugLog(`register → threw ${errStr(err)}`);
    console.error("[push] token registration POST failed", err);
  }
}

/**
 * Request OS permission and, if granted, register with APNs and ship the token
 * to the server. Returns a coarse result for the caller's UI. No-ops (and
 * reports not_native) outside the Capacitor app.
 */
export async function enablePush(): Promise<{ ok: boolean; reason?: string }> {
  if (!isPushPluginAvailable()) return { ok: false, reason: "not_native" };
  try {
    let perm = await PushNotifications.checkPermissions();
    if (
      perm.receive === "prompt" ||
      perm.receive === "prompt-with-rationale"
    ) {
      perm = await PushNotifications.requestPermissions();
      pushDebugLog(`requestPermissions → ${JSON.stringify(perm)}`);
    }
    if (perm.receive !== "granted") {
      void recordPromptOutcome("denied");
      return { ok: false, reason: "permission_denied" };
    }

    if (!listenersWired) {
      listenersWired = true;
      await PushNotifications.addListener("registration", (token) => {
        pushDebugLog(
          `registration event: len=${token.value.length} head=${token.value.slice(0, 8)}`,
        );
        void postToken(token.value);
      });
      await PushNotifications.addListener("registrationError", (err) => {
        pushDebugLog(`registrationError: ${JSON.stringify(err)}`);
        console.error("[push] APNs registrationError", err);
      });
    }
    await PushNotifications.register();
    return { ok: true };
  } catch (err) {
    console.error("[push] enablePush failed", err);
    return { ok: false, reason: "error" };
  }
}

/** Record the soft pre-prompt outcome so we never auto-ask again. */
export async function recordPromptOutcome(
  action: "asked" | "dismissed" | "denied",
): Promise<void> {
  try {
    const res = await fetch("/api/push/prompt", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const body = isPushDebugEnabled()
      ? await res.text().catch(() => "(body read failed)")
      : "";
    pushDebugLog(`prompt(${action}) → HTTP ${res.status} · ${body}`);
  } catch (err) {
    pushDebugLog(`prompt(${action}) → threw ${errStr(err)}`);
    /* best-effort */
  }
}

/** Server-authoritative check of whether the soft pre-prompt may be shown. */
export async function fetchPrePromptEligibility(
  mood: string | null,
): Promise<boolean> {
  try {
    const q = mood ? `?mood=${encodeURIComponent(mood)}` : "";
    const res = await fetch(`/api/push/eligibility${q}`);
    if (!res.ok) return false;
    const json = (await res.json()) as { show?: boolean };
    return Boolean(json.show);
  } catch {
    return false;
  }
}

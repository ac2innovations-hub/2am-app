"use client";

// The soft pre-prompt sheet. Shows only inside the native app, only after
// onboarding + the first post-onboarding message, and only when the server's
// eligibility gate (loss / pause / recent distress / first-chat mood) says it's
// a light enough moment. Tapping "yes" is the ONLY path that fires the real iOS
// permission dialog; "not now" records a soft dismissal and never touches it.

import { useEffect, useState } from "react";
import { isPushPluginAvailable } from "@/lib/isCapacitor";
import { getProfile } from "@/lib/profile";
import {
  enablePush,
  fetchPrePromptEligibility,
  recordPromptOutcome,
} from "@/lib/push/client";
import {
  firstChatMood,
  hasSentFirstMessage,
  markPrePromptDecided,
  prePromptDecided,
  PUSH_RECHECK_EVENT,
} from "@/lib/push/signals";
import { pushDebugLog } from "@/lib/push/debug";

export default function PushPrePrompt() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Re-runnable so the sheet is reactive, not mount-once: the gates below
    // depend on signals that land after this component mounts — the first
    // post-onboarding message (sentFirst) and, on a re-login device, the
    // profile hydrating from Supabase. Both fire PUSH_RECHECK_EVENT, and we
    // re-read getProfile() each time so gate 3 sees the hydrated profile.
    const evaluate = async () => {
      if (cancelled) return;
      // Gate on actual plugin availability, not just "is native" — older live
      // binaries are inside Capacitor but lack the push plugin. Showing the
      // sheet there would burn the one-shot opt-in on a call that can only fail.
      // (pushDebugLog is inert unless ?pushdebug=1 — it changes no behavior.)
      if (!isPushPluginAvailable()) return void pushDebugLog("plugin_unavailable");
      if (prePromptDecided()) return void pushDebugLog("already_decided");
      const profile = getProfile();
      if (!profile?.onboardingComplete)
        return void pushDebugLog("onboarding_incomplete");
      if (!hasSentFirstMessage()) return void pushDebugLog("no_first_message");

      const eligible = await fetchPrePromptEligibility(firstChatMood());
      if (cancelled) return;
      pushDebugLog(eligible ? "all_passed" : "eligibility_false");
      if (eligible) setShow(true);
    };

    void evaluate();
    const onRecheck = () => void evaluate();
    window.addEventListener(PUSH_RECHECK_EVENT, onRecheck);
    return () => {
      cancelled = true;
      window.removeEventListener(PUSH_RECHECK_EVENT, onRecheck);
    };
  }, []);

  if (!show) return null;

  const onYes = async () => {
    if (busy) return;
    setBusy(true);
    const res = await enablePush();
    // Burn the device's one-shot prompt only on a TERMINAL outcome: a real
    // grant (the register route records "granted" server-side) or an explicit
    // OS denial (enablePush records "denied"). Transient failures — no plugin
    // yet, or a thrown error — leave both the client flag and the server
    // prompt-state untouched, so a later session can retry instead of the
    // opt-in being permanently lost.
    if (res.ok || res.reason === "permission_denied") {
      markPrePromptDecided();
    }
    setShow(false);
  };

  const onNo = async () => {
    if (busy) return;
    setBusy(true);
    // "Not now" is a terminal, user-driven dismissal — safe to decide.
    markPrePromptDecided();
    await recordPromptOutcome("dismissed");
    setShow(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="notification opt-in"
      className="fixed inset-0 z-50 flex items-end justify-center bg-midnight/70 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm"
    >
      <div className="w-full max-w-md animate-slide-up rounded-3xl border border-cream/10 bg-navy px-6 py-7 shadow-glow">
        <p className="mb-2 font-display text-[20px] font-bold leading-snug text-cream">
          want gentle check-ins from myla? 💛
        </p>
        <p className="mb-6 text-[14px] leading-relaxed text-cream/75">
          i&apos;ll only nudge you a couple times a week — never in the middle of
          the night. you can change this anytime in settings.
        </p>
        <button
          type="button"
          onClick={onYes}
          disabled={busy}
          className="mb-3 flex w-full items-center justify-center rounded-full bg-peach-gradient px-6 py-4 text-[15px] font-semibold text-midnight shadow-glow transition active:scale-[0.98] disabled:opacity-60"
        >
          yes, that sounds nice
        </button>
        <button
          type="button"
          onClick={onNo}
          disabled={busy}
          className="flex w-full items-center justify-center rounded-full px-6 py-3 text-[14px] font-medium text-cream/60 transition active:scale-[0.98] disabled:opacity-60"
        >
          not now
        </button>
      </div>
    </div>
  );
}

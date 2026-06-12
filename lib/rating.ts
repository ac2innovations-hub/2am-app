// In-app App Store rating prompt, native-only.
//
// The iOS app loads the live site into a WKWebView (capacitor.config.ts
// server.url), so the marketing bundle never imports @capacitor/* directly.
// Instead the native bridge injects window.Capacitor at runtime; we call the
// InAppReview plugin through that global. In a normal browser every call
// here is a silent no-op.
//
// Requirements for this to fire on device:
//   @capacitor-community/in-app-review is in package.json (done) and the
//   iOS project has been re-synced + rebuilt: `npx cap sync ios`, then a
//   new build submitted via Xcode. Until that build ships, this code is
//   dormant — safe to deploy any time.
//
// Prompt policy (deliberately conservative — Apple also hard-caps the
// system sheet at 3 displays per user per year):
//   - only inside the native app
//   - only after the user has sent at least MIN_MESSAGES messages
//   - never during onboarding (caller's responsibility)
//   - never if the latest myla reply looks like a crisis/escalation
//     conversation (caller passes the reply text for a cheap check)
//   - at most once every 120 days, tracked in localStorage
import { isInsideCapacitor } from "@/lib/isCapacitor";
import { track } from "@/lib/analytics";

const STORAGE_KEY = "2am_rating_prompted_at";
const MIN_MESSAGES = 5;
const COOLDOWN_DAYS = 120;

const CRISIS_MARKERS = [
  "988",
  "911",
  "emergency room",
  "go to the er",
  "crisis",
  "right away",
  "call your doctor now",
];

function looksLikeCrisisReply(replyText: string): boolean {
  const t = replyText.toLowerCase();
  return CRISIS_MARKERS.some((m) => t.includes(m));
}

type InAppReviewPlugin = { requestReview: () => Promise<void> };

function getPlugin(): InAppReviewPlugin | null {
  if (typeof window === "undefined") return null;
  const cap = (
    window as {
      Capacitor?: { Plugins?: { InAppReview?: InAppReviewPlugin } };
    }
  ).Capacitor;
  return cap?.Plugins?.InAppReview ?? null;
}

export function maybeRequestReview(opts: {
  userMessageCount: number;
  latestReply: string;
}): void {
  try {
    if (!isInsideCapacitor()) return;
    if (opts.userMessageCount < MIN_MESSAGES) return;
    if (looksLikeCrisisReply(opts.latestReply)) return;

    const last = localStorage.getItem(STORAGE_KEY);
    if (last) {
      const elapsedDays = (Date.now() - Number(last)) / 86_400_000;
      if (elapsedDays < COOLDOWN_DAYS) return;
    }

    const plugin = getPlugin();
    if (!plugin) return; // native build without the pod yet

    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    track("rating_prompt_requested");
    // Fire and forget — iOS decides whether the sheet actually appears.
    void plugin.requestReview();
  } catch {
    // Never let a rating prompt break the chat.
  }
}

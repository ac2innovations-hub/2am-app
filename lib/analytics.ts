// Lightweight PostHog wrapper. Safe to import anywhere — every function
// no-ops on the server, in Capacitor builds without a key, or when the
// NEXT_PUBLIC_POSTHOG_KEY env var is missing. Never throws.
//
// Privacy posture (this audience asks sensitive questions):
// - we identify users by their Supabase UUID only — never email or name
// - no session recording
// - message CONTENT is never sent to analytics, only counts/flags
import posthog from "posthog-js";

let initialized = false;

export function initAnalytics(): void {
  if (initialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    capture_pageview: false, // we capture manually on route change
    disable_session_recording: true,
    person_profiles: "identified_only",
    respect_dnt: true,
  });
  initialized = true;
}

export function trackPageview(path: string): void {
  if (!initialized) return;
  posthog.capture("$pageview", { $current_url: window.location.origin + path });
}

export function track(
  event: string,
  props?: Record<string, string | number | boolean>,
): void {
  if (!initialized) return;
  posthog.capture(event, props);
}

export function identify(userId: string): void {
  if (!initialized) return;
  posthog.identify(userId);
}

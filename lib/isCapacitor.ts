// Detects whether the page is running inside the native iOS app. Capacitor
// loads the live site into a WKWebView, so client-only marketing affordances
// (App Store badges, the tester waitlist) need to know they're in-app and
// hide themselves. Browser-only — returns false during SSR.
export function isInsideCapacitor(): boolean {
  if (typeof window === "undefined") return false;
  // The native bridge injects a global `Capacitor` object into the WebView.
  // The marketing site never bundles @capacitor/core, so this global is
  // present only when the page is hosted by the native app.
  const cap = (window as { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor;
  if (cap) {
    return typeof cap.isNativePlatform === "function"
      ? cap.isNativePlatform()
      : true;
  }
  // Fallback for builds that append a Capacitor token to the user agent.
  return / Capacitor\//i.test(navigator.userAgent);
}

// True only when running in the native app AND this binary actually ships the
// PushNotifications plugin. The live site is loaded by older iOS binaries that
// are inside Capacitor but were built before the plugin existed; on those,
// isNativePlatform() is true yet the plugin is absent, so gating push UI on
// isInsideCapacitor() alone would show the opt-in and then silently fail on the
// permission call (burning the one-shot ask). This stays false on every current
// binary and flips true on its own once a push-enabled build ships — no flag to
// flip. Conservative: returns false unless the bridge confirms availability.
export function isPushPluginAvailable(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (
    window as {
      Capacitor?: {
        isNativePlatform?: () => boolean;
        isPluginAvailable?: (name: string) => boolean;
      };
    }
  ).Capacitor;
  if (!cap) return false;
  const native =
    typeof cap.isNativePlatform === "function" ? cap.isNativePlatform() : true;
  if (!native) return false;
  return typeof cap.isPluginAvailable === "function"
    ? cap.isPluginAvailable("PushNotifications")
    : false;
}

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

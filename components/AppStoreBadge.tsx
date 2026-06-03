"use client";

import { useEffect, useState } from "react";

// The App Store download badge is meaningless once the page is already
// running inside the native iOS app (Capacitor loads the live landing
// page into a WKWebView). Showing it there would point users back at the
// App Store from inside the very app they downloaded, so we render the
// badge only in a real browser.
//
// Default to hidden and reveal after we confirm we're NOT in Capacitor.
// Hiding-by-default avoids a flash of the badge inside the native app;
// the brief reveal-on-mount in a browser is imperceptible.
function isInsideCapacitor(): boolean {
  if (typeof window === "undefined") return false;
  // The native bridge injects a global `Capacitor` object into the
  // WebView. The marketing site never bundles @capacitor/core, so this
  // global is present only when the page is hosted by the native app.
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

export default function AppStoreBadge({ className }: { className?: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isInsideCapacitor()) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <a
      className={`landing-appstore${className ? ` ${className}` : ""}`}
      href="https://apps.apple.com/app/id6771104342"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Download 2am on the App Store"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/app-store-badge.svg"
        alt="Download on the App Store"
        className="landing-appstore-img"
      />
    </a>
  );
}

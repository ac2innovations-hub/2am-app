"use client";

import { useEffect, useState } from "react";
import { isInsideCapacitor } from "@/lib/isCapacitor";

// The App Store download badge is meaningless once the page is already
// running inside the native iOS app (Capacitor loads the live landing
// page into a WKWebView). Showing it there would point users back at the
// App Store from inside the very app they downloaded, so we render the
// badge only in a real browser.
//
// Default to hidden and reveal after we confirm we're NOT in Capacitor.
// Hiding-by-default avoids a flash of the badge inside the native app;
// the brief reveal-on-mount in a browser is imperceptible.
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

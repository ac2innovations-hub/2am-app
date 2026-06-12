"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initAnalytics, trackPageview } from "@/lib/analytics";

// Initializes PostHog once and captures a pageview on every route change
// (including the initial load). Renders nothing.
export default function AnalyticsProvider() {
  const pathname = usePathname();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (pathname) trackPageview(pathname);
  }, [pathname]);

  return null;
}

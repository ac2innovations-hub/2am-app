"use client";

import { useEffect, useState } from "react";
import { isInsideCapacitor } from "@/lib/isCapacitor";

// Renders its children only in a regular browser, never inside the native
// iOS app (Capacitor WebView). Same detection as AppStoreBadge: default to
// hidden and reveal after mount confirms we're NOT in Capacitor, so the
// gated content never flashes in-app.
export default function BrowserOnly({
  children,
}: {
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isInsideCapacitor()) setShow(true);
  }, []);

  if (!show) return null;

  return <>{children}</>;
}

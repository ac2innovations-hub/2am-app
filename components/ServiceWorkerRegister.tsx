"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js once on mount. Only runs in production — in dev, Next's
 * HMR conflicts with aggressive caching and makes every edit feel stale.
 *
 * Update adoption: a freshly-deployed sw.js would otherwise sit in "waiting"
 * until every tab closes, and the page would keep running against the old
 * cached bundle. We ask a waiting/installed worker to skipWaiting, then reload
 * once when it takes control — so an OTA web deploy actually reaches the WebView
 * on the next launch instead of lagging a version behind.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    // Only reload on an UPDATE (there was already a controller), never on the
    // very first install — and guard against a reload loop.
    const hadController = !!navigator.serviceWorker.controller;
    let refreshing = false;
    const onControllerChange = () => {
      if (!hadController || refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    const askToActivate = (worker: ServiceWorker | null) => {
      if (worker) worker.postMessage("SKIP_WAITING");
    };

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          // An update is already parked → activate it now.
          askToActivate(reg.waiting);
          // A new worker found after this load → activate as soon as installed.
          reg.addEventListener("updatefound", () => {
            const installing = reg.installing;
            if (!installing) return;
            installing.addEventListener("statechange", () => {
              if (installing.state === "installed") {
                askToActivate(reg.waiting);
              }
            });
          });
        })
        .catch((err) => {
          console.warn("[2am] service worker registration failed:", err);
        });
    };

    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    return () => {
      window.removeEventListener("load", onLoad);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  return null;
}

/* 2AM service worker.
 * Strategy:
 *   - Precache the offline fallback + PWA metadata so a tapped-but-offline
 *     app always has something to render.
 *   - Navigate requests: network-first, fall back to cached offline.html.
 *   - /api/*: network-only (chat needs a live connection).
 *   - Static assets (same-origin JS/CSS/images, Google Fonts): stale-while-
 *     revalidate so second visits are instant and we still refresh in the
 *     background.
 */

const VERSION = "v1";
const STATIC_CACHE = `2am-static-${VERSION}`;
const RUNTIME_CACHE = `2am-runtime-${VERSION}`;

const PRECACHE_URLS = [
  "/offline.html",
  "/manifest.json",
  "/icon.svg",
  "/icon-maskable.svg",
  "/apple-touch-icon.svg",
  "/splash.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) =>
                k.startsWith("2am-") &&
                k !== STATIC_CACHE &&
                k !== RUNTIME_CACHE,
            )
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isFontHost(url) {
  return (
    url.origin === "https://fonts.googleapis.com" ||
    url.origin === "https://fonts.gstatic.com"
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // API: never cache. Let the client see real errors so it can show
  // "trouble connecting" in chat.
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request));
    return;
  }

  // HTML navigations: network-first, offline fallback on failure.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          // Mirror successful nav responses into runtime cache so a later
          // offline reload of the same URL can return something matched.
          const copy = resp.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return resp;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/offline.html")),
        ),
    );
    return;
  }

  // Static assets (same origin) + Google Fonts: stale-while-revalidate.
  if (url.origin === self.location.origin || isFontHost(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networked = fetch(request)
          .then((resp) => {
            if (resp && resp.ok) {
              const copy = resp.clone();
              caches
                .open(RUNTIME_CACHE)
                .then((cache) => cache.put(request, copy));
            }
            return resp;
          })
          .catch(() => cached);
        return cached || networked;
      }),
    );
    return;
  }

  // Everything else: just hit the network.
  event.respondWith(fetch(request));
});

// Let the page request a fast activation for freshly-deployed SWs.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

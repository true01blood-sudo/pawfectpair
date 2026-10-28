// Minimal service worker — exists only to satisfy PWA installability
// criteria. Intentionally does not cache anything, so it can never
// serve stale content; every request passes straight through to the
// network.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // no-op: let the browser handle every request normally
});

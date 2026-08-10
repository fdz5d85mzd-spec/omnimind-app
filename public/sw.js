// Deliberately minimal: this app is almost entirely dynamic (streaming
// chat, live auth/credit state), so caching responses would risk serving
// stale session or balance data. This service worker exists only to
// satisfy the "installable" requirement for Add to Home Screen — it does
// not intercept or cache anything.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

/* coi-serviceworker v0.1.7 — https://github.com/gzuidhof/coi-serviceworker    */
/* License MIT — Guido Zuidhof                                                   */
/* Injects Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy headers   */
/* via a service worker so SharedArrayBuffer works on hosts (like GitHub Pages)  */
/* that don't let you set custom HTTP response headers.                          */

if (typeof window === "undefined") {
  // ---- SERVICE WORKER CONTEXT ----
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", (event) =>
    event.waitUntil(self.clients.claim())
  );

  async function handleFetch(request) {
    if (request.cache === "only-if-cached" && request.mode !== "same-origin") {
      return;
    }

    // Skip cross-origin requests that the page itself would block when
    // COEP: require-corp is set — let the browser handle them normally.
    // (Only intercept same-origin and explicitly credentialless requests.)
    if (
      request.url.startsWith(self.location.origin) ||
      request.destination === "document"
    ) {
      const response = await fetch(request).catch(() => null);
      if (!response) return;

      // Only tamper with responses we can actually read.
      if (
        response.status === 0 ||
        (response.headers.get("content-type") || "").startsWith("opaque")
      ) {
        return response;
      }

      const newHeaders = new Headers(response.headers);
      newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
      newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
      newHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }
  }

  self.addEventListener("fetch", (event) => {
    event.respondWith(handleFetch(event.request));
  });
} else {
  // ---- MAIN THREAD CONTEXT ----
  // Register the service worker on first load, then reload once so the
  // SW intercepts all subsequent requests and sets the isolation headers.
  (async function () {
    if (!window.crossOriginIsolated) {
      // Check whether the browser supports service workers at all.
      if (!("serviceWorker" in navigator)) {
        console.warn(
          "[coi-serviceworker] Service workers are not supported — " +
            "SharedArrayBuffer may not be available."
        );
        return;
      }

      // Register the service worker (pointing at this same file).
      try {
        await navigator.serviceWorker.register(
          window.document.currentScript?.src ?? "/coi-serviceworker.js"
        );
      } catch (e) {
        console.error("[coi-serviceworker] Registration failed:", e);
        return;
      }

      // Reload so the SW can intercept the page's own request and stamp
      // it with the COOP/COEP headers.
      window.location.reload();
    }
  })();
}

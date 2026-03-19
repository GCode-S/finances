const CACHE_NAME = "fluxo-pessoal-v3";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/logo.png",
  "/sw.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
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
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clonedResponse = response.clone();
          void caches
            .open(CACHE_NAME)
            .then((cache) => cache.put("/index.html", clonedResponse));
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match("/index.html");
          return (
            cachedResponse ??
            new Response("Offline", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            })
          );
        }),
    );
    return;
  }

  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            if (response.ok) {
              const clonedResponse = response.clone();
              void caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(request, clonedResponse));
            }

            return response;
          })
          .catch(() => Response.error());
      }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkRequest = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clonedResponse = response.clone();
            void caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, clonedResponse));
          }

          return response;
        })
        .catch(() => cachedResponse ?? Response.error());

      return cachedResponse ?? networkRequest;
    }),
  );
});

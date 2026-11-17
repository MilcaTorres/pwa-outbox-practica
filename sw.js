const cacheAppShell = "outbox-app-shell-v1";
const STATIC = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./db-helper.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(cacheAppShell).then((cacheOpen) => {
      return cacheOpen.addAll(STATIC);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cachesNames) => {
      return Promise.all(
        cachesNames.map((nameCache) => {
          if (nameCache !== cacheAppShell) {
            return caches.delete(nameCache);
          }
        }),
      );
    }),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((respCache) => {
      if (respCache) {
        return respCache;
      }
      return fetch(event.request);
    }),
  );
});

const CACHE_NAME = "patient-rogue-v9";

const ASSETS = [
  "./",
  "./manifest.json",
  "./css/style.css",
  "./VERSION",
  "./js/main.js",
  "./js/engine/card.js",
  "./js/engine/combat.js",
  "./js/engine/deck.js",
  "./js/engine/dungeon.js",
  "./js/engine/hub.js",
  "./js/engine/state.js",
  "./js/engine/worldmap.js",
  "./js/data/biomes.js",
  "./js/data/cards.js",
  "./js/data/classes.js",
  "./js/data/dungeon.js",
  "./js/data/enemies.js",
  "./js/data/poi.js",
  "./js/data/upgrades.js",
  "./js/system/audio.js",
  "./js/system/i18n.js",
  "./js/system/save.js",
  "./js/ui/grid.js",
  "./js/ui/hand.js",
  "./js/ui/hub.js",
  "./js/ui/hud.js",
  "./js/ui/worldmap.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // index.html: network-first, fallback to cache (offline support)
  if (event.request.url.endsWith("index.html") || event.request.url.endsWith("/")) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // VERSION: never cache, always from network
  if (event.request.url.includes("VERSION")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Other assets: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
      );
    })
  );
});

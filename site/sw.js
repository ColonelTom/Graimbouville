// =====================================================================
//  Service worker : permet d'ouvrir l'application même sans réseau.
//  Pensez à augmenter VERSION à chaque mise à jour des fichiers.
// =====================================================================
const VERSION = "graimbouville-v6";
const FICHIERS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/firebase-config.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./img/maison.jpg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((c) => c !== VERSION).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Bibliothèques Firebase (adresses versionnées) : cache d'abord
  if (url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/")) {
    e.respondWith(
      caches.match(req).then((enCache) => enCache || fetch(req).then((rep) => {
        const copie = rep.clone();
        caches.open(VERSION).then((c) => c.put(req, copie));
        return rep;
      }))
    );
    return;
  }

  // Nos propres fichiers : réseau d'abord (mises à jour immédiates), cache si hors connexion
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req)
        .then((rep) => {
          if (rep.ok) {
            const copie = rep.clone();
            caches.open(VERSION).then((c) => c.put(req, copie));
          }
          return rep;
        })
        .catch(() => caches.match(req, { ignoreSearch: true })
          .then((r) => r || (req.mode === "navigate" ? caches.match("./index.html") : undefined))
          .then((r) => r || new Response("Hors connexion", { status: 503 })))
    );
  }
  // Tout le reste (Firestore, authentification) passe directement par le réseau.
});

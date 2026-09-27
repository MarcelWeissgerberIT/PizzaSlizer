// Einfacher Offline-Cache für Pizza Slizer
const CACHE = 'pizza-slizer-v1';
const ASSETS = [
  './', './index.html', './manifest.json',
  './css/style.css', './js/levels.js', './js/audio.js', './js/game.js',
  './assets/ui/background.jpg', './assets/ui/logo.webp', './assets/ui/cutter.webp',
  './assets/ui/icon-192.png', './assets/ui/icon-512.png',
  './assets/pizzas/margherita.webp', './assets/pizzas/salami.webp', './assets/pizzas/funghi.webp',
  './assets/pizzas/hawaii.webp', './assets/pizzas/formaggi.webp', './assets/pizzas/veggie.webp',
  './assets/pizzas/diavola.webp', './assets/pizzas/dolce.webp',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
    if (res.ok && new URL(e.request.url).origin === location.origin) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
    }
    return res;
  }).catch(() => hit)));
});

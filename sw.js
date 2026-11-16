/* 伴学宠物 · 离线缓存 Service Worker */
const VERSION = 'beast-v3.46.0';
const SHELL = [
  './',
  './index.html',
  './app.css?v=3460',
  './games.css?v=3440',
  './help.html',
  './migrate.html',
  './lib/lz.min.js',
  './lib/qrg.js',
  './lib/jsqr.js',
  './app.js?v=3460',
  './bigbank.js?v=3452',
  './bb/g1.js?v=3452',
  './bb/g2.js?v=3452',
  './bb/g3.js?v=3452',
  './bb/g4.js?v=3452',
  './bb/g5.js?v=3452',
  './bb/g6.js?v=3452',
  './games.js?v=3460',
  './cloud.js?v=3440',
  './auth.js?v=3440',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION)
      .then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

/* 页面点「立即更新」时，让等待中的新 SW 立即激活 */
self.addEventListener('message', (e) => {
  if (e && e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // 页面导航：网络优先，断网才用缓存 —— 保证发新版后打开即是最新
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => {
        const clone = res.clone();
        caches.open(VERSION).then((c) => c.put(req, clone));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }
  // 静态资源：先回缓存（快），后台悄悄更新
  e.respondWith(
    caches.match(req).then((hit) => {
      const fetching = fetch(req).then((res) => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(VERSION).then((c) => c.put(req, clone));
        }
        return res;
      }).catch(() => hit);
      return hit || fetching;
    })
  );
});

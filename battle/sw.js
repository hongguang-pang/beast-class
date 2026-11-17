/* 冒险大陆 · 离线缓存 Service Worker（scope = /battle/，与根目录伴学宠物互不干扰） */
const VERSION = 'battle-v1.2.0';
const SHELL = [
  './',
  './index.html',
  './style.css?v=9',
  './data/knowledge.js?v=11',
  './data/kg/g1.js?v=11',
  './data/kg/g2.js?v=11',
  './data/kg/g3.js?v=11',
  './data/kg/g4.js?v=11',
  './data/kg/g5.js?v=11',
  './data/kg/g6.js?v=11',
  './data/kg/g7.js?v=11',
  './data/kg/g8.js?v=11',
  './data/kg/g9.js?v=11',
  './data/kg/g10.js?v=11',
  './data/kg/g11.js?v=11',
  './data/kg/g12.js?v=11',
  './engine.js?v=11',
  './game.js?v=11',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION)
      .then((c) => c.addAll(SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
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
  // 页面导航：网络优先，断网才用缓存
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
  // 静态资源：缓存优先（快），后台悄悄更新
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

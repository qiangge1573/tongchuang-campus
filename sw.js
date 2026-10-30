/* ============================================================
 * 同窗 Service Worker —— 应用骨架离线缓存
 *
 * 策略：
 *   1) 导航请求（HTML）：网络优先，离线回退到缓存的应用外壳
 *      —— 保证发版后新版本立即生效，不会把用户锁死在旧版本；
 *   2) 静态资源（CSS/JS/图标/清单）：缓存优先 + 后台静默更新
 *      —— 打开快，新资源在下次启动接管；
 *   3) 只处理同源 GET 请求，用户数据走 localStorage，不经过 SW。
 *
 * 发版注意：改动任何前端资源后，把 CACHE_VERSION 递增一位
 * （如 v4 -> v5），旧缓存会在 activate 阶段自动清理。
 * ============================================================ */
var CACHE_VERSION = 'tongchuang-v4';
var APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/base.css',
  './assets/css/components.css',
  './assets/css/views.css',
  './assets/js/core.js',
  './assets/js/store.js',
  './assets/js/views.js',
  './assets/js/interactions.js',
  './assets/js/pwa.js',
  './assets/js/main.js',
  './assets/icons/icon.svg',
  './assets/icons/icon-maskable.svg',
  './assets/icons/apple-touch-icon.svg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(function (c) { return c.addAll(APP_SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(
          keys.filter(function (k) { return k !== CACHE_VERSION; })
              .map(function (k) { return caches.delete(k); })
        );
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  /* 导航请求：网络优先，离线回退到缓存的页面骨架 */
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request)
        .then(function (res) {
          if (res && res.ok) {
            var copy = res.clone();
            caches.open(CACHE_VERSION).then(function (c) {
              c.put('./index.html', copy.clone());
              c.put('./', copy);
            });
          }
          return res;
        })
        .catch(function () {
          return caches.match('./index.html')
            .then(function (r) { return r || caches.match('./'); })
            .then(function (r) {
              if (r) return r;
              return new Response('<h1>离线中</h1><p>请恢复网络后重试。</p>', {
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
              });
            });
        })
    );
    return;
  }

  /* 静态资源：缓存优先，命中后仍后台更新（stale-while-revalidate） */
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      var net = fetch(e.request).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE_VERSION).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});

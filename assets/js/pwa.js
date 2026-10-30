/* ============================================================
 * pwa.js —— Service Worker 注册
 * 只在 http(s) 环境尝试；注册失败静默降级为普通网页，不影响主流程。
 * ============================================================ */
(function () {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;

  var hadController = !!navigator.serviceWorker.controller;
  var refreshing = false;

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js').catch(function () {});
  });

  /* 新版本 SW 接管时刷新一次，保证发版立即生效；首次安装不刷新 */
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!hadController || refreshing) return;
    refreshing = true;
    location.reload();
  });
})();

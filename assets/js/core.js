/* ============================================================
 * core.js —— 常量、通用工具与轻量 UI 反馈（Toast / Modal）
 * 不依赖视图层，可在数据层初始化阶段安全调用。
 * ============================================================ */
var H = 3600e3, D = 24 * H, NOW = Date.now();

/* ================= 工具函数 ================= */
function $(sel){ return document.querySelector(sel); }
function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function uid(){ return 'x' + (++S.seq); }
function getUser(id){ return id === 'me' ? S.me : S.users.find(function(u){ return u.id === id; }); }
function findPost(id){ return S.posts.find(function(p){ return p.id === id; }); }
function catOf(k){ return CATS.find(function(c){ return c.k === k; }); }
function isYesterday(ts){ var d = new Date(ts), y = new Date(Date.now() - D); return d.toDateString() === y.toDateString(); }
function pad(n){ return n < 10 ? '0' + n : '' + n; }
function timeStr(ts){
  var diff = Date.now() - ts;
  if (diff < 60e3) return '刚刚';
  if (diff < H) return Math.floor(diff / 60e3) + ' 分钟前';
  if (diff < D) return Math.floor(diff / H) + ' 小时前';
  if (isYesterday(ts)) return '昨天';
  var d = new Date(ts);
  return (d.getMonth() + 1) + '-' + pad(d.getDate());
}
function greet(){
  var h = new Date().getHours();
  var w = h < 5 ? '夜深了' : h < 11 ? '早上好' : h < 13 ? '中午好' : h < 18 ? '下午好' : '晚上好';
  return w + '，' + S.me.name;
}
function avatarHtml(u, size){
  return '<span class="avatar av-' + size + '" style="background:' + esc(u.c) + '" aria-hidden="true">' + esc(u.name.charAt(0)) + '</span>';
}
function photoHtml(i, extra){ var p = PHOTOS[i] || PHOTOS[0]; return '<div class="photo" style="background:' + p.g + '" role="img" aria-label="校园图片"' + (extra || '') + '>' + p.e + '</div>'; }
var toastTimer = null;
function toast(msg, type){
  var t = $('#toast'); t.textContent = msg; t.className = 'toast show ' + (type || 'success');
  clearTimeout(toastTimer); toastTimer = setTimeout(function(){ t.className = 'toast'; }, 2000);
}
function unreadCount(){ return S.notifs.filter(function(n){ return !n.read; }).length; }
function updateBadges(){
  var n = unreadCount(), txt = n > 99 ? '99+' : (n || '');
  var b = $('#bell-badge'), d = $('#tab-badge');
  b.textContent = txt; b.classList.toggle('hidden', !n);
  d.textContent = txt; d.classList.toggle('hidden', !n);
}
function addNotif(o){ o.id = uid(); o.read = false; o.ts = o.ts || Date.now(); S.notifs.unshift(o); }

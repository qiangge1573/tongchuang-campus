/* ============================================================
 * views.js —— 视图状态与渲染层：动态卡片、广场、消息、个人主页
 * 纯函数式拼接字符串，不直接绑定事件（事件统一在 interactions.js）
 * ============================================================ */
/* ================= 视图状态 ================= */
var route = { view: 'home', uid: 'me', anchor: null };
var E = { homeOpen: false, homeText: '', homePhotos: [], homeNewId: null,
          plazaOpen: false, plazaTitle: '', plazaText: '', plazaPhotos: [], plazaCat: 'club',
          cmtOpen: {}, cmtVal: {}, expanded: {}, plazaCatFilter: 'all', profTab: 'posts' };

/* ================= SVG 图标 ================= */
var I_HEART = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
var I_BUBBLE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
var I_USERPLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>';

/* ================= 动态卡片渲染 ================= */
function postCard(p, opts){
  opts = opts || {};
  var u = getUser(p.author);
  var liked = p.likes.some(function(l){ return l.u === 'me'; });
  var imgs = '';
  if (p.imgs && p.imgs.length){
    var cls = p.imgs.length === 1 ? 'n1' : (p.imgs.length <= 3 ? 'n23' : 'n4');
    imgs = '<div class="imgs ' + cls + '">' + p.imgs.map(function(i){ return photoHtml(i); }).join('') + '</div>';
  }
  var cs = p.comments || [];
  var shown = E.expanded[p.id] ? cs : cs.slice(-2);
  var cmtHtml = cs.length
    ? '<div class="cmt-list">' + shown.map(function(c){
        var cu = getUser(c.a);
        return '<div class="cmt-item">' + avatarHtml(cu, 28) + '<div class="cmt-body"><span class="cmt-name">' + esc(cu.name) + '</span> <span class="cmt-text">' + esc(c.text) + '</span><div class="cmt-time">' + timeStr(c.ts) + '</div></div></div>';
      }).join('') + '</div>' +
      (cs.length > 2 && !E.expanded[p.id] ? '<button class="cmt-all-btn" data-cmt-all="' + p.id + '">查看全部 ' + cs.length + ' 条评论 &gt;</button>'
        : (cs.length > 2 ? '<button class="cmt-all-btn" data-cmt-all="' + p.id + '">收起评论 &gt;</button>' : ''))
    : '';
  var open = !!E.cmtOpen[p.id];
  var inputHtml = open
    ? '<div class="cmt-row"><input data-cmt-input="' + p.id + '" value="' + esc(E.cmtVal[p.id] || '') + '" placeholder="友善地留个言吧…" aria-label="评论内容"><button class="btn primary sm" data-cmt-send="' + p.id + '">发送</button></div>'
    : '<div class="cmt-ph" data-cmt-open="' + p.id + '" role="button" tabindex="0">友善地留个言吧…</div>';
  var isNew = E.homeNewId === p.id && !opts.noAnim ? ' new' : '';
  var txtExpanded = E.textExpanded && E.textExpanded[p.id];
  var expBtn = txtExpanded
    ? '<button class="expand-btn" data-collapse="' + p.id + '">收起</button>'
    : '<button class="expand-btn hidden" data-expand="' + p.id + '">展开全文</button>';
  return '<article class="post card' + isNew + '" id="post-' + p.id + '">' +
    '<div class="post-head">' + avatarHtml(u, 44) + '<div><div class="post-name">' + esc(u.name) + '</div><div class="post-meta">' + esc(u.dept) + ' · ' + timeStr(p.ts) + '</div></div></div>' +
    '<div class="post-text' + (txtExpanded ? '' : ' clamp') + '" data-post-text>' + esc(p.text) + '</div>' +
    expBtn +
    imgs +
    '<div class="post-actions">' +
      '<button class="act-btn' + (liked ? ' liked' : '') + '" data-like="' + p.id + '" aria-pressed="' + liked + '">' + I_HEART + '<span>赞 ' + (p.likes.length || '') + '</span></button>' +
      '<button class="act-btn" data-cmt-open2="' + p.id + '">' + I_BUBBLE + '<span>评论 ' + (cs.length || '') + '</span></button>' +
    '</div>' +
    '<div class="cmt-area">' + cmtHtml + '<div class="cmt-input-bar">' + inputHtml + '</div></div>' +
  '</article>';
}

function publishBox(idPrefix, withCat, titleVal, textVal, photos, catVal){
  var picker = '<div class="pub-picker' + (E[idPrefix + 'Picker'] ? '' : ' hidden') + '" id="' + idPrefix + '-picker">' +
    PHOTOS.map(function(p, i){
      var sel = photos.indexOf(i) >= 0;
      return '<div class="pick-item' + (sel ? ' sel' : '') + '" data-pick="' + i + '" data-pfx="' + idPrefix + '" role="button" tabindex="0" aria-pressed="' + sel + '" style="background:' + p.g + '" aria-label="图片' + (i+1) + '">' + p.e + '</div>';
    }).join('') + '</div>';
  var photosHtml = '<div class="pub-photos">' + photos.map(function(i){
    return '<div class="pub-photo" data-unpick="' + i + '" data-pfx="' + idPrefix + '" title="点击移除">' + photoHtml(i) + '</div>';
  }).join('') + '</div>';
  var catSel = withCat ? '<div class="cat-select" role="radiogroup" aria-label="分类">' + CATS.map(function(c){
      return '<button class="chip' + (catVal === c.k ? ' active' : '') + '" data-setcat="' + c.k + '" data-pfx="' + idPrefix + '" role="radio" aria-checked="' + (catVal === c.k) + '">' + c.name + '</button>';
    }).join('') + '</div>' : '';
  var titleInput = withCat ? '<input class="pub-title-input" id="' + idPrefix + '-title" placeholder="给内容起个标题（必填）" value="' + esc(titleVal) + '" maxlength="30" aria-label="标题">' : '';
  return '<div class="card pub">' +
    titleInput + catSel +
    '<textarea id="' + idPrefix + '-text" placeholder="' + (withCat ? '补充正文字（选填）…' : '今天校园里有什么新鲜事？') + '" aria-label="发布内容">' + esc(textVal) + '</textarea>' +
    photosHtml + picker +
    '<div class="pub-bar">' +
      '<button class="icon-btn" data-imgbtn="' + idPrefix + '" aria-label="添加图片">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></button>' +
      '<span class="pub-count" id="' + idPrefix + '-count">0/500</span>' +
      '<button class="btn primary" data-publish="' + idPrefix + '">发布</button>' +
    '</div></div>';
}

/* ================= 各视图渲染 ================= */
function renderHome(){
  var posts = S.posts.filter(function(p){ return p.board === 'home'; }).sort(function(a, b){ return b.ts - a.ts; });
  var today0 = new Date(); today0.setHours(0,0,0,0);
  var todayLikes = 0;
  S.posts.forEach(function(p){ if (p.author === 'me') p.likes.forEach(function(l){ if (l.ts >= today0.getTime()) todayLikes++; }); });
  var pub = E.homeOpen
    ? publishBox('home', false, '', E.homeText, E.homePhotos, '')
    : '<div class="card pub"><div class="pub-collapsed" data-openpub="home" role="button" tabindex="0">' + avatarHtml(S.me, 44) + '<div class="pub-ph">今天校园里有什么新鲜事？</div></div></div>';
  var mates = S.users.map(function(u){
    return '<div class="mate-row" data-user="' + u.id + '" role="button" tabindex="0">' + avatarHtml(u, 36) + '<div><div class="nm">' + esc(u.name) + '</div><div class="sub">' + esc(u.dept) + '</div></div>' + (u.rel === 'added' ? '<span class="rel">✓ 好友</span>' : '') + '</div>';
  }).join('');
  return '<div class="layout"><div class="main-col">' +
    '<h1 class="page-title">首页</h1><div class="greet">' + esc(greet()) + '，今天校园里有什么新鲜事？</div>' +
    pub + '<div id="feed">' + posts.map(function(p){ return postCard(p); }).join('') + '</div></div>' +
    '<aside class="side-col">' +
      '<div class="card side-card"><div class="side-me" data-user="me" role="button" tabindex="0">' + avatarHtml(S.me, 44) + '<div><div class="nm">' + esc(S.me.name) + '</div><div class="sub">' + esc(S.me.dept) + ' · ' + esc(S.me.grade) + '</div></div></div>' +
      '<div class="today-likes">今日获赞 <b>' + todayLikes + '</b><span style="margin-left:2px">❤</span></div></div>' +
      '<div class="card side-card"><div class="side-title">同学 <span class="side-more">' + S.users.length + ' 位同校同学</span></div>' + mates + '</div>' +
    '</aside></div>';
}

function renderPlaza(){
  var posts = S.posts.filter(function(p){
    return p.board === 'plaza' && (E.plazaCatFilter === 'all' || p.cat === E.plazaCatFilter);
  }).sort(function(a, b){ return b.ts - a.ts; });
  var chips = [{k:'all', name:'全部'}].concat(CATS).map(function(c){
    return '<button class="chip' + (E.plazaCatFilter === c.k ? ' active' : '') + '" data-chip="' + c.k + '" aria-pressed="' + (E.plazaCatFilter === c.k) + '">' + c.name + '</button>';
  }).join('');
  var pubEntry = E.plazaOpen
    ? publishBox('plaza', true, E.plazaTitle, E.plazaText, E.plazaPhotos, E.plazaCat)
    : '<div class="card pub" style="margin:0 0 16px"><div class="pub-collapsed" data-openpub="plaza" role="button" tabindex="0">' + avatarHtml(S.me, 44) + '<div class="pub-ph">想在广场发点什么？招新、活动、找搭子…</div></div></div>';
  var cards = posts.map(function(p){
    var u = getUser(p.author), c = catOf(p.cat);
    return '<div class="plaza-card card clickable" data-plaza="' + p.id + '" role="button" tabindex="0">' +
      '<span class="pill" style="background:' + c.bg + ';color:' + c.fg + '">' + c.name + '</span>' +
      '<div class="pc-title">' + esc(p.title) + '</div>' +
      '<div class="pc-text">' + esc(p.text) + '</div>' +
      (p.imgs && p.imgs.length ? '<div class="pc-img">' + photoHtml(p.imgs[0]) + '</div>' : '') +
      '<div class="pc-foot">' + avatarHtml(u, 28) + '<span class="nm">' + esc(u.name) + '</span><span>· ' + timeStr(p.ts) + '</span><span class="pc-views">' + p.views + ' 浏览</span></div></div>';
  }).join('');
  var empty = '<div class="empty plaza-empty" style="column-span:all"><div class="empty-ico">🧭</div><p>这个分类下还没有内容，来发第一条吧</p><button class="btn primary" data-openpub="plaza">去发布</button></div>';
  return '<div class="chips">' + chips + '</div><div class="plaza-wrap">' +
    '<h1 class="page-title">校园广场</h1><div class="greet">全校同学都在这里：招新、活动、搭子、求助</div>' +
    pubEntry + '<div class="plaza-grid">' + (cards || empty) + '</div></div>';
}

function renderMsg(){
  var reqs = S.notifs.filter(function(n){ return n.type === 'friend' && n.kind === 'request' && n.pending; });
  var inters = S.notifs.filter(function(n){ return !(n.type === 'friend' && n.kind === 'request' && n.pending); });
  function item(n){
    var u = getUser(n.actor);
    var ico, cls, text, extra = '';
    if (n.type === 'like'){ cls = 'like'; ico = I_HEART; text = '<b>' + esc(u.name) + '</b> 赞了你的动态'; }
    else if (n.type === 'comment'){ cls = 'comment'; ico = I_BUBBLE; text = '<b>' + esc(u.name) + '</b> 评论了你的动态<span class="quote">' + esc(n.text || '') + '</span>'; }
    else { cls = 'friend'; ico = I_USERPLUS; text = '<b>' + esc(u.name) + '</b> 通过了你的好友请求，你们现在是同学好友啦'; }
    var right = '';
    if (n.type === 'friend' && n.kind === 'request' && n.pending){
      right = '<span class="msg-actions"><button class="btn primary sm" data-accept="' + n.id + '">接受</button><button class="btn secondary sm" data-ignore="' + n.id + '">忽略</button></span>';
      text = '<b>' + esc(u.name) + '</b>（' + esc(u.dept) + '）请求加你为好友';
    }
    return '<div class="msg-item' + (n.read ? '' : ' unread') + '" ' + (n.postId ? 'data-notif="' + n.id + '"' : '') + ' role="button" tabindex="0">' +
      '<span class="msg-ico ' + cls + '">' + ico + '</span>' +
      '<div class="msg-body"><div class="msg-text">' + text + '</div><div class="msg-time">' + timeStr(n.ts) + '</div></div>' + right + '</div>';
  }
  var reqHtml = reqs.length ? reqs.map(item).join('') :
    '<div class="empty"><div class="empty-ico">🤝</div><p>暂无好友请求</p></div>';
  var interHtml = inters.length
    ? '<div class="msg-head-row"><span></span><button class="mark-read" data-markread>全部标为已读</button></div>' + inters.map(item).join('')
    : '<div class="empty"><div class="empty-ico">🔔</div><p>还没有新的互动，去发条动态让大家看到你吧</p><button class="btn primary" data-go="home">去发布</button></div>';
  return '<div class="msg-wrap"><h1 class="page-title">消息</h1>' +
    '<div class="msg-group-title" style="margin-top:12px">好友请求</div>' + reqHtml +
    '<div class="msg-group-title">互动通知</div>' + interHtml + '</div>';
}

function renderProfile(uid){
  var isMe = uid === 'me';
  var u = getUser(uid);
  if (!u) return '<div class="profile-wrap"><div class="empty"><div class="empty-ico">🔍</div><p>没有找到这位同学</p></div></div>';
  var posts = S.posts.filter(function(p){ return p.board === 'home' && p.author === uid; }).sort(function(a, b){ return b.ts - a.ts; });
  var act = isMe
    ? '<button class="btn secondary" data-edit>编辑资料</button>'
    : (u.rel === 'added'
        ? '<button class="btn done" disabled>已添加</button>'
        : '<button class="btn primary" data-friend="' + u.id + '">' + I_USERPLUS + ' 加好友</button>');
  var tab = E.profTab;
  var body = tab === 'posts'
    ? (posts.length ? posts.map(function(p){ return postCard(p, {noAnim:true}); }).join('')
       : '<div class="empty"><div class="empty-ico">📝</div><p>' + (isMe ? '还没有发布过动态，第一条动态就是今天？' : '这位同学还没有发布过动态') + '</p>' + (isMe ? '<button class="btn primary" data-go="home">去发布</button>' : '') + '</div>')
    : '<div class="about-row"><span class="k">学校</span><span class="v">' + esc(u.school || S.me.school) + '</span></div>' +
      '<div class="about-row"><span class="k">院系</span><span class="v">' + esc(u.dept) + '</span></div>' +
      '<div class="about-row"><span class="k">年级</span><span class="v">' + esc(u.grade) + '</span></div>' +
      '<div class="about-row"><span class="k">个性签名</span><span class="v">' + esc(u.sign || '—') + '</span></div>' +
      '<div class="about-row"><span class="k">好友数</span><span class="v">' + S.users.filter(function(x){ return x.rel === 'added'; }).length + ' 位同学</span></div>' +
      (isMe ? '<div class="about-actions"><button class="btn text" data-edit>编辑昵称与签名</button><button class="btn text" style="color:var(--danger)" data-reset>重置演示数据</button></div>' : '');
  return '<div class="profile-wrap">' +
    '<div class="card profile-card"><div class="cover"></div>' +
    '<div class="profile-head">' +
      '<div class="profile-av">' + avatarHtml(u, 80) + '</div>' +
      '<div class="profile-info"><div class="p-name">' + esc(u.name) + (isMe ? '<span class="pill" style="background:var(--primary-bg);color:var(--primary);margin-left:8px;vertical-align:2px">这是我</span>' : '') + '</div>' +
      '<div class="p-sub">' + esc(u.school || S.me.school) + ' · ' + esc(u.dept) + ' · ' + esc(u.grade) + '</div>' +
      '<div class="p-sign">' + esc(u.sign || '这个人很懒，什么都没留下') + '</div></div>' +
      '<div class="profile-act">' + act + '</div>' +
    '</div>' +
    '<div class="profile-tabs" role="tablist">' +
      '<button class="ptab' + (tab === 'posts' ? ' active' : '') + '" data-tab="posts" role="tab" aria-selected="' + (tab === 'posts') + '">动态 ' + posts.length + '</button>' +
      '<button class="ptab' + (tab === 'about' ? ' active' : '') + '" data-tab="about" role="tab" aria-selected="' + (tab === 'about') + '">关于</button>' +
    '</div>' +
    '<div class="profile-body">' + body + '</div></div></div>';
}

function render(){
  var app = $('#app');
  if (route.view === 'home') app.innerHTML = renderHome();
  else if (route.view === 'plaza') app.innerHTML = renderPlaza();
  else if (route.view === 'msg') app.innerHTML = renderMsg();
  else app.innerHTML = renderProfile(route.uid);
  // 导航态
  var key = route.view === 'profile' ? 'profile-me' : route.view;
  document.querySelectorAll('.nav-item,.tab-item').forEach(function(el){
    el.classList.toggle('active', el.getAttribute('data-go') === key);
  });
  $('#nav-avatar').textContent = S.me.name.charAt(0);
  $('#nav-avatar').style.background = S.me.c;
  updateBadges();
  // 长文本折叠检测
  requestAnimationFrame(function(){
    document.querySelectorAll('[data-post-text]').forEach(function(el){
      if (el.scrollHeight > el.clientHeight + 4){
        var btn = el.parentElement.querySelector('.expand-btn');
        if (btn && btn.getAttribute('data-expand')) btn.classList.remove('hidden');
      }
    });
    // 锚点跳转高亮
    if (route.anchor){
      var el = document.getElementById('post-' + route.anchor);
      if (el){ el.scrollIntoView({behavior:'smooth', block:'center'}); el.classList.add('flash'); setTimeout(function(){ el.classList.remove('flash'); }, 1600); }
      route.anchor = null;
    }
    if (E.homeNewId){
      var ne = document.getElementById('post-' + E.homeNewId);
      if (ne) ne.scrollIntoView({behavior:'smooth', block:'center'});
      E.homeNewId = null;
    }
    // 聚焦评论输入
    if (E.focusCmt){ var fi = document.querySelector('[data-cmt-input="' + E.focusCmt + '"]'); if (fi){ fi.focus(); fi.setSelectionRange(fi.value.length, fi.value.length); } E.focusCmt = null; }
    // 聚焦发布框
    if (E.homeOpen && !E.homeBlurred){ var pt = $('#home-text'); if (pt){ pt.focus(); pt.setSelectionRange(pt.value.length, pt.value.length); } E.homeBlurred = true; }
  });
  bindInputs();
}

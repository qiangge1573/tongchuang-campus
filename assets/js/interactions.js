/* ============================================================
 * interactions.js —— 路由、发布/点赞/评论等业务动作与事件委托
 * ============================================================ */
/* ================= 交互（事件委托） ================= */
function go(view, uid){
  if (view === 'profile-me'){ route.view = 'profile'; route.uid = 'me'; }
  else if (view === 'profile'){ route.view = 'profile'; route.uid = uid; }
  else route.view = view;
  E.profTab = 'posts';
  window.scrollTo(0, 0);
  render();
}

function refresh(){ render(); }

function simulateInteraction(postId){
  var u1 = S.users[Math.floor(Math.random() * S.users.length)];
  var u2 = S.users[Math.floor(Math.random() * S.users.length)];
  setTimeout(function(){
    var p = findPost(postId); if (!p) return;
    if (!p.likes.some(function(l){ return l.u === u1.id; })){
      snap();
      p.likes.push({u: u1.id, ts: Date.now()});
      addNotif({type:'like', actor: u1.id, postId: postId});
      if(!save()) return;
      refresh();
    }
  }, 2600);
  setTimeout(function(){
    var p = findPost(postId); if (!p) return;
    if (p.comments.some(function(c){ return c.a === u2.id; })) return;
    var t = SIM_COMMENTS[Math.floor(Math.random() * SIM_COMMENTS.length)];
    snap();
    p.comments.push({a: u2.id, text: t, ts: Date.now()});
    addNotif({type:'comment', actor: u2.id, postId: postId, text: t});
    if(!save()) return;
    refresh();
  }, 6800);
}

function doPublish(pfx){
  var textEl = $('#' + pfx + '-text');
  var text = (textEl ? textEl.value : '').trim();
  var photos = pfx === 'home' ? E.homePhotos.slice() : E.plazaPhotos.slice();
  var title = '', cat = '';
  if (pfx === 'plaza'){
    title = ($('#plaza-title') ? $('#plaza-title').value : '').trim();
    cat = E.plazaCat;
    if (!title){ toast('请先给内容起个标题', 'error'); ($('#plaza-title') || {}).focus && $('#plaza-title').focus(); return; }
    if (!text && !photos.length){ toast('正文和图片至少填一样', 'error'); return; }
  } else {
    if (!text && !photos.length){ toast('说点什么再发布吧', 'error'); return; }
  }
  if (text.length > 500){ toast('内容超过 500 字啦', 'error'); return; }
  snap();
  var p = {id: uid(), board: pfx === 'plaza' ? 'plaza' : 'home', author: 'me', ts: Date.now(),
           text: text, imgs: photos, likes: [], comments: [], views: 1};
  if (pfx === 'plaza'){ p.cat = cat; p.title = title; }
  S.posts.unshift(p);
  if (pfx === 'home'){ E.homeOpen = false; E.homeText = ''; E.homePhotos = []; E.homeNewId = p.id; simulateInteraction(p.id); }
  else { E.plazaOpen = false; E.plazaTitle = ''; E.plazaText = ''; E.plazaPhotos = []; }
  if(!save()) return;
  render();
  toast(pfx === 'plaza' ? '已发布到广场' : '发布成功，同学们马上就能看到啦');
}

function bindInputs(){
  var ht = $('#home-text');
  if (ht) ht.addEventListener('input', function(){ E.homeText = ht.value; updateCount('home', ht.value); });
  var pt = $('#plaza-text');
  if (pt) pt.addEventListener('input', function(){ E.plazaText = pt.value; updateCount('plaza', pt.value); });
  var plT = $('#plaza-title');
  if (plT) plT.addEventListener('input', function(){ E.plazaTitle = plT.value; });
  if (ht) updateCount('home', E.homeText || '');
  if (pt) updateCount('plaza', E.plazaText || '');
}
function updateCount(pfx, val){
  var c = $('#' + pfx + '-count'); if (!c) return;
  var over = val.length > 500;
  c.textContent = val.length + '/500';
  c.classList.toggle('over', over);
  /* P2-2 修复：超限同步禁用发布按钮（设计规范第五节），回到限内自动恢复 */
  var btn = document.querySelector('[data-publish="' + pfx + '"]');
  if (btn) btn.disabled = over;
}

document.addEventListener('click', function(ev){
  var t = ev.target.closest('[data-go],[data-like],[data-cmt-open],[data-cmt-open2],[data-cmt-send],[data-cmt-all],[data-expand],[data-user],[data-friend],[data-notif],[data-accept],[data-ignore],[data-chip],[data-tab],[data-pick],[data-unpick],[data-setcat],[data-plaza],[data-openpub],[data-publish],[data-imgbtn],[data-edit],[data-reset],[data-markread],[data-close-modal],[data-save-edit]');
  if (!t) return;
  var v;
  // 导航
  if (t.hasAttribute('data-go')){ go(t.getAttribute('data-go')); return; }
  // 发布框
  if (t.hasAttribute('data-openpub')){ var pfx = t.getAttribute('data-openpub'); if (pfx === 'home'){ E.homeOpen = true; E.homeBlurred = false; } else E.plazaOpen = true; render(); return; }
  if (t.hasAttribute('data-imgbtn')){ var p2 = t.getAttribute('data-imgbtn'); E[p2 + 'Picker'] = !E[p2 + 'Picker']; render(); return; }
  if (t.hasAttribute('data-pick')){
    var pfx3 = t.getAttribute('data-pfx'), idx = +t.getAttribute('data-pick');
    var arr = pfx3 === 'home' ? E.homePhotos : E.plazaPhotos;
    var i = arr.indexOf(idx);
    if (i >= 0) arr.splice(i, 1); else { if (arr.length >= 9){ toast('最多 9 张图', 'error'); return; } arr.push(idx); }
    render(); return;
  }
  if (t.hasAttribute('data-unpick')){
    var pfx4 = t.getAttribute('data-pfx'), idx2 = +t.getAttribute('data-unpick');
    var arr2 = pfx4 === 'home' ? E.homePhotos : E.plazaPhotos;
    var j = arr2.indexOf(idx2); if (j >= 0) arr2.splice(j, 1);
    render(); return;
  }
  if (t.hasAttribute('data-setcat')){ E.plazaCat = t.getAttribute('data-setcat'); render(); return; }
  if (t.hasAttribute('data-publish')){ doPublish(t.getAttribute('data-publish')); return; }
  // 点赞
  if (t.hasAttribute('data-like')){
    var pid = t.getAttribute('data-like'), p = findPost(pid); if (!p) return;
    snap();
    var li = p.likes.findIndex(function(l){ return l.u === 'me'; });
    if (li >= 0) p.likes.splice(li, 1); else p.likes.push({u:'me', ts: Date.now()});
    if(!save()) return;
    // 就地更新，避免打断输入
    var btn = t; var liked = p.likes.some(function(l){ return l.u === 'me'; });
    btn.classList.toggle('liked', liked); btn.setAttribute('aria-pressed', liked);
    btn.querySelector('span').textContent = '赞 ' + (p.likes.length || '');
    return;
  }
  // 评论
  if (t.hasAttribute('data-cmt-open') || t.hasAttribute('data-cmt-open2')){
    var pid2 = t.getAttribute('data-cmt-open') || t.getAttribute('data-cmt-open2');
    E.cmtOpen[pid2] = true; E.focusCmt = pid2; render(); return;
  }
  if (t.hasAttribute('data-cmt-send')){
    var pid3 = t.getAttribute('data-cmt-send');
    var inp = document.querySelector('[data-cmt-input="' + pid3 + '"]');
    var val = inp ? inp.value.trim() : '';
    if (!val){ toast('评论不能为空', 'error'); return; }
    var p3 = findPost(pid3); if (!p3) return;
    snap();
    p3.comments.push({a: 'me', text: val, ts: Date.now()});
    if(!save()) return;
    E.cmtVal[pid3] = ''; E.focusCmt = pid3;
    render(); toast('评论成功');
    return;
  }
  if (t.hasAttribute('data-cmt-all')){
    var pid4 = t.getAttribute('data-cmt-all');
    E.expanded[pid4] = !E.expanded[pid4]; render(); return;
  }
  if (t.hasAttribute('data-expand')){
    var pid5 = t.getAttribute('data-expand');
    E.textExpanded = E.textExpanded || {};
    E.textExpanded[pid5] = true;
    var card = document.getElementById('post-' + pid5);
    var txt = card.querySelector('[data-post-text]');
    txt.classList.remove('clamp');
    var btn = card.querySelector('.expand-btn');
    btn.textContent = '收起'; btn.removeAttribute('data-expand'); btn.setAttribute('data-collapse', pid5);
    return;
  }
  if (t.hasAttribute('data-collapse')){
    var pid6 = t.getAttribute('data-collapse');
    if (E.textExpanded) E.textExpanded[pid6] = false;
    var card6 = document.getElementById('post-' + pid6);
    var txt6 = card6.querySelector('[data-post-text]');
    txt6.classList.add('clamp');
    var btn6 = card6.querySelector('.expand-btn');
    btn6.textContent = '展开全文'; btn6.removeAttribute('data-collapse'); btn6.setAttribute('data-expand', pid6);
    return;
  }
  // 个人主页
  if (t.hasAttribute('data-user')){ go('profile', t.getAttribute('data-user')); return; }
  if (t.hasAttribute('data-friend')){
    var fid = t.getAttribute('data-friend'), fu = getUser(fid); if (!fu) return;
    snap();
    fu.rel = 'added';
    addNotif({type:'friend', kind:'accepted', actor: fid});
    if(!save()) return;
    render();
    toast('已向 ' + fu.name + ' 发送好友请求，对方已通过');
    return;
  }
  if (t.hasAttribute('data-tab')){ E.profTab = t.getAttribute('data-tab'); render(); return; }
  // 通知
  if (t.hasAttribute('data-notif')){
    var nid = t.getAttribute('data-notif'), n = S.notifs.find(function(x){ return x.id === nid; }); if (!n) return;
    snap();
    n.read = true;
    if(!save()) return;
    var p9 = findPost(n.postId);
    if (p9){ route.view = p9.board === 'plaza' ? 'plaza' : 'home'; route.anchor = p9.id; render(); }
    else { go('msg'); }
    return;
  }
  if (t.hasAttribute('data-accept')){
    var nid2 = t.getAttribute('data-accept'), n2 = S.notifs.find(function(x){ return x.id === nid2; }); if (!n2) return;
    snap();
    n2.pending = false; n2.read = true;
    var fu2 = getUser(n2.actor); if (fu2) fu2.rel = 'added';
    if(!save()) return;
    render(); toast('已添加 ' + (fu2 ? fu2.name : '') + ' 为好友');
    return;
  }
  if (t.hasAttribute('data-ignore')){
    var nid3 = t.getAttribute('data-ignore'), n3 = S.notifs.find(function(x){ return x.id === nid3; }); if (!n3) return;
    snap();
    n3.pending = false; n3.read = true;
    if(!save()) return;
    render(); toast('已忽略该请求');
    return;
  }
  if (t.hasAttribute('data-markread')){ snap(); S.notifs.forEach(function(n){ n.read = true; }); if(!save()) return; render(); return; }
  // 广场
  if (t.hasAttribute('data-chip')){ E.plazaCatFilter = t.getAttribute('data-chip'); render(); return; }
  if (t.hasAttribute('data-plaza')){
    var qid = t.getAttribute('data-plaza'), q = findPost(qid); if (!q) return;
    snap();
    q.views = (q.views || 0) + 1;
    if(!save()) return;
    var uq = getUser(q.author), cq = catOf(q.cat);
    openModal('<h3>' + esc(q.title) + '</h3>' +
      '<span class="pill" style="background:' + cq.bg + ';color:' + cq.fg + '">' + cq.name + '</span>' +
      '<div class="pc-full">' + esc(q.text) + '</div>' +
      (q.imgs && q.imgs.length ? '<div class="imgs n1">' + photoHtml(q.imgs[0]) + '</div>' : '') +
      '<div class="pc-foot" style="margin-top:12px;color:var(--text3);font-size:12px;display:flex;align-items:center;gap:8px">' + avatarHtml(uq, 28) + '<b style="color:var(--text2)">' + esc(uq.name) + '</b><span>· ' + timeStr(q.ts) + '</span><span style="margin-left:auto">' + q.views + ' 浏览</span></div>' +
      '<div class="modal-foot" style="margin-top:16px"><button class="btn secondary" data-close-modal>关闭</button></div>', 'plaza-detail');
    return;
  }
  // 编辑资料
  if (t.hasAttribute('data-edit')){
    openModal('<h3>编辑资料</h3>' +
      '<div class="form-row"><label for="edit-name">昵称</label><input id="edit-name" maxlength="12" value="' + esc(S.me.name) + '"></div>' +
      '<div class="form-row"><label for="edit-sign">个性签名</label><textarea id="edit-sign" maxlength="60">' + esc(S.me.sign) + '</textarea></div>' +
      '<div class="modal-foot"><button class="btn secondary" data-close-modal>取消</button><button class="btn primary" data-save-edit>保存</button></div>');
    setTimeout(function(){ var el = $('#edit-name'); if (el) el.focus(); }, 50);
    return;
  }
  if (t.hasAttribute('data-save-edit')){
    var nm = $('#edit-name'), sg = $('#edit-sign');
    var nv = (nm.value || '').trim();
    if (!nv){ toast('昵称不能为空', 'error'); return; }
    snap();
    S.me.name = nv; S.me.sign = (sg.value || '').trim();
    if(!save()) return;
    closeModal(); render(); toast('资料已更新');
    return;
  }
  if (t.hasAttribute('data-reset')){
    if (confirm('确定重置演示数据吗？将清空你的发帖、点赞、评论等操作记录。')){
      localStorage.removeItem(LS_KEY);
      S = seedState(); save();
      E = {homeOpen:false,homeText:'',homePhotos:[],homeNewId:null,plazaOpen:false,plazaTitle:'',plazaText:'',plazaPhotos:[],plazaCat:'club',cmtOpen:{},cmtVal:{},expanded:{},plazaCatFilter:'all',profTab:'posts'};
      go('home'); toast('演示数据已重置');
    }
    return;
  }
  // 弹窗
  if (t.hasAttribute('data-close-modal')){ closeModal(); return; }
});

document.addEventListener('keydown', function(ev){
  if (ev.key === 'Enter'){
    var t = ev.target.closest && ev.target.closest('[data-cmt-input]');
    if (t){ ev.preventDefault(); var btn = document.querySelector('[data-cmt-send="' + t.getAttribute('data-cmt-input') + '"]'); if (btn) btn.click(); }
  }
  if (ev.key === 'Escape'){ closeModal(); }
  if (ev.key === 'Enter' || ev.key === ' '){
    var el = ev.target.closest && ev.target.closest('[role="button"]');
    if (el && ev.target === el){ ev.preventDefault(); el.click(); }
  }
});

document.addEventListener('input', function(ev){
  var t = ev.target;
  if (t.id === 'home-text'){ E.homeText = t.value; updateCount('home', t.value); }
  if (t.id === 'plaza-text'){ E.plazaText = t.value; updateCount('plaza', t.value); }
  if (t.id === 'plaza-title'){ E.plazaTitle = t.value; }
  if (t.hasAttribute && t.hasAttribute('data-cmt-input')){ E.cmtVal[t.getAttribute('data-cmt-input')] = t.value; }
});

function openModal(html, cls){
  $('#modal-root').innerHTML = '<div class="modal-mask" data-close-mask><div class="modal ' + (cls || '') + '" role="dialog" aria-modal="true">' + html + '</div></div>';
}
function closeModal(){ $('#modal-root').innerHTML = ''; }

// 点击遮罩关闭（不随卡片内容冒泡误关）
$('#modal-root').addEventListener('click', function(ev){
  if (ev.target.classList.contains('modal-mask')) closeModal();
});

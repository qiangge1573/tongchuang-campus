/* ============================================================
 * store.js —— 演示数据种子、localStorage 持久化与写入失败回滚
 * 数据模型见 docs/ARCHITECTURE.md；所有写路径统一走 save()。
 * ============================================================ */
/* ================= 数据层（localStorage 持久化） ================= */
var LS_KEY = 'tongchuang_v1';

var PHOTOS = [
  {e:'🌇', g:'linear-gradient(135deg,#FFC46B,#FF6B35)'},
  {e:'📚', g:'linear-gradient(135deg,#8FB4FF,#3D6FE8)'},
  {e:'🍜', g:'linear-gradient(135deg,#FFD08A,#FF8A3D)'},
  {e:'🏃', g:'linear-gradient(135deg,#9BE8C5,#2BB889)'},
  {e:'🌳', g:'linear-gradient(135deg,#C4E986,#5BA83C)'},
  {e:'🎤', g:'linear-gradient(135deg,#F5A3C7,#E85D9A)'},
  {e:'🤖', g:'linear-gradient(135deg,#9BA8FF,#5B6BE8)'}
];

var CATS = [
  {k:'club',  name:'社团招新', bg:'#ECF1FD', fg:'#3D6FE8'},
  {k:'event', name:'活动',     bg:'#FFF3E9', fg:'#E05A1E'},
  {k:'mate',  name:'搭子',     bg:'#E8F7F1', fg:'#1E9A6E'},
  {k:'help',  name:'求助',     bg:'#EEF0F4', fg:'#646A73'}
];

var SIM_COMMENTS = ['前排！','说得太对了👍','同感哈哈，太真实了','路过点个赞','下次记得带上我','这就是大学生活啊','羡慕了','哈哈哈哈笑死我'];

function seedState(){
  return {
    me: {id:'me', name:'李知远', school:'青山大学', dept:'计算机学院', grade:'大三', sign:'代码写累了，就去操场跑两圈', c:'#3D6FE8'},
    users: [
      {id:'u1', name:'陈晓雨', dept:'计算机学院',   grade:'大三', sign:'bug 改完就去吃火锅',          c:'#FF6B35', rel:'added'},
      {id:'u2', name:'林子豪', dept:'机械工程学院', grade:'大二', sign:'机器人社 · 拧螺丝担当',       c:'#2BB889', rel:'added'},
      {id:'u3', name:'苏婉清', dept:'外国语学院',   grade:'大三', sign:'语言是看世界的另一双眼睛',    c:'#E85D9A', rel:'added'},
      {id:'u4', name:'赵一鸣', dept:'经济管理学院', grade:'大四', sign:'秋招上岸，山顶见',            c:'#8A6BE8', rel:'none'},
      {id:'u5', name:'何佳琪', dept:'新闻传播学院', grade:'大二', sign:'在校报记者 · 快门爱好者',     c:'#00A3C4', rel:'none'},
      {id:'u6', name:'王浩然', dept:'物理学院',     grade:'大三', sign:'遇事不决，量子力学',          c:'#F0443C', rel:'none'}
    ],
    posts: [
      {id:'p1', board:'home', author:'me', ts:NOW-2*H,
       text:'在图书馆蹲了一下午，终于把操作系统的实验报告写完了🎉 出门抬头看到晚霞，突然觉得这一周都值了。兄弟们，周末操场见！',
       imgs:[0], likes:[{u:'u1',ts:NOW-1.8*H},{u:'u2',ts:NOW-1.5*H}],
       comments:[{a:'u1',text:'求实验报告模板，下一届学弟先跪谢🙏',ts:NOW-1.7*H},{a:'u2',text:'操场走起，叫上子豪',ts:NOW-1.2*H}],
       views:36},
      {id:'p2', board:'home', author:'u1', ts:NOW-3.5*H,
       text:'提醒计算机学院的各位：下周三数据结构期中考试，重点看树和图。复习进度 0% 的同学，我们的痛是相通的😢',
       imgs:[], likes:[{u:'u2',ts:NOW-3*H}],
       comments:[{a:'u5',text:'还在链表徘徊的我，已经瑟瑟发抖',ts:NOW-2.6*H}],
       views:58},
      {id:'p3', board:'home', author:'u2', ts:NOW-5*H,
       text:'机器人社本周例会改到周五晚 7 点，工科楼 B201。新学期第一场招新宣讲，有奶茶，有机器人可以摸，就差你了！',
       imgs:[6], likes:[{u:'u1',ts:NOW-4.5*H},{u:'u6',ts:NOW-4*H}],
       comments:[{a:'u1',text:'已报名，奶茶是我的',ts:NOW-4.2*H}],
       views:71},
      {id:'p4', board:'home', author:'u3', ts:NOW-26*H,
       text:'日语角今天聊「我的家乡」，来了十几个新面孔。敢开口的第一步，永远值得鼓励。下周五英文角见！',
       imgs:[], likes:[{u:'u5',ts:NOW-20*H}],
       comments:[], views:44},
      {id:'p5', board:'home', author:'me', ts:NOW-28*H,
       text:'跑完五公里打卡🏃‍ 跑道上的风把一周的疲惫都吹散了。坚持第 6 周，评论区求监督！',
       imgs:[3], likes:[{u:'u3',ts:NOW-27*H},{u:'u1',ts:NOW-26*H},{u:'u4',ts:NOW-25*H}],
       comments:[{a:'u3',text:'自律的人最可怕（褒义）',ts:NOW-26.5*H}],
       views:52},
      {id:'p6', board:'home', author:'u4', ts:NOW-2*D-3*H,
       text:'offer 到手了！经管的这四年，在今天终于有了着落。感谢每一位帮我改过简历、陪我模拟面试的同学。青山大学，谢谢你。',
       imgs:[], likes:[{u:'u1',ts:NOW-2*D},{u:'u2',ts:NOW-2*D+H},{u:'u3',ts:NOW-46*H},{u:'u5',ts:NOW-45*H},{u:'u6',ts:NOW-44*H},{u:'me',ts:NOW-43*H}],
       comments:[{a:'u1',text:'恭喜鸣哥！庆功宴安排上',ts:NOW-47*H},{a:'u5',text:'学长牛！请收下我的膝盖',ts:NOW-46*H}],
       views:133},
      {id:'p7', board:'home', author:'u5', ts:NOW-3*D,
       text:'重磅测评：食堂二楼新开的麻辣香锅窗口，中午 12 点前不用排队。加麻加辣加香菜，香到跺脚🌶️',
       imgs:[2], likes:[{u:'u3',ts:NOW-70*H},{u:'u6',ts:NOW-69*H}],
       comments:[{a:'u3',text:'已经二刷，确实香',ts:NOW-69.5*H},{a:'u2',text:'今晚就去，求拼桌',ts:NOW-68*H}],
       views:96},
      {id:'p8', board:'home', author:'u6', ts:NOW-4*D,
       text:'做完物理实验 pre，从此对示波器有了感情，也有了阴影。顺便求一本二手《量子力学导论》，评论区见。',
       imgs:[], likes:[{u:'u4',ts:NOW-92*H}],
       comments:[], views:38},
      {id:'q1', board:'plaza', cat:'club', author:'u2', ts:NOW-8*H, views:132,
       title:'机器人社 2026 秋季招新',
       text:'热爱硬件或代码的同学看过来！本周五晚 7 点工科楼 B201 招新宣讲，现场有比赛机器人演示和免费奶茶。零基础完全欢迎，学长手把手带你入门。报名即送社团定制贴纸～',
       imgs:[6], likes:[], comments:[]},
      {id:'q2', board:'plaza', cat:'event', author:'u3', ts:NOW-20*H, views:87,
       title:'外语角 · 本周五晚',
       text:'本周话题：我的家乡。中英日韩语桌全开，来了就能聊，聊了就有朋友。地点：大学生活动中心一楼咖啡厅，19:00 开始，随时加入随时走。',
       imgs:[], likes:[], comments:[]},
      {id:'q3', board:'plaza', cat:'mate', author:'u1', ts:NOW-30*H, views:45,
       title:'找周五晚自习搭子',
       text:'图书馆三楼靠窗，19:00–21:30，可以互相监督不玩手机。计算机学院优先但不限，来两个也行，来一排更好。',
       imgs:[], likes:[], comments:[]},
      {id:'q4', board:'plaza', cat:'help', author:'u6', ts:NOW-2*D, views:63,
       title:'求二手《量子力学导论》',
       text:'物理学院大三课程用书，周世勋版最好，其他版本也可以聊。价格好说，实在不行可以用食堂麻辣香锅交换（认真的）。',
       imgs:[], likes:[], comments:[]},
      {id:'q5', board:'plaza', cat:'event', author:'u5', ts:NOW-3*D, views:158,
       title:'校园歌手大赛开始报名',
       text:'初赛 11 月中旬，弹唱、组合、原创都欢迎。想上舞台的同学来传播学院 201 找我现场报名，或者在评论区吼一嗓子，我去找你！',
       imgs:[5], likes:[], comments:[]}
    ],
    notifs: [
      {id:'n1', type:'like',    actor:'u1', postId:'p1', ts:NOW-1.8*H, read:false},
      {id:'n2', type:'comment', actor:'u2', postId:'p1', text:'操场走起，叫上子豪', ts:NOW-1.2*H, read:false},
      {id:'n3', type:'friend',  kind:'request', actor:'u5', ts:NOW-22*H, read:false, pending:true}
    ],
    seq: 100
  };
}

function load(){ try{ var s = localStorage.getItem(LS_KEY); return s ? JSON.parse(s) : null; }catch(e){ return null; } }
/* P2-1 修复：写入失败不再静默——提示用户并回滚到最近一次快照，保证界面与存储一致 */
var _snap = null;
function snap(){ try{ _snap = JSON.stringify(S); }catch(e){ _snap = null; } }
function save(){
  try{ localStorage.setItem(LS_KEY, JSON.stringify(S)); _snap = null; return true; }
  catch(e){
    if(_snap){ try{ S = JSON.parse(_snap); }catch(e2){} _snap = null; }
    toast('存储空间已满，操作未能保存', 'error');
    try{ render(); }catch(e3){}
    return false;
  }
}
var S = load(); if(!S){ S = seedState(); save(); }

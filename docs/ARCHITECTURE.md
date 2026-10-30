# 架构说明

## 1. 分层职责

| 文件 | 职责 | 允许依赖 |
| --- | --- | --- |
| `assets/js/core.js` | 常量（`H` / `D` / `NOW`）、`esc()` 转义、时间格式化、头像与占位图、Toast、Modal | 无（只依赖 DOM） |
| `assets/js/store.js` | 演示数据种子、`load/save/snap`、写入失败回滚、全局状态 `S` | `core.js` |
| `assets/js/views.js` | 视图状态 `route` / `E`、`postCard()`、四个页面渲染、`render()` | `core.js`、`store.js` |
| `assets/js/interactions.js` | 路由跳转、发布/点赞/评论/好友/资料等动作、事件委托、输入绑定 | 以上全部 |
| `assets/js/pwa.js` | Service Worker 注册与 `controllerchange` 单次刷新 | 无 |
| `assets/js/main.js` | 启动：`render()` | 以上全部 |

加载顺序由 `index.html` 的 `defer` 保证：`core → store → views → interactions → pwa → main`。所有跨文件引用都是函数声明，调用发生在事件或 `main.js` 启动之后，因此不存在初始化顺序问题（`save()` 的回滚分支对 `render()` 做了 `try/catch`）。

## 2. 渲染流程

```
用户点击 (data-* 属性)
        │
        ▼
interactions.js 事件委托  ──►  修改 S / E
        │                        │
        │                        ├─ save() 失败 → 回滚快照 + Toast + 重渲染
        ▼                        ▼
     render()  ──►  views.js 各页面字符串拼接  ──►  #app.innerHTML
        │
        ├─ 更新导航 active 态与未读角标
        ├─ requestAnimationFrame：长文折叠检测、锚点定位、输入框聚焦
        └─ bindInputs()：为发布框绑定 input 事件（innerHTML 会丢失监听）
```

页面没有使用虚拟 DOM，也没有细粒度 diff；点赞这类高频操作为了不打断输入，采用“就地改按钮”的局部更新，其余操作统一重渲染。

## 3. 数据模型

存储键：`tongchuang_v1`（`localStorage`，整棵状态树一次性序列化）。

```jsonc
{
  "me":   { "id": "me", "name": "李知远", "school": "青山大学", "dept": "计算机学院",
            "grade": "大三", "sign": "…", "c": "#3D6FE8" },
  "users":[{ "id": "u1", "name": "陈晓雨", "dept": "…", "grade": "…",
            "sign": "…", "c": "#FF6B35", "rel": "added | none" }],
  "posts":[
    { "id": "p1", "board": "home | plaza", "author": "me | u1",
      "ts": 1690000000000, "text": "…", "imgs": [0], "views": 36,
      "likes":    [{ "u": "u1", "ts": 1690000000000 }],
      "comments": [{ "a": "u1", "text": "…", "ts": 1690000000000 }],
      // 仅广场帖有：
      "title": "…", "cat": "club | event | mate | help" }
  ],
  "notifs":[
    { "id": "n1", "type": "like | comment | friend", "actor": "u1",
      "postId": "p1", "text": "…", "ts": 1690000000000, "read": false,
      "kind": "request | accepted", "pending": true }
  ],
  "seq": 100
}
```

- `seq` 用于生成自增 id（`uid()` → `x101`），避免随机 id 冲突。
- `imgs` 存的是占位图索引（0–6），对应 `PHOTOS` 数组的渐变 + emoji，不存图片数据。
- 关系状态只有 `added` / `none` 两档，好友请求通过后写 `rel: "added"`。

## 4. 持久化与失败保护

```js
snap();            // 写前拍快照：JSON.stringify(S)
…修改 S…
if (!save()) return;   // 写失败时 S 已回滚，后续渲染/提示都不执行
```

- `save()` 捕获 `QuotaExceededError` 等写入异常：恢复 `_snap` 快照 → Toast「存储空间已满，操作未能保存」→ 重渲染。
- 12 条写路径（发布、点赞、评论、好友、通知、资料、重置等）全部遵循「先快照、再保存、失败即返回」，保证界面与存储一致。

## 5. PWA 缓存策略

`sw.js` 只处理同源 GET：

| 请求类型 | 策略 | 原因 |
| --- | --- | --- |
| `mode: navigate` / `document` | 网络优先，失败回退缓存 `index.html` | 发版后立即生效，同时保证离线可开 |
| 其他静态资源 | 缓存优先 + 后台更新（stale-while-revalidate） | 首屏快，新资源下次接管 |
| 非 GET / 跨域 | 不拦截 | 不缓存用户数据，避免污染缓存 |

`install` 阶段 `addAll(APP_SHELL)` 预缓存 HTML、清单、3 份 CSS、6 份 JS、3 个图标；`activate` 清理非当前 `CACHE_VERSION` 的缓存，并 `clients.claim()`。页面侧在 `controllerchange` 时只自动刷新一次，避免首装即刷新。

**发版规则**：改动任何前端资源后，把 `CACHE_VERSION` 递增（`tongchuang-v4` → `tongchuang-v5`）。

## 6. 扩展指引

- **接后端**：保留 `views.js` 的渲染函数，把 `store.js` 的 `load/save` 改成 `fetch` + 内存缓存；`interactions.js` 里的每个动作改成 `await api.xxx()` 后 `render()`。
- **加页面**：在 `render()` 增加分支 + 导航 `data-go`，无需改动事件委托（`data-go` 已在总选择器里）。
- **换主题**：只改 `assets/css/base.css` 的 `:root` 变量；品牌色同时涉及 `manifest.webmanifest` 的 `theme_color` 与图标 SVG 的渐变。
- **加真实图片**：把 `photoHtml()` 换成 `<img loading="lazy">`，并把 `imgs` 改为 URL 数组。

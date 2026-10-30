# 同窗 · 校园社交（PWA）

面向在校大学生的「实名同学」社交单页应用演示。这一版把原始的单文件原型拆成了可直接托管、可维护的工程结构，并保留了完整的 PWA 能力：可安装到主屏幕、断网可打开、发版能自动更新。

> 这是一个**纯前端演示项目**：没有后端、没有真实账号体系，页面里的同学、动态、评论均为虚构示例数据，仅用于交互与视觉演示。

## 功能一览

| 模块 | 能力 |
| --- | --- |
| 动态 | 发帖（50–500 字提示、话题表情配图）、点赞、评论（可展开全部/收起）、长文折叠、发布后模拟同学互动 |
| 广场 | 四类信息（社团招新 / 活动 / 搭子 / 求助）、分类筛选、瀑布流卡片、详情弹窗、浏览量累计 |
| 消息 | 好友请求（接受 / 忽略）、点赞与评论通知、未读红点、全部标为已读、点击通知跳转原帖 |
| 我的 | 个人主页、动态/关于双 Tab、昵称与签名编辑、好友添加、演示数据重置 |
| 基础能力 | localStorage 持久化（刷新/重开不丢）、写入失败提示并整体回滚、移动端底部 Tab、深浅一致的令牌化设计 |

## 快速开始

Service Worker 与 manifest 不支持 `file://` 协议，请用任意静态服务器打开：

```bash
# 方式一：仓库内置脚本（需要 python3）
npm run dev          # 等价于 python3 -m http.server 8000

# 方式二：任意你习惯的工具
npx serve .
```

浏览器访问 <http://localhost:8000/>。

### 安装到手机

- **iPhone（Safari）**：打开页面 → 分享 → 「添加到主屏幕」→ 全屏独立运行。
- **Android（Chrome）**：打开页面 → 菜单 → 「安装应用」/ 地址栏安装图标。

### 部署到 GitHub Pages

仓库已附带 `.github/workflows/pages.yml`。在仓库 **Settings → Pages → Build and deployment** 把 Source 选为 **GitHub Actions**，之后每次推送到 `main` 会自动发布；也可在本地用任意静态托管（Vercel、Netlify、OSS、COS 等）直接上传仓库根目录。

## 目录结构

```text
tongchuang-campus/
├── index.html                  # 页面骨架：头部元信息 + 导航 + 视图挂载点
├── manifest.webmanifest        # Web App Manifest（standalone / 主题色 / 矢量图标）
├── sw.js                       # Service Worker：应用外壳预缓存 + 三种更新策略
├── package.json                # 仅提供本地起服务的脚本，无运行时依赖
├── assets/
│   ├── css/
│   │   ├── base.css            # 设计令牌（颜色/圆角/阴影/字体）与基础样式
│   │   ├── components.css      # 按钮、卡片、头像、导航、弹窗、Toast
│   │   └── views.css           # 首页/广场/消息/主页布局 + 移动端与安全区适配
│   ├── js/
│   │   ├── core.js             # 常量、格式化、Toast/Modal 等通用工具
│   │   ├── store.js            # 演示数据种子、localStorage 读写与回滚
│   │   ├── views.js            # 视图状态与四个页面的字符串渲染
│   │   ├── interactions.js     # 路由、业务动作、事件委托
│   │   ├── pwa.js              # Service Worker 注册与版本接管刷新
│   │   └── main.js             # 启动入口：渲染首屏
│   └── icons/                  # 矢量图标（any / maskable / iOS）
└── docs/
    └── ARCHITECTURE.md         # 分层职责、数据模型、渲染与缓存策略
```

## 设计要点

- **分层而非分模块**：刻意保留“全局函数 + 事件委托”的轻量写法，脚本用 `defer` 按 `core → store → views → interactions → pwa → main` 顺序加载，不引入构建链，克隆下来就能跑。
- **单一数据源**：所有状态在 `S`（localStorage 键 `tongchuang_v1`）里，所有写操作统一走 `save()`。写满配额时先回滚快照、再提示、最后重渲染，避免“界面成功、存储失败”。
- **令牌化样式**：颜色、圆角、阴影集中在 `base.css` 的 `:root`，换主题只改一处；交互元素统一 44px 最小可点击高度。
- **PWA 三策略**：导航请求网络优先（发版即时生效）、静态资源 stale-while-revalidate（打开快）、版本变更自动清旧缓存；离线时回退到缓存外壳。
- **可访问性**：`aria-pressed` / `aria-selected` / `role="tablist"`、`focus-visible` 焦点环、Enter/Space 激活自定义按钮、`prefers-reduced-motion` 关闭动画。
- **矢量图标**：图标全部为 SVG（`any` / `maskable` / `apple-touch-icon`），仓库不含二进制资源，方便 review 与 diff。

## 验证记录

在本机用无头 Chrome 跑了一遍端到端回归（iframe 内真实点击 + 读取 `localStorage`）：

- 首屏渲染、样式生效、演示数据落盘、390px 无横向溢出：4/4
- 发布框展开、发布后置顶、刷新后仍在：3/3
- 点赞态切换、计数 +1：2/2
- 评论框展开、提交、Toast 提示：3/3
- 广场卡片、分类筛选、详情弹窗、关闭：4/4
- 消息列表、好友请求、接受请求：3/3
- 我的主页、资料保存、导航头像同步、关于页、他人主页：5/5
- 静态资源全部 200、manifest 可解析、SW 已注册：3/3

合计 27/27 通过；桌面 1280×900 与窄屏 500×900 截图人工核验排版正常。Lighthouse 未在本机跑，PWA 安装能力以「manifest + SW 注册 + 外壳缓存」的实际结果为准。

## 已知限制

- 无后端：账号、实名、关系链都是本地模拟；清空浏览器数据即回到初始演示状态。
- 图片是 CSS 渐变 + emoji 占位，不涉及真实上传。
- 图标为 SVG：现代浏览器（含 Chrome 安装流程）可直接使用；iOS 旧版若要求位图主屏图标，可把 `assets/icons/apple-touch-icon.svg` 导出为 180×180 PNG 并替换 `index.html` 中的 link。

## 后续路线

1. 接入真实后端：把 `store.js` 的读写换成 API 调用，`views.js` 基本不动。
2. 拆分「关注 / 好友 / 私信」为独立数据表，补充分页与游标。
3. 图片上传走对象存储 + 压缩，替换渐变占位。
4. 增加深色主题（`prefers-color-scheme`）与骨架屏。
5. 引入最小测试：把端到端脚本（无头浏览器点击 + 读存储）固化为 CI 任务。

## 许可证

[MIT](./LICENSE)

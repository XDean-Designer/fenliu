# 剑琅联盟 · 开店分流与承接（独立演示包）

本仓库（`fenliu`）可**单独 clone / 拷贝**演示，不依赖仓库外任何文件夹。

## 在线预览（GitHub Pages）

https://xdean-designer.github.io/fenliu/

仓库：https://github.com/XDean-Designer/fenliu  
Pages：`main` 分支根目录 `/`（已含 `.nojekyll`）

---

## 三步本地演示（推荐）

> **禁止**用资源管理器双击 `index.html`（`file://`）——嵌壳 iframe 会白屏或丢 CSS。  
> Cursor / VS Code 请用下面的本地服务地址打开，不要用「Open File」。

### Windows

1. 安装 [Node.js 18+](https://nodejs.org/)
2. 双击本目录 `start.bat`（或在本目录执行 `npm start`）
3. 浏览器打开自动弹出的  
   `http://127.0.0.1:8765/index.html`

### macOS / Linux

```bash
chmod +x start.sh
./start.sh
# 或：npm start
```

浏览器打开：`http://127.0.0.1:8765/index.html`

### 自检（可选）

```bash
npm run smoke                 # 只检查本仓库文件是否齐全
npm start                     # 另开终端
npm run smoke:http            # 再检查 HTTP 是否 200、index.html 是否被错误重定向
```

---

## 演示范围与冒烟清单

### A. 壳层侧栏（必须）

| 入口 | 预期 |
|------|------|
| 分流页 | 四张彩卡 +「先随便看看」 |
| 获客 / 小店 / 首页 RTB / 学习 | 各板块可进；退出后「接下来去哪里看看？」藏当前板块 |
| 价目表 / 员工 / 开单 / 获客发布 | 嵌壳有样式、非白屏 |
| 卡管理 / 订单流水 | 占位页正常 |

### B. 子模块左侧深链（抽检）

| 模块 | 深链示例 |
|------|----------|
| `价目表/` | 空态 / 项目列表 / 分组管理 / 新增项目 |
| `提成设置/` | 员工列表 / 员工详情 / 方案列表 / 员工薪资 |
| `开单/` | s1 散客开单 / s6 结算 / s15 开单成功 |
| `RTS页面/` | b001 首页 → 发布活动 → 配置 → 内部广场 |

手机预览：真机 UA 自动全屏；桌面可加 `?mobile=1`，强制桌面壳 `?mobile=0`。

---

## 包内模块

| 路径 | 说明 |
|------|------|
| `index.html` | 分流壳：四条承接、首页热区、引导弹窗 |
| `价目表/` | 价目表原型（空态入口；新建成功引导去员工） |
| `提成设置/` | 员工管理 + 提成方案 |
| `开单/` | 开单结账原型 |
| `RTS页面/` | 获客发布主链 |
| `jl-rtb-shell.js` · `assets/jl-embed-coach.*` | 管店点击引导 / 嵌壳手型 |
| `assets/triage/` · `assets/statusbar/*_fig.svg` | 分流图标与状态栏 |
| `start.bat` · `start.sh` · `package.json` | 标准本地服务（`http-server`，保留 `.html` 路径） |
| `scripts/smoke-check.mjs` | 文件 / HTTP 冒烟自检 |

---

## 跨电脑常见问题

| 现象 | 处理 |
|------|------|
| 嵌壳纯白 / CSS 错乱 | 确认用 `npm start` / `start.bat`，地址带 `index.html`；执行 `npm run smoke` |
| `file://` 打开异常 | 改用本地服务（见上） |
| 中文目录名乱码 | Git / 系统使用 UTF-8；重新 `git clone` 本仓库 |
| Pages 与本地不一致 | 拉最新 `main`；Pages 根目录已配 `.nojekyll` |

---

## 技术约定（维护用）

1. 嵌壳 URL **必须**带显式 `*.html`（如 `价目表/index.html?...`），不要只写目录尾斜杠。
2. 本地默认用 `http-server`（不剥离 `.html`）。勿用会把 `index.html` 收成无尾斜杠目录的静态服务器。
3. 价目表 / 提成设置 `<head>` 含尾斜杠自愈脚本；壳层另有 stylesheet 纠偏。
4. 壳层字体使用系统栈，**不依赖** Google Fonts CDN。
5. Pages 根目录保留 `.nojekyll`，避免 Jekyll 丢掉资源。

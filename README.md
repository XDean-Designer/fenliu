# 剑琅联盟 · 开店分流与承接（独立演示包）

本仓库（`fenliu`）可**单独 clone / 拷贝**演示，不依赖仓库外任何文件夹。

嵌壳模块目录为 **ASCII**（`price` / `staff` / `bill` / `rts`），避免 Cursor 内置浏览器与部分环境下中文路径 iframe 白屏。

## 在线预览（GitHub Pages）

https://xdean-designer.github.io/fenliu/

仓库：https://github.com/XDean-Designer/fenliu  
Pages：`main` 分支根目录 `/`（含 `.nojekyll`）

---

## 三步本地演示（必须这样开）

> **禁止** `file://` 双击、禁止 Cursor「Open File」直接开 `index.html`。  
> 嵌壳依赖 HTTP；错误打开方式会导致价目表 / 获客等 **纯白**。

### Windows

1. 安装 [Node.js 18+](https://nodejs.org/)
2. 双击本目录 **`start.bat`**（或 `npm start`）
3. 浏览器打开：`http://127.0.0.1:8765/index.html`

### macOS / Linux

```bash
chmod +x start.sh && ./start.sh
# 或：npm start
```

打开：`http://127.0.0.1:8765/index.html`

### 自检

```bash
npm run smoke                 # 文件树 + ASCII 路径
npm start                     # 另开终端
npm run smoke:http            # HTTP 200 强检四个模块
```

壳页启动时也会 `fetch` 探测 `price/staff/bill/rts` 入口；失败会 toast，不再静默白屏。

---

## 演示范围与冒烟清单

### A. 壳层侧栏

| 入口 | 预期 |
|------|------|
| 分流页 | 四张彩卡 |
| 获客 / 小店 / 首页 RTB / 学习 | 可进；退出转化窗藏当前板块 |
| 价目表 / 员工 / 开单 / 获客发布 | 嵌壳有样式、有内容（非白） |
| 卡管理 / 订单流水 | 占位正常 |

### B. 子模块深链（抽检）

| 目录 | 深链示例 |
|------|----------|
| `price/` | 空态 / 项目列表 / 分组 / 新增 |
| `staff/` | 员工列表 / 详情 / 方案 / 薪资 |
| `bill/` | s1 开单 / s6 结算 / s15 成功 |
| `rts/` | b001 → 发布 → 配置 → 广场 |

---

## 包内模块（路径）

| 路径 | 说明（界面仍用中文名） |
|------|------------------------|
| `index.html` | 分流壳 |
| `price/` | 价目表 |
| `staff/` | 员工 / 提成 |
| `bill/` | 开单结账 |
| `rts/` | 获客发布主链 |
| `jl-rtb-shell.js` · `assets/*` | 引导与资源 |
| `start.bat` · `start.sh` · `package.json` | 标准本地服务（`http-server`） |
| `scripts/smoke-check.mjs` | 冒烟自检 |

---

## 跨电脑白屏排查

| 现象 | 处理 |
|------|------|
| 获客 / 价目表白 | 是否用了 `start.bat`？地址是否 `127.0.0.1:8765/index.html`？ |
| toast「模块缺失」 | `git pull` 后确认有 `price/` `staff/` `bill/` `rts/` |
| 仍用旧中文目录 | 拉最新：`价目表` 等已更名为 ASCII |
| `file://` | 改用 `npm start` |

手机：真机 UA 自动全屏；桌面 `?mobile=1` / `?mobile=0`。

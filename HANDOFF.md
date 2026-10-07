# HANDOFF — Zcode 接手指南

> 本文档是完整交接包。内容规范部分是用户已验收的既定标准，**照此执行即可，不需要重新发明**；
> 标注 **【需确认】** 的点先单独和用户确认，其余直接做。

---

## 1. 项目与线上状态

- **项目**：《经济下行时代普通人的财富课》单页网站，面向经济学小白的 12 课阅读指南。
- **文件**：`index.html`（唯一页面）+ `styles.css` + `app.js` + `storage.js`。双击 index.html 即可本地打开。
- **Git**：`origin = https://github.com/lixiansheng-668/wealth-course-reading-guide.git`，`main` 跟踪 `origin/main`。
- **发布 = 推送 main**：GitHub Pages 已开启，push 后自动上线。
  线上地址：`https://lixiansheng-668.github.io/wealth-course-reading-guide/`
  （2026-10-07 更新：样板已随 `d6f143a` 上线；同日第 0、2 课详解铺开，线上为 0–3 课详解版。）
- **交接时刻的本地状态（历史，已了结）**：
  - 交接文档所记「已验收未提交」的样板改动，已于交接当天由 mimo 提交推送（commit `d6f143a`，仅含 index.html / styles.css / verify-deepdive.js / HANDOFF.md，无杂文件）；
  - **无关文件，永远不要提交**：`video_build/`、`一斗米四钱银_崩盘讲解.mp4`、`视频脚本_崩盘_分镜.md`、`nx-nco-explainer.svg`、`gh_login.txt`、`gh_login_err.txt`（登录痕迹，涉敏）。

---

## 2. 已验收的内容规范（核心交接物）

### 2.1 范围与进度

| 课程 | 状态 |
|---|---|
| 第 0 课（怎么学经济学，6 箭头） | ✅ 2026-10-07 ZCode 铺开（新补经济循环逻辑链） |
| 第 1 课（为什么会衰退，6 箭头） | ✅ 详解已写，用户验收「还不错」 |
| 第 2 课（资产·负债·现金流，5 箭头） | ✅ 用户确认纳入；2026-10-07 铺开（新补现金流逻辑链） |
| 第 3 课（经济泡沫，9 箭头） | ✅ 详解已写，用户验收「还不错」 |
| 第 4–12 课 | 未动，等铺开（下一批：第 4、5 课） |

### 2.2 详解配方（每课照此复制）

**插入位置**：`lesson-body` 内，逻辑链 `logic-chain` 之后、`two-col` 配套阅读之前；
该课没有逻辑链的（如第 2 课），先补一条 `.logic-chain`（JS 自动接管点亮交互）。

**固定结构**（参照 `index.html` 中 `#lesson-1 .deep-dive`、`#lesson-3 .deep-dive`，直接抄骨架）：

1. `<section class="deep-dive">` + `p.dd-label`（「本课详解 · 因果链逐步讲透」）
2. `p.dd-intro`：说明本课链条几个箭头，提示对照上方链条逐格点亮阅读
3. `ol.why-steps`：**每个箭头一段，数量 = 节点数 − 1**（链上 N 格 → N−1 段）
   - `h5.why-node`（「A → B（括号点题）」）
   - `p.why-key`：`<span>关键</span>` 开头，一句话给出这一步的核心机制
   - 正文：回答「为什么会这样」，2–4 句，短句、具体、不掉书袋
4. `div.dd-box.example`（**数字例子**）：完整可心算的推演（如 1000万户×500元=500亿/月；300万房子±20%杠杆表）
5. `div.dd-box.analogy`（**生活类比**）：小白秒懂的日常场景（封闭小镇、击鼓传花）
6. `figure.dd-figure`（**机制图**）：手绘内联 SVG + `figcaption.dd-fig-cap` + `p.dd-fig-note`
7. `div.dd-box.misread`（**常见误区**）：恰好 3 条，正面回应最可能的真实疑问
8. 与其他课交叉引用（如「接第 8 课的等待能力」），把 12 课串成网

**文风**：中文、面向小白、有温度、不居高临下；每段先给结论句再解释；
术语第一次出现时用一句话白话定义（如「预防性储蓄——不是没钱，是不敢花」）。

**课头**：`lesson-badge` 加「已铺开详解」；铺开全部后 badge 会失去区分意义 →
是否统一删掉 badge、是否改 `section-desc` 措辞 = **【需确认】**。

### 2.3 SVG 机制图约定

- `viewBox` 宽 640，按内容定高；`width:100%; height:auto`（已有 CSS）。
- 站点色板（styles.css `:root`）：纸底 `#f2f0ea`/`#e7e4dc`、墨 `#1a1f1c`、赭红 `#a63d2f`、
  石板蓝 `#3d4f5f`、灰绿 `#6b7f6e`、发丝线 `#c4bfb4`。字体与正文一致（PingFang/微软雅黑）。
- **marker id 全页唯一**：已有 `arrow`（hero）、`f-mk-s/f-mk-r`（图1）、`b-mk-r/b-mk-s`（图2），
  新图请用新前缀（如 `c-mk-*`），否则箭头会互相串色。
- 图内文字：`text-anchor="middle" dominant-baseline="central"`，主标签 14px/600，副标 11px。

### 2.4 技术红线

- **不要改**设计 token、字体、整体布局；只复用已有 class。
- 新增的详解样式已全部在 styles.css（搜 `deep dive`），不要另起炉灶。
- **`.lessons-main { min-width: 0 }` 不能删**：详解里的表格 `min-width:280px` 会把 375px
  移动端撑出 40px 横向溢出，这条是修复本体（2026-10-07 实测：删掉即复发）。
- 思考题探针在 `app.js` 的 `PROBES` 表；给某课加新探针要同步加在那里（内容与详解口径一致）。
- `.logic-chain` 中任何 ≥2 个 span 的链会自动挂上「下一步」点亮按钮（`initChains`），无需手写 JS。

---

## 3. 验证流程（全绿才算完成，不可跳过）

```bash
# 1) 起临时本地服务（playwright-cli 禁止 file:// 协议）
python -m http.server 8931 --bind 127.0.0.1   # 在项目根目录后台起，用完关掉

# 2) 全量断言 + 截图（ZCode 环境没有 $MIMO_NODE，直接用 node）
node verify-deepdive.js   # 期望 ALL PASS（4 课时 34 checks；每铺一课在 CASES 加一行，+7 checks）
```

- `verify-deepdive.js` 已改为**数据驱动**：顶部 `CASES` 表每课一行（id / why-steps 数 / 关键词），
  并内置 375px 溢出检查（必须为 0）与桌面/移动截图输出。

- `verify-deepdive.js` 顶部 require 了 npx 缓存里的 playwright 绝对路径。
  若路径失效（缓存被清），重新定位：
  `Get-ChildItem "$env:LOCALAPPDATA\npm-cache\_npx" -Recurse -Filter playwright\package.json`
- 唯一可忽略的控制台噪音：`favicon.ico` 404。
- 人工目检：重点看机制图文字有无重叠、箭头是否首尾相接、移动端无横向滚动。

---

## 4. 发布流程（全自动管线）

1. `git add` **只加**：`index.html styles.css app.js storage.js verify-deepdive.js README.md`
   （逐个点名添加，禁用 `git add -A`——工作区混着视频和登录文件。）
2. commit 信息用仓库既有英文短句风格，例如：
   `Expand lesson 1 and 3 with deep-dive explanations`
3. `git push origin main`
4. 线上核验：拉取 Pages URL，搜页面文字（如「本课详解」）确认已更新（CDN 缓存偶尔延迟，1–2 分钟）。
5. **push 认证失败就停下来问用户**，不要自行折腾凭据
   （历史上 `gh` device 登录因网络失败过，见 `gh_login_err.txt`）。

---

## 5. 任务清单与决策点

**【已定 · 直接执行】**
- [x] 首次接手先把当前未提交的样板改动 commit + push（mimo 已于交接当天完成，`d6f143a`）
- [x] 第 0、2 课详解铺开（2026-10-07，ZCode 第一批；第 2 课纳入已经用户确认）
- [ ] 铺开第 4–12 课详解（配方 = 2.2，样板 = 第 1、3 课）
- [ ] 每完成 1–2 课：跑第 3 节验证 → 第 4 节提交推送上线 → 给用户看

**【需与用户单独确认后再动】**
- [x] 第 2 课是否纳入（用户 2026-10-07 确认：纳入，一起铺开）
- [ ] 全量完成后的 badge / `section-desc` 文案清理
- [ ] 任何结构调整、样式改版、内容口径变化

**【不要做】**
- 提交视频相关文件、登录文件；改色板/字体；未经确认的大重构。

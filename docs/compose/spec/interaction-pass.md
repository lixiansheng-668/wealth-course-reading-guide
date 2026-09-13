---
feature: interaction-pass
status: designed
updated: 2026-09-12
branch: feature/interaction-pass
commits: 0c79ae1..<pending>
---

# 交互化改造：财富课阅读指南

## Report

## [S1] Problem

现有单页站信息完整，但交互几乎只有锚点跳转、滚动高亮和打印。用户角色是「读者」而非「学员」：12 课思考题、收入−30% 自测、逻辑链、月度监测表都只是静态展示，缺少「作答 → 反馈 → 进度」的闭环，体感太平。

## [S2] Design

保持纸本/讲义视觉（paper / ink / rust tokens，衬线标题），只增加学习型交互。全部状态存 `localStorage`，无账号、无后端。

### S2.1 统一存储契约

Key 前缀：`wealth-course:v1:`

```js
// progress
wealth-course:v1:progress
{ "lessons": { "0": true, "1": false, ... }, "updatedAt": "ISO" }

// probes（思考题自测）
wealth-course:v1:probes
{ "probe-id": { "revealed": true, "note": "..." } }

// runway calculator
wealth-course:v1:runway
{ "cash": 0, "debt": 0, "expense": 0, "income": 0, "dropPct": 30 }

// dashboard
wealth-course:v1:dashboard
{ "month": "2026-09", "rows": { "招聘": { "call": "", "note": "" }, ... } }
```

读写失败（隐私模式/配额）时静默降级为内存态，不抛错打断页面。

### S2.2 学习进度

- 每课 `article.lesson` 头部增加「标记完成」checkbox（`data-lesson="N"`）。
- 侧栏 `.lesson-nav a` 对应项显示完成态（勾/色点）。
- 顶栏或课程区顶部显示总进度：`已完成 X / 13` + 细进度条。
- 勾选立即写入 storage；刷新后恢复。

### S2.3 思考题自测（Probe）

在关键课插入可复用组件 `.probe`：

```html
<div class="probe" data-probe="l1-thrift">
  <p class="probe-q">为什么一个人少花钱是理性的…？</p>
  <label class="probe-input-label">先写你的想法（可选）
    <textarea class="probe-input" rows="3" placeholder="用自己的话写 1–3 句"></textarea>
  </label>
  <button type="button" class="btn btn-ghost probe-reveal">对照参考思路</button>
  <div class="probe-answer" hidden>
    <p class="probe-answer-label">参考思路</p>
    <p>…</p>
  </div>
</div>
```

行为：

- 初始隐藏参考答案；点「对照参考思路」展开，并标记 `revealed: true`。
- textarea 内容防抖 400ms 写入 storage。
- 重新加载保持已展开 + 笔记。

首批 probe（覆盖关键课，不每课硬塞）：

| id | 课 | 题 |
|----|----|----|
| `l0-map` | 0 | 经济变好是什么意思？GDP 涨了为何仍觉得难过？ |
| `l1-thrift` | 1 | 节俭悖论 |
| `l3-bubble` | 3 | 房价上涨是基本面还是借钱信仰？ |
| `l7-observe` | 7 | 行业观察清单（5 问，checkbox 型） |
| `l8-wait` | 8 | 谁没有被迫出局？你家靠哪条路径？ |

`l7-observe` 用 checkbox 列表而非 textarea；勾选状态写入同一 probes 存储。

### S2.4 收入撑多久计算器（第 2 课）

替换/升级第 2 课空白家庭作业表为可交互表单 `.runway`：

输入：现金及存款、其他可变现资产、月固定支出、月稳定收入、收入下降比例滑杆（默认 30%，0–70%）。

计算：

```
liquid = cash + liquidAssets
newIncome = income * (1 - dropPct/100)
surplus = newIncome - expense   // 可为负
if surplus >= 0 → 月数显示「现金流可覆盖（盈余）」
else months = liquid / abs(surplus)  // 可撑月数
```

旁注规则：

- months < 3 → 高风险文案  
- 3–6 → 偏紧  
- 6–12 → 较稳  
- >12 或盈余 → 缓冲充足  

输入 change/input 即时更新结果与文案；数值持久化。非数字/空按 0。不收集、不上传。

### S2.5 逻辑链逐步点亮

现有 `.logic-chain` 改为可推进：

- 容器增加 `data-chain`、按钮「下一步 / 重置」。
- 步骤 `<span>` 初始为弱化态；点击「下一步」依次点亮下一节（class `is-lit`）。
- 全部点亮后按钮变为「重置」。
- 至少覆盖第 1、3、4、6、7 课已有链条；不强制记忆点亮进度（可选轻量存 `chain-id → step`，非必须）。

### S2.6 月度监测表可编辑

`#dashboard` 区：

- 「月份」改为 `<input type="month">`。
- 「本月判断」「证据 / 备注」改为受控输入（input/textarea）。
- 每行指标 id 稳定：`hire,wage,biz,consume,realestate,credit,cpi,rate,self`。
- 变更写入 dashboard storage；打印按钮保留（打印时 input 显示当前值）。
- 增加「清空本月」次要按钮（确认后清空当前表单，不删历史语义以外的数据）。

### S2.7 视觉与可访问性

- 新组件沿用 `--paper --ink --rust --rule`；圆角 ≤2px；避免 SaaS 阴影。
- 完成态/点亮态用 rust 点或细边，不用大面积色块。
- 所有交互控件可键盘操作；`aria-expanded` 用于 probe 展开；进度条 `role="progressbar"`。
- `prefers-reduced-motion` 下禁用非必要过渡。

### S2.8 打印

打印仪表盘时隐藏「清空」按钮与进度 UI；输入框以当前值渲染。

## [S3] Out of Scope

- 登录/云同步/多设备  
- 周期数值模拟器、粒子/视差等装饰动效  
- 书单购买链接、支付  
- 修改课程文案结构（只加交互，不重写 12 课正文）  
- 构建工具链（继续纯静态三文件，可拆 `storage.js`/`interactions.js` 若有助于清晰）

## Tasks

- [ ] T1: 存储助手与进度条/课目完成勾选 — acceptance: 勾选一课后刷新仍完成；侧栏与顶栏进度一致 (covers: S2.1, S2.2)
- [ ] T2: Probe 组件与 5 处思考题自测 — acceptance: 展开参考答案与笔记刷新后保持；l7 勾选持久化 (covers: S2.1, S2.3; depends: T1)
- [ ] T3: 第 2 课收入撑多久计算器 — acceptance: 调整滑杆/输入后月数与风险文案即时更新，刷新后数值仍在 (covers: S2.1, S2.4; depends: T1)
- [ ] T4: 逻辑链逐步点亮（≥5 条链） — acceptance: 按「下一步」逐节点亮，「重置」恢复 (covers: S2.5)
- [ ] T5: 仪表盘可编辑+月份+清空 — acceptance: 填写判断/备注刷新保留；打印仍可用；清空有确认 (covers: S2.1, S2.6, S2.8)
- [ ] T6: 样式与无障碍打磨 — acceptance: 新组件与纸本风格一致；probe 有 aria-expanded；进度条有 role (covers: S2.7; depends: T1, T2, T3, T4, T5)
- [ ] T7: 本地验证脚本（Playwright 打开 file/静态服务） — acceptance: 脚本断言进度勾选、probe 展开、计算器输出、仪表盘写入四条主路径 (covers: S2.2–S2.6; depends: T6)

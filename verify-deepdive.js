const { chromium } = require("C:/Users/Administrator/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright");

// 每铺开一课，在 CASES 里加一行即可
const CASES = [
  { id: "lesson-0", steps: 6, texts: ["咖啡师工资", "小区水表"] },
  { id: "lesson-1", steps: 6, texts: ["500 亿", "封闭小镇"] },
  { id: "lesson-2", steps: 5, texts: ["跑道", "冻肉"] },
  { id: "lesson-3", steps: 9, texts: ["击鼓传花", "+67%"] },
  { id: "lesson-4", steps: 7, texts: ["9000 家银行", "输水管网"] },
  { id: "lesson-5", steps: 5, texts: ["12 年", "全镇一起还房贷"] },
  { id: "lesson-6", steps: 6, texts: ["30 倍杠杆", "担保书"] },
  { id: "lesson-7", steps: 7, texts: ["没有发生的收入", "反向运行的扶梯"] },
  { id: "lesson-8", steps: 6, texts: ["小李", "米缸"] },
  { id: "lesson-9", steps: 6, texts: ["8.7 万亿", "老宅"] },
  { id: "lesson-10", steps: 6, texts: ["9.9 元", "河流改道"] },
  { id: "lesson-11", steps: 5, texts: ["5 个月", "隔水舱"] },
  { id: "lesson-12", steps: 5, texts: ["三行假数据", "油表"] },
];

const URL = "http://127.0.0.1:8931/index.html";
let passed = 0;

function assert(cond, msg) {
  if (!cond) throw new Error("FAIL: " + msg);
  passed++;
  console.log("PASS:", msg);
}

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const loc = m.location() || {};
    const url = loc.url || "";
    if (url.includes("favicon")) return;
    errors.push("console: " + m.text() + " @ " + url);
  });

  await page.goto(URL, { waitUntil: "load" });
  await page.waitForSelector("#progress-bar", { timeout: 5000 });
  assert(errors.length === 0, "no page errors (got: " + errors.join(" | ") + ")");

  assert((await page.locator(".deep-dive").count()) === CASES.length, CASES.length + " deep-dive sections");

  for (const c of CASES) {
    const dd = page.locator("#" + c.id + " .deep-dive");
    assert((await page.locator("#" + c.id + " .why-steps > li").count()) === c.steps, c.id + ": " + c.steps + " why-steps");
    assert((await dd.locator(".dd-box.example").count()) === 1, c.id + " example box");
    assert((await dd.locator(".dd-box.analogy").count()) === 1, c.id + " analogy box");
    assert((await dd.locator(".dd-box.misread li").count()) === 3, c.id + " misread box with exactly 3 items");
    const txt = await dd.innerText();
    assert(c.texts.every((t) => txt.includes(t)), c.id + " key content present (" + c.texts.join(" / ") + ")");
    const svg = page.locator("#" + c.id + " .dd-figure svg");
    const box = await svg.boundingBox();
    assert(box && box.width > 400 && box.height > 250, c.id + " figure rendered " + Math.round(box.width) + "x" + Math.round(box.height));
    await page.locator("#" + c.id + " .chain-next").click();
    assert((await page.locator("#" + c.id + " .chain-step.is-lit").count()) === 1, c.id + " chain lights up");
  }

  // probes: one per lesson
  const PROBE_IDS = ["l0-map", "l1-thrift", "l2-runway", "l3-bubble", "l4-bankrun", "l5-repay", "l6-credit", "l7-observe", "l8-wait", "l9-land", "l10-flow", "l11-stress", "l12-dashboard"];
  for (const id of PROBE_IDS) {
    await page.waitForSelector('.probe[data-probe="' + id + '"]');
  }
  assert((await page.locator(".probe").count()) === PROBE_IDS.length, PROBE_IDS.length + " probes injected (one per lesson)");
  await page.locator('.probe[data-probe="l2-runway"] .probe-reveal').click();
  assert(await page.locator('.probe[data-probe="l2-runway"] .probe-answer').isVisible(), "probe reference answer toggles");

  // screenshots: figures + full deep-dive blocks (element screenshots, may be tall)
  for (const c of CASES) {
    await page.locator("#" + c.id + " .dd-figure").scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await page.locator("#" + c.id + " .dd-figure").screenshot({ path: "shot-" + c.id + "-figure.png" });
    await page.locator("#" + c.id + " .deep-dive").screenshot({ path: "shot-" + c.id + "-deepdive.png" });
  }
  console.log("PASS: desktop screenshots saved");
  passed++;

  // mobile: 375px viewport must have zero horizontal overflow + shots of the new lessons
  const m = await browser.newPage({ viewport: { width: 375, height: 800 } });
  await m.goto(URL, { waitUntil: "load" });
  const overflow = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(overflow === 0, "375px viewport: horizontal overflow is 0 (got " + overflow + "px)");
  await m.locator("#lesson-0 .deep-dive").screenshot({ path: "shot-mobile-lesson-0.png" });
  await m.locator("#lesson-2 .deep-dive").screenshot({ path: "shot-mobile-lesson-2.png" });
  console.log("PASS: mobile screenshots saved");
  passed++;

  await browser.close();
  console.log("ALL PASS (" + passed + " checks)");
})().catch((e) => {
  console.error(String(e));
  process.exit(1);
});

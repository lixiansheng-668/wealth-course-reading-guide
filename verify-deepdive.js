const { chromium } = require("C:/Users/Administrator/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright");

// 每铺开一课，在 CASES 里加一行即可
const CASES = [
  { id: "lesson-0", steps: 6, texts: ["咖啡师工资", "小区水表"] },
  { id: "lesson-1", steps: 6, texts: ["500 亿", "封闭小镇"] },
  { id: "lesson-2", steps: 5, texts: ["跑道", "冻肉"] },
  { id: "lesson-3", steps: 9, texts: ["击鼓传花", "+67%"] },
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

  // probes still injected
  await page.waitForSelector('.probe[data-probe="l0-map"]');
  await page.waitForSelector('.probe[data-probe="l1-thrift"]');
  await page.waitForSelector('.probe[data-probe="l3-bubble"]');
  console.log("PASS: probes injected (l0-map, l1-thrift, l3-bubble)");
  passed++;

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

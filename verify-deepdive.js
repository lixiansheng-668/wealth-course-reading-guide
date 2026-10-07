const { chromium } = require("C:/Users/Administrator/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright");

function assert(cond, msg) {
  if (!cond) throw new Error("FAIL: " + msg);
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

  await page.goto("http://127.0.0.1:8931/index.html", { waitUntil: "load" });
  await page.waitForSelector("#progress-bar", { timeout: 5000 });
  assert(errors.length === 0, "no page errors (got: " + errors.join(" | ") + ")");

  assert((await page.locator(".deep-dive").count()) === 2, "2 deep-dive sections");
  assert((await page.locator("#lesson-1 .why-steps > li").count()) === 6, "lesson-1: 6 why-steps");
  assert((await page.locator("#lesson-3 .why-steps > li").count()) === 9, "lesson-3: 9 why-steps");

  const l1 = page.locator("#lesson-1 .deep-dive");
  const l3 = page.locator("#lesson-3 .deep-dive");
  assert((await l1.locator(".dd-box.example").count()) === 1, "L1 example box");
  assert((await l1.locator(".dd-box.analogy").count()) === 1, "L1 analogy box");
  assert((await l1.locator(".dd-box.misread").count()) === 1, "L1 misread box");
  assert((await l3.locator(".dd-box.example").count()) === 1, "L3 example box");
  assert((await l3.locator(".dd-box.analogy").count()) === 1, "L3 analogy box");
  assert((await l3.locator(".dd-box.misread").count()) === 1, "L3 misread box");

  const l1text = await l1.innerText();
  assert(l1text.includes("500 亿") && l1text.includes("封闭小镇"), "L1 example+analogy content");
  const l3text = await l3.innerText();
  assert(l3text.includes("击鼓传花") && l3text.includes("+67%"), "L3 analogy+numbers content");

  // figures visible with real size
  for (const sel of ["#lesson-1 .dd-figure svg", "#lesson-3 .dd-figure svg"]) {
    const svg = page.locator(sel);
    const box = await svg.boundingBox();
    assert(box && box.width > 400 && box.height > 250, sel + " rendered " + Math.round(box.width) + "x" + Math.round(box.height));
  }

  // probes + chain still work
  await page.waitForSelector('.probe[data-probe="l1-thrift"]');
  await page.waitForSelector('.probe[data-probe="l3-bubble"]');
  await page.locator("#lesson-1 .chain-next").click();
  assert((await page.locator("#lesson-1 .chain-step.is-lit").count()) === 1, "chain lights up");
  console.log("PASS: probes and chain controls intact");

  // screenshots: figures first (the unverified pieces)
  await page.locator("#lesson-1 .dd-figure").scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await page.locator("#lesson-1 .dd-figure").screenshot({ path: "shot-l1-figure.png" });
  await page.locator("#lesson-3 .dd-figure").scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await page.locator("#lesson-3 .dd-figure").screenshot({ path: "shot-l3-figure.png" });
  // full deep-dive blocks (element screenshots, may be tall)
  await l1.screenshot({ path: "shot-l1-deepdive.png" });
  await l3.screenshot({ path: "shot-l3-deepdive.png" });
  console.log("PASS: screenshots saved");

  await browser.close();
  console.log("ALL PASS");
})().catch((e) => {
  console.error(String(e));
  process.exit(1);
});

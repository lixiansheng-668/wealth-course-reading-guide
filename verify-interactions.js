/* verify interaction-pass main paths */
const { chromium } = require("playwright-core");
const path = require("path");
const { pathToFileURL } = require("url");

const root = path.resolve(__dirname);
const url = pathToFileURL(path.join(root, "index.html")).href;

function assert(cond, msg) {
  if (!cond) throw new Error("FAIL: " + msg);
  console.log("PASS:", msg);
}

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  page.on("pageerror", (e) => {
    throw new Error("pageerror: " + e.message);
  });

  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#progress-bar", { timeout: 5000 });
  assert(await page.locator("#progress-bar").count() === 1, "progress bar injected");
  assert(await page.locator(".lesson-done-input").count() === 13, "13 lesson checkboxes");

  // T1 progress
  await page.locator('.lesson-done-input[data-lesson="0"]').check();
  const doneText = await page.locator("#progress-done").innerText();
  assert(doneText.trim() === "1", "progress count becomes 1");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector('.lesson-done-input[data-lesson="0"]');
  assert(
    await page.locator('.lesson-done-input[data-lesson="0"]').isChecked(),
    "progress persists after reload"
  );

  // T2 probe
  await page.waitForSelector('.probe[data-probe="l1-thrift"]');
  const reveal = page.locator('.probe[data-probe="l1-thrift"] .probe-reveal');
  await reveal.click();
  assert(
    await page.locator('.probe[data-probe="l1-thrift"] .probe-answer').isVisible(),
    "probe answer reveals"
  );
  await page
    .locator('.probe[data-probe="l1-thrift"] .probe-input')
    .fill("个体理性加总可能放大衰退");
  await page.waitForTimeout(500);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector('.probe[data-probe="l1-thrift"] .probe-reveal');
  assert(
    await page.locator('.probe[data-probe="l1-thrift"] .probe-answer').isVisible(),
    "probe reveal persists"
  );
  assert(
    (await page.locator('.probe[data-probe="l1-thrift"] .probe-input').inputValue()).includes(
      "个体理性"
    ),
    "probe note persists"
  );

  // T3 runway
  await page.waitForSelector("#rw-cash");
  await page.fill("#rw-cash", "30000");
  await page.fill("#rw-expense", "8000");
  await page.fill("#rw-income", "10000");
  await page.fill("#rw-drop", "30");
  await page.dispatchEvent("#rw-drop", "input");
  const months = await page.locator("#rw-months").innerText();
  // newIncome=7000, surplus=-1000, months=30
  assert(months.includes("30"), "runway months ≈ 30 (got " + months + ")");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector("#rw-cash");
  assert(
    (await page.inputValue("#rw-cash")) === "30000",
    "runway cash persists"
  );

  // T4 chain
  await page.waitForSelector("#lesson-1 .chain-next");
  const chainBtn = page.locator("#lesson-1 .chain-next");
  const steps = page.locator("#lesson-1 .logic-chain .chain-step");
  const n = await steps.count();
  assert(n >= 5, "lesson-1 chain has steps");
  await chainBtn.click();
  assert(
    (await page.locator("#lesson-1 .logic-chain .chain-step.is-lit").count()) === 1,
    "first chain step lights"
  );
  for (let i = 1; i < n; i++) await page.locator("#lesson-1 .chain-next").click();
  assert(
    (await page.locator("#lesson-1 .logic-chain .chain-step.is-lit").count()) === n,
    "all chain steps lit"
  );
  await page.locator("#lesson-1 .chain-reset").click();
  assert(
    (await page.locator("#lesson-1 .logic-chain .chain-step.is-lit").count()) === 0,
    "chain reset clears"
  );

  // T5 dashboard
  await page.waitForSelector("#dash-month");
  await page.fill("#dash-month", "2026-09");
  await page.fill('[data-dash-row="hire"] .dash-call', "收缩");
  await page.fill('[data-dash-row="hire"] .dash-note', "HC freeze");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector("#dash-month");
  assert((await page.inputValue("#dash-month")) === "2026-09", "dashboard month persists");
  assert(
    (await page.inputValue('[data-dash-row="hire"] .dash-call')) === "收缩",
    "dashboard call persists"
  );
  assert(
    (await page.inputValue('[data-dash-row="hire"] .dash-note')) === "HC freeze",
    "dashboard note persists"
  );

  // l7 checks
  await page.locator('.probe[data-probe="l7-observe"] input[type="checkbox"]').first().check();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector('.probe[data-probe="l7-observe"] input[type="checkbox"]');
  assert(
    await page.locator('.probe[data-probe="l7-observe"] input[type="checkbox"]').first().isChecked(),
    "l7 observe check persists"
  );

  await browser.close();
  console.log("ALL PASS");
  process.exit(0);
})().catch(async (e) => {
  console.error(e);
  process.exit(1);
});

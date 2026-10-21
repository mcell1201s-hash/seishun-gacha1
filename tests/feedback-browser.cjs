const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 700 },
    reducedMotion: "reduce",
  });
  await context.addInitScript(() => {
    Math.random = () => 0.4;
  });
  const page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.install();
  await page.goto("http://localhost:8000");
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  const tap = (selector) => page.locator(selector).dispatchEvent("click");
  const turn = () => page.locator(".turn-number").innerText();
  await tap('[data-action="enroll"]');
  await tap('[data-action="begin"]');
  const initial = await page.locator(".technique strong").innerText();
  await tap('[data-key="basic"]');
  assert.equal(await turn(), "1");
  assert.equal(await page.locator(".show-action").count(), 1);
  assert.equal(
    await page
      .locator(".feedback-icon")
      .evaluate((el) => getComputedStyle(el).animationName),
    "none",
  );
  await page.clock.runFor(549);
  assert.equal(await page.locator(".show-action").count(), 1);
  await page.clock.runFor(1);
  assert.equal(await page.locator(".show-result").count(), 1);
  assert.match(await page.locator(".result-deltas").innerText(), /技術/);
  assert.match(await page.locator(".delta.cost").innerText(), /疲労/);
  await page.screenshot({
    path: "/tmp/seishun-action-result.png",
    fullPage: true,
  });
  await page.clock.runFor(1049);
  assert.equal(await page.locator(".turn-feedback").count(), 1);
  await page.clock.runFor(1);
  assert.equal(await page.locator(".turn-feedback").count(), 0);
  assert.equal(await turn(), "2");
  assert.notEqual(await page.locator(".technique strong").innerText(), initial);
  await page.clock.runFor(300);
  // Repeated action dispatches cannot evaluate again; skipping never leaves an active old timer.
  await page.evaluate(() => {
    const b = document.querySelector('[data-key="basic"]');
    for (let i = 0; i < 30; i++) b.click();
  });
  await tap(".feedback-next");
  await tap(".feedback-next");
  await tap('[data-key="basic"]');
  assert.equal(await turn(), "3");
  await page.clock.runFor(5000);
  assert.equal(await turn(), "3");
  assert.equal(await page.locator(".turn-feedback").count(), 0);
  // Encounter is important: no automatic dismissal, even after a long time.
  await tap('[data-key="social"]');
  await page.clock.runFor(10000);
  assert.equal(await page.locator(".important-event").count(), 1);
  assert.match(await page.locator(".important-event").innerText(), /出会い/);
  assert.equal(await turn(), "3");
  await tap(".feedback-next");
  assert.equal(await turn(), "4");
  await page.clock.runFor(300);
  // The action result leads to the existing tournament screen, which also waits for input.
  await tap('[data-key="date"]');
  await page.clock.runFor(1600);
  assert.equal(await page.locator('[data-action="tournament"]').count(), 1);
  await page.clock.runFor(5000);
  assert.equal(await page.locator('[data-action="tournament"]').count(), 1);
  await page.clock.runFor(300);
  await tap('[data-action="tournament"]');
  assert.equal(await turn(), "5");
  await tap('[data-key="date"]');
  await page.clock.runFor(10000);
  assert.match(await page.locator(".important-event").innerText(), /交際/);
  await tap(".feedback-next");
  await page.clock.runFor(300);
  assert.match(await page.locator(".relationship-stage").innerText(), /交際中/);
  // Notebook is reachable and closes without taking an action.
  await tap('[data-action="info"]');
  assert.equal(await page.locator("dialog[open]").count(), 1);
  await tap('[data-action="close-info"]');
  assert.equal(await turn(), "6");
  // A reload during the action resets cleanly to title, without a partial graduation record.
  await tap('[data-key="basic"]');
  assert.equal(await page.locator(".show-action").count(), 1);
  await page.reload();
  assert.equal(await page.locator('[data-action="enroll"]').count(), 1);
  assert.equal(await page.locator(".turn-feedback").count(), 0);
  assert.equal(await page.locator(".memory").count(), 0);
  await page.clock.runFor(5000);
  assert.equal(await page.locator('[data-action="enroll"]').count(), 1);
  // Also exercise native browser timers; fake clocks can hide host-binding mistakes.
  const nativePage = await browser.newPage({
    viewport: { width: 390, height: 700 },
    reducedMotion: "reduce",
  });
  await nativePage.addInitScript(() => {
    Math.random = () => 0.4;
  });
  nativePage.on("pageerror", (e) => errors.push(e.message));
  await nativePage.goto("http://localhost:8000");
  await nativePage.locator('[data-action="enroll"]').click();
  await nativePage.locator('[data-action="begin"]').click();
  await nativePage.locator('[data-key="basic"]').click();
  await nativePage.waitForFunction(
    () => document.querySelector(".turn-number")?.textContent === "2",
    null,
    { timeout: 5000 },
  );
  assert.equal(await nativePage.locator(".turn-feedback").count(), 0);
  await nativePage.close();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: 1.6s auto progression, important-event holds, tournament manual advance, real deltas, rapid taps, skip cooldown, stale timers, notebook, reduced motion and mid-animation reload",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

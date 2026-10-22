// Optional: install Playwright outside this checkout and set NODE_PATH accordingly.
// Start the repository with python3 -m http.server 8000 before running.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  // Deterministic browser RNG to exercise encounter, confession and the diligent portrait.
  await context.addInitScript(() => {
    Math.random = () => 0.4;
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const broken = [];
  page.on("response", (r) => {
    if (r.status() >= 400) broken.push(r.url());
  });
  async function settle() {
    while (await page.locator(".turn-feedback").count())
      await page.locator(".feedback-next").click();
    await page.waitForTimeout(300);
  }
  await page.goto("http://localhost:8000");
  const oldRecord = {
    id: "legacy-browser",
    version: 2,
    school: "以前の高校",
    club: "美術部",
    player: { technique: 77, stamina: 42, spirit: 50, fatigue: 0 },
    teamwork: 30,
    trophies: ["旧記録のトロフィー"],
    results: [],
  };
  await page.evaluate(
    (record) =>
      localStorage.setItem(
        "seishun-gacha.history.v1",
        JSON.stringify([record]),
      ),
    oldRecord,
  );
  await page.reload();
  await page.locator('[data-action="enroll"]').click();
  await page.locator('[data-action="begin"]').click();
  await page.locator('[data-key="social"]').click();
  await settle();
  assert.ok(await page.getByText("日向 ひまり", { exact: true }).count());
  await page.locator('[data-key="date"]').click();
  await settle();
  await page.locator('[data-key="date"]').click();
  await settle();
  assert.match(await page.locator(".romance h3").innerText(), /交際中/);
  await page.locator(".partner img").waitFor();
  assert.ok(
    await page
      .locator(".partner img")
      .evaluate((i) => i.complete && i.naturalWidth > 0),
  );
  await page.screenshot({ path: "/tmp/seishun-romance.png", fullPage: true });
  let contests = 0;
  for (let i = 4; i <= 23; i++) {
    await page.locator('[data-key="basic"]').click();
    await settle();
    if (await page.locator('[data-action="tournament"]').count()) {
      contests++;
      assert.equal(await page.locator("blockquote").count(), 1);
      assert.ok(await page.locator(".performance").innerText());
      if (contests === 1)
        await page.screenshot({
          path: "/tmp/seishun-contest.png",
          fullPage: true,
        });
      await page.locator('[data-action="tournament"]').click();
      await settle();
    }
  }
  assert.equal(contests, 6);
  await page.getByRole("heading", { name: "卒業おめでとう。" }).waitFor();
  assert.ok((await page.locator(".trophy").count()) >= 2);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.locator('[data-action="home"]').click();
  await page.reload();
  await page.locator(".memory summary").first().click();
  assert.equal(await page.locator(".album-contest").count(), 6);
  assert.match(
    await page.locator(".memory").first().innerText(),
    /ふたりの放課後/,
  );
  assert.equal(await page.locator(".memory").count(), 2);
  assert.deepEqual(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("seishun-gacha.history.v1")).find(
        (record) => record.id === "legacy-browser",
      ),
    ),
    oldRecord,
  );
  await page.locator(".memory summary").nth(1).click();
  assert.match(
    await page.locator(".memory").nth(1).innerText(),
    /旧24ターン版/,
  );
  await page.screenshot({ path: "/tmp/seishun-album.png", fullPage: true });
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(broken, []);
  console.log(
    "PASS: 23-action romance-to-graduation UI, six contest results, portrait, persistent expandable album, 320/390/1280px, no errors or broken assets",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

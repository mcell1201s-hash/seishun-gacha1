const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 360, height: 640 },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:8000");
  let checks = 0;
  for (const [width, height] of [
    [360, 640],
    [390, 700],
    [412, 800],
    [360, 580],
  ]) {
    await page.setViewportSize({ width, height });
    for (const club of [0, 1, 2])
      for (const partner of [null, "support", "diligent", "free"]) {
        await page.evaluate(
          async ({ club, partner }) => {
            const { enroll, begin } = await import("./js/game.js");
            const { createRandom } = await import("./js/random.js");
            const { CONFIG } = await import("./js/config.js");
            const { render } = await import("./js/view.js");
            const s = begin(
              enroll(
                createRandom(() => 0.4),
                "compact",
              ),
            );
            s.school.club = CONFIG.clubs[club];
            s.turn = 19;
            s.player.fatigue = 90;
            s.player.technique = 200;
            s.teamwork = 100;
            s.affection = 100;
            if (partner) {
              s.met = true;
              s.romance.type = partner;
              s.romance.heartbroken = true;
            }
            document.body.dataset.screen = "training";
            document.querySelector("#app").innerHTML = render(s, []);
            window.scrollTo(0, 0);
          },
          { club, partner },
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        assert.ok(
          await page.locator(".action").evaluateAll((buttons) =>
            buttons.every((button) => {
              const r = button.getBoundingClientRect();
              return (
                r.top >= 0 &&
                r.bottom <= innerHeight &&
                r.width >= 44 &&
                r.height >= 44 &&
                button.scrollWidth <= button.clientWidth
              );
            }),
          ),
          `${width}x${height} club${club} partner${partner}`,
        );
        assert.equal(await page.locator(".turn-number").innerText(), "19");
        assert.match(
          await page.locator(".technique strong").innerText(),
          /200/,
        );
        const gap = await page.evaluate(
          () =>
            document.querySelector(".command-panel").getBoundingClientRect()
              .top -
            document.querySelector(".status-card").getBoundingClientRect()
              .bottom,
        );
        assert.ok(gap >= 8 && gap <= 16, `status-command gap: ${gap}`);
        assert.match(await page.locator(".club-power").innerText(), /総合力/);
        assert.match(
          await page.locator(".training-goal").innerText(),
          /見込み/,
        );
        checks++;
      }
    await page.screenshot({
      path: `/tmp/seishun-training-${width}x${height}.png`,
      fullPage: true,
    });
  }
  // Safe-area budget and short webview fallback.
  await page.setViewportSize({ width: 360, height: 640 });
  await page.addStyleTag({
    content:
      'body[data-screen="training"] .page {padding-top:20px;padding-bottom:20px}.training-shell{height:calc(100dvh - 72px)}',
  });
  assert.ok(
    await page
      .locator(".action")
      .evaluateAll((bs) =>
        bs.every((b) => b.getBoundingClientRect().bottom <= innerHeight),
      ),
  );
  await page.setViewportSize({ width: 360, height: 460 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollHeight > innerHeight,
    ),
  );
  await page.locator(".action-date").scrollIntoViewIfNeeded();
  assert.ok(
    await page
      .locator(".action-date")
      .evaluate((b) => b.getBoundingClientRect().bottom <= innerHeight),
  );
  assert.deepEqual(errors, []);
  console.log(
    `PASS: ${checks} viewport/club/romance/high-fatigue cases, all six commands initially visible; safe-area budget and tiny viewport scroll fallback`,
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

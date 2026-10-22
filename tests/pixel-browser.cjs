// Optional UI validation: same Playwright setup as tests/browser.cjs.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const errors = [],
    badResponses = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) badResponses.push(response.url());
  });
  await page.goto("http://localhost:8000");
  async function paint(options) {
    await page.evaluate(async (options) => {
      const { enroll, begin } = await import("./js/game.js");
      const { CONFIG } = await import("./js/config.js");
      const { createRandom } = await import("./js/random.js");
      const { judgeContest } = await import("./js/contest.js");
      const { render } = await import("./js/view.js");
      const s = begin(
        enroll(
          createRandom(() => 0.4),
          "visual-check",
        ),
      );
      s.school.club = CONFIG.clubs[options.club || 0];
      s.turn = options.turn || 1;
      s.screen = options.screen || "training";
      s.player.technique = 123;
      s.player.fatigue = 85;
      if (options.partner) {
        s.met = true;
        s.romance.type = options.partner;
        s.romance.dating = true;
        s.affection = 80;
      }
      if (s.screen === "tournament")
        s.pendingTournament = judgeContest(
          s,
          createRandom(() => 0.4),
        );
      document.querySelector("#app").innerHTML = render(s, []);
    }, options);
    await page
      .locator("img")
      .evaluateAll((images) =>
        Promise.all(images.map((image) => image.decode())),
      );
  }
  const seasons = {
    1: "spring",
    3: "summer",
    5: "summer",
    6: "autumn",
    8: "winter",
    10: "spring",
    14: "summer",
    17: "winter",
    20: "spring",
    23: "summer",
  };
  let checks = 0;
  for (const width of [320, 390, 540, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    for (const club of [0, 1, 2]) {
      for (const [turn, season] of Object.entries(seasons)) {
        await paint({ club, turn: Number(turn) });
        assert.match(
          await page.locator(".season-bg").getAttribute("src"),
          new RegExp(`school-${season}`),
        );
        assert.equal(await page.locator(".turn-number").innerText(), turn);
        assert.equal(
          await page.locator("progress").getAttribute("value"),
          turn,
        );
        assert.equal(await page.locator(".actions button").count(), 6);
        assert.equal(
          await page
            .locator(".actions")
            .evaluate(
              (el) =>
                getComputedStyle(el).gridTemplateColumns.split(" ").length,
            ),
          3,
        );
        assert.equal(await page.locator(".romance").count(), 0);
        assert.equal(
          await page.locator('[data-key="date"]').isDisabled(),
          true,
        );
        assert.match(
          await page.locator(".technique strong").innerText(),
          /123/,
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
              const rect = button.getBoundingClientRect();
              return (
                rect.width >= 44 &&
                rect.height >= 44 &&
                button.scrollWidth <= button.clientWidth
              );
            }),
          ),
        );
        assert.ok(
          await page.locator(".runner").evaluate((el) => {
            const r = el.getBoundingClientRect(),
              p = el.closest(".turn-panel").getBoundingClientRect();
            return r.left >= p.left - 1 && r.right <= p.right + 1;
          }),
        );
        checks++;
      }
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const partner of ["support", "diligent", "free"]) {
    await paint({ partner });
    assert.match(
      await page.locator(".partner img").getAttribute("src"),
      new RegExp("face-" + partner),
    );
    assert.match(
      await page.locator('[data-key="date"] img').getAttribute("src"),
      new RegExp("face-" + partner),
    );
    assert.equal(await page.locator('[data-key="date"]').isDisabled(), false);
  }
  await page.screenshot({
    path: "/tmp/seishun-pixel-training.png",
    fullPage: true,
  });
  let previous = -Infinity;
  for (const turn of [1, 10, 19, 23]) {
    await paint({ turn });
    const x = await page
      .locator(".runner")
      .evaluate((el) => el.getBoundingClientRect().x);
    assert.ok(x > previous);
    previous = x;
  }
  for (const club of [0, 1, 2]) {
    await paint({ club, turn: 5, screen: "tournament" });
    assert.equal(await page.locator(".coach-face").count(), 1);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.screenshot({
      path: `/tmp/seishun-pixel-contest-${club}.png`,
      fullPage: true,
    });
  }
  await paint({ screen: "admission" });
  assert.equal(
    await page
      .locator(".admission-card")
      .evaluate((el) => getComputedStyle(el).animationName),
    "none",
  );
  // Simulate the Pages repository subpath while serving the same checked-out files.
  await page.route("**/seishun-gacha1/**", async (route) => {
    const url = new URL(route.request().url());
    url.pathname = url.pathname.replace("/seishun-gacha1/", "/");
    const response = await route.fetch({ url: url.toString() });
    await route.fulfill({ response });
  });
  await page.goto("http://localhost:8000/seishun-gacha1/");
  await page.locator('[data-action="enroll"]').click();
  await page.locator('[data-action="begin"]').click();
  await page.locator(".school-scene").waitFor();
  await page
    .locator("img")
    .evaluateAll((images) =>
      Promise.all(images.map((image) => image.decode())),
    );
  assert.deepEqual(errors, []);
  assert.deepEqual(badResponses, []);
  console.log(
    `PASS: ${checks} club/season/width views, faces, runner positions, touch targets, reduced motion, Pages subpath and all SVG assets`,
  );
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

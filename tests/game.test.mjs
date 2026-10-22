import test from "node:test";
import assert from "node:assert/strict";
import { enroll, begin, act, finishTournament } from "../js/game.js";
import { createRandom } from "../js/random.js";
import { CONFIG } from "../js/config.js";
import { saveResult, loadHistory } from "../js/state.js";
import { render } from "../js/view.js";
const rng = createRandom(() => 0.5);
test("23 actions lead to six tournaments, two promotions and immediate graduation", () => {
  let s = begin(enroll(rng, "run"));
  const tournaments = [];
  const promotions = [];
  for (let turn = 1; turn <= 23; turn++) {
    assert.equal(s.turn, turn);
    assert.equal(s.screen, "training");
    s = act(s, "basic", rng);
    if (s.screen === "tournament") {
      tournaments.push(s.turn);
      assert.equal(s.turn, turn);
      const fatigue = s.player.fatigue;
      s = finishTournament(s);
      if (turn === 23) assert.equal(s.player.fatigue, fatigue);
      else assert.ok(s.player.fatigue <= Math.max(0, fatigue - 15));
    }
    if ([10, 19].includes(s.turn)) promotions.push(s.turn);
    assert.ok(render(s, []).length > 100);
  }
  assert.deepEqual(tournaments, [5, 9, 14, 18, 20, 23]);
  assert.deepEqual(promotions, [10, 19]);
  assert.equal(s.screen, "graduation");
  assert.equal(s.turn, 23);
  assert.equal(act(s, "basic", rng), s);
  assert.equal(finishTournament(s), s);
  assert.equal(s.summary.version, 3);
  assert.equal(s.summary.tournaments, 6);
  assert.ok(s.summary.trophies.includes("青春の卒業証書"));
  assert.equal(s.summary.results.length, 6);
});
test("fatigue penalties apply before action; rest and disabled dates behave correctly", () => {
  const base = begin(enroll(rng, "fatigue"));
  base.school.environment = 50;
  base.aptitude.stat = "spirit";
  for (const [fatigue, gain] of [
    [0, 5],
    [60, 4],
    [80, 3],
  ]) {
    const s = structuredClone(base);
    s.player.fatigue = fatigue;
    const next = act(s, "basic", rng);
    assert.equal(next.player.technique - s.player.technique, gain);
    assert.equal(s.player.fatigue, fatigue);
  }
  assert.equal(act(base, "date", rng), base);
  base.player.fatigue = 80;
  assert.equal(act(base, "rest", rng).player.fatigue, 50);
});
test("encounter unlocks dates; growth has no ability diminishing returns", () => {
  const s = begin(enroll(rng, "love"));
  s.school.environment = 50;
  s.aptitude.stat = "spirit";
  const met = act(
    s,
    "social",
    createRandom(() => 0),
  );
  assert.equal(met.met, true);
  assert.equal(act(met, "date", rng).affection, 40);
  s.player.technique = 150;
  assert.equal(act(s, "basic", rng).player.technique, 155);
});
test("storage persists trophies once, tolerates malformed and unavailable storage", () => {
  let value = null;
  const storage = {
    getItem: () => value,
    setItem: (k, v) => {
      value = v;
    },
  };
  const result = {
    id: "one",
    school: "学校",
    club: "美術部",
    trophies: ["青春の卒業証書"],
  };
  assert.equal(saveResult(result, storage), true);
  saveResult(result, storage);
  assert.equal(loadHistory(storage).length, 1);
  value = "{";
  assert.deepEqual(loadHistory(storage), []);
  assert.equal(
    saveResult(result, {
      getItem() {
        throw Error();
      },
      setItem() {
        throw Error();
      },
    }),
    false,
  );
});
test("gacha is bounded and events do not depend on teamwork", () => {
  for (const value of [0, 0.1, 0.5, 0.9, 0.999999]) {
    const s = enroll(
      createRandom(() => value),
      "bounds",
    );
    assert.ok(s.school.base >= 0 && s.school.base <= 200);
    assert.ok(s.school.environment >= 0 && s.school.environment <= 100);
    assert.ok(s.school.competition >= 0 && s.school.competition <= 200);
  }
  const low = begin(enroll(rng, "low"));
  const high = structuredClone(low);
  low.teamwork = 20;
  high.teamwork = 80;
  assert.equal(
    act(
      low,
      "basic",
      createRandom(() => 0.1),
    ).teamwork - 20,
    act(
      high,
      "basic",
      createRandom(() => 0.1),
    ).teamwork - 80,
  );
});

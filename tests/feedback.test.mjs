import test from "node:test";
import assert from "node:assert/strict";
import { createTurnFlow } from "../js/turn-flow.js";
import {
  actionFeedback,
  promotionFeedback,
  describeAction,
  DESCRIPTIONS,
  renderFeedback,
  TIMING,
} from "../js/turn-feedback.js";
import { begin, enroll, act, finishTournament } from "../js/game.js";
import { createRandom } from "../js/random.js";
import { CONFIG } from "../js/config.js";
const neutral = createRandom(() => 0.4);
const fresh = () => begin(enroll(neutral, "feedback-test"));
function fakeClock() {
  let time = 0,
    serial = 0;
  const timers = new Map();
  return {
    now: () => time,
    setTimeout(fn, delay) {
      const id = ++serial;
      timers.set(id, { at: time + delay, fn });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    advance(ms) {
      const end = time + ms;
      while (true) {
        const next = [...timers.entries()].sort((a, b) => a[1].at - b[1].at)[0];
        if (!next || next[1].at > end) break;
        time = next[1].at;
        timers.delete(next[0]);
        next[1].fn();
      }
      time = end;
    },
    get pending() {
      return timers.size;
    },
  };
}
test("normal action shows 300ms action + 1500ms result then advances exactly once", () => {
  const frames = [],
    clock = fakeClock(),
    flow = createTurnFlow((s, f) => frames.push([s, f]), clock);
  const before = fresh(),
    after = act(before, "basic", neutral);
  assert.equal(
    flow.start(before, after, actionFeedback(before, after, "basic")),
    true,
  );
  assert.equal(flow.start(before, after, {}), false);
  clock.advance(TIMING.action - 1);
  assert.equal(frames.at(-1)[1].phase, "action");
  clock.advance(1);
  assert.equal(frames.at(-1)[1].phase, "result");
  clock.advance(TIMING.result);
  assert.equal(frames.at(-1)[0].turn, 2);
  assert.equal(frames.at(-1)[1], null);
  assert.equal(flow.busy, false);
  assert.equal(clock.pending, 0);
});
test("skip clears stale timers and cooldown prevents replay immediately after rapid taps", () => {
  const clock = fakeClock(),
    frames = [],
    flow = createTurnFlow((s, f) => frames.push([s, f]), clock);
  const s = fresh(),
    next = act(s, "basic", neutral);
  flow.start(s, next, actionFeedback(s, next, "basic"));
  flow.tap();
  flow.tap();
  for (let i = 0; i < 20; i++) flow.tap();
  assert.equal(flow.locked, true);
  assert.equal(flow.start(next, {}, {}), false);
  clock.advance(3000);
  assert.equal(frames.length, 3);
  assert.equal(flow.locked, false);
  assert.equal(clock.pending, 0);
});
test("important results never auto-dismiss, including promotion-only results", () => {
  const clock = fakeClock(),
    frames = [],
    flow = createTurnFlow((s, f) => frames.push([s, f]), clock);
  const s = fresh();
  const next = act(s, "social", neutral);
  assert.equal(next.met, true);
  flow.start(s, next, actionFeedback(s, next, "social"));
  clock.advance(10000);
  assert.equal(flow.busy, true);
  assert.equal(frames.at(-1)[1].phase, "result");
  flow.tap();
  clock.advance(300);
  const before = fresh();
  before.turn = 9;
  before.screen = "tournament";
  before.pendingTournament = { turn: 8, result: "入賞", personalLabel: "活躍" };
  const after = finishTournament(before);
  const details = promotionFeedback(before, after);
  assert.equal(details.important, true);
  assert.match(details.events[0].title, /2年生/);
  flow.start(before, after, details, true);
  clock.advance(10000);
  assert.equal(flow.busy, true);
  flow.finish();
  assert.equal(clock.pending, 0);
  assert.equal(frames.at(-1)[0].turn, 10);
});
test("critical event classifier covers skills, injury, encounter, confession, rejection and both awakenings", () => {
  const before = fresh(),
    after = act(before, "basic", neutral);
  const cases = [
    (s) => s.skills.push("effort"),
    (s) => s.logs.unshift("軽いケガをしてしまった。疲労 +8 / 精神 −3"),
    (s) => {
      s.met = true;
      s.romance.type = "diligent";
    },
    (s) => {
      s.romance.confessionTried = true;
      s.romance.dating = true;
    },
    (s) => {
      s.romance.confessionTried = true;
      s.romance.heartbroken = true;
    },
    (s) => (s.romance.awakened = true),
    (s) => (s.romance.freeAwakened = true),
  ];
  for (const change of cases) {
    const s = structuredClone(after);
    change(s);
    const feedback = actionFeedback(before, s, "basic");
    assert.equal(feedback.important, true);
    assert.ok(feedback.events.length);
  }
});
test("displayed changes use real clamped values, including bonuses, fatigue and teamwork", () => {
  const before = fresh();
  before.player.technique = 199;
  before.teamwork = 99;
  const after = structuredClone(before);
  after.player.technique = 200;
  after.player.fatigue = 20;
  after.teamwork = 100;
  after.affection = 20;
  const feedback = actionFeedback(before, after, "intensive");
  assert.equal(feedback.delta.find((d) => d.stat === "technique").value, 1);
  assert.equal(feedback.delta.find((d) => d.stat === "teamwork").value, 1);
  const html = renderFeedback({ ...feedback, phase: "result" });
  assert.match(html, /疲れが増えた/);
  assert.match(html, /delta cost/);
  assert.match(html, /連携/);
});
test("club-specific multiple descriptions do not mutate state or consume game random numbers", () => {
  for (const club of CONFIG.clubs) {
    const s = fresh();
    s.school.club = club;
    const copy = structuredClone(s);
    for (const key of ["basic", "intensive", "team", "rest", "social"])
      assert.ok(new Set(DESCRIPTIONS[club.name][key]).size >= 2);
    assert.ok(describeAction(s, "intensive"));
    assert.deepEqual(s, copy);
  }
  assert.equal(
    new Set(
      CONFIG.clubs.map((club) => {
        const s = fresh();
        s.school.club = club;
        return describeAction(s, "intensive");
      }),
    ).size,
    3,
  );
});

test("page suspension cancels timers; restoration resumes normal results but never auto-dismisses important ones", () => {
  const clock = fakeClock(),
    frames = [],
    flow = createTurnFlow((s, f) => frames.push([s, f]), clock),
    before = fresh();
  const after = act(before, "basic", neutral);
  flow.start(before, after, actionFeedback(before, after, "basic"));
  flow.suspend();
  clock.advance(10000);
  assert.equal(frames.at(-1)[1].phase, "action");
  flow.resume();
  clock.advance(TIMING.action + TIMING.result);
  assert.equal(frames.at(-1)[0].turn, 2);
  clock.advance(300);
  const encounter = act(before, "social", neutral);
  flow.start(before, encounter, actionFeedback(before, encounter, "social"));
  clock.advance(TIMING.action);
  flow.suspend();
  clock.advance(10000);
  flow.resume();
  clock.advance(10000);
  assert.equal(flow.busy, true);
  assert.equal(frames.at(-1)[1].important, true);
  flow.tap();
  assert.equal(flow.busy, false);
});

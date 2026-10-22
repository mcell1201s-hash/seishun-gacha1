import test from "node:test";
import assert from "node:assert/strict";
import { CONFIG, CONTEST, ROMANCE } from "../js/config.js";
import { begin, enroll, act, finishTournament } from "../js/game.js";
import { createRandom } from "../js/random.js";
import { calendarFor } from "../js/calendar.js";
import { clubPower, powerTier, developmentGoal } from "../js/development.js";
import { judgeContest } from "../js/contest.js";
import { loadHistory, saveResult } from "../js/state.js";
import { render } from "../js/view.js";
const rng = createRandom(() => 0.5),
  never = { chance: () => false, int: () => 0, pick: (items) => items[0] };
const fresh = () => begin(enroll(rng, "new-test"));
test("calendar has exactly one additional summer action per year and six ordered seasonal tournaments", () => {
  const seasons = [];
  for (let t = 1; t <= 23; t++) seasons.push(calendarFor(t));
  for (let year = 1; year <= 3; year++)
    assert.equal(
      seasons.filter((x) => x.year === year && x.season === "summer").length,
      3,
    );
  assert.deepEqual(CONFIG.yearStarts, [1, 10, 19]);
  assert.equal(new Set(CONFIG.tournaments).size, 6);
  for (const round of CONFIG.tournamentSchedule) {
    const c = calendarFor(round.turn);
    assert.equal(c.year, round.year);
    assert.equal(
      { spring: "春", summer: "夏", winter: "冬" }[c.season],
      round.season,
    );
  }
  assert.equal(CONFIG.tournamentSchedule.at(-1).turn, 23);
  assert.equal(CONFIG.tournamentSchedule.at(-1).final, true);
});
test("club power depends on base and teamwork only, is bounded and enters score exactly once", () => {
  const s = fresh();
  s.school.base = 120;
  s.teamwork = 40;
  assert.equal(clubPower(s), 104);
  const a = clubPower(s);
  s.player.technique = 200;
  s.player.spirit = 200;
  assert.equal(clubPower(s), a);
  s.teamwork = 42;
  assert.equal(clubPower(s), 105);
  assert.equal(s.school.base, 120);
  const result = judgeContest(s, never);
  assert.equal(result.power, 105);
  s.skills = ["mood"];
  const moodResult = judgeContest(s, never);
  assert.equal(moodResult.power, result.power);
  assert.ok(Math.abs(moodResult.score - result.score - 3.6) < 1e-9);
  s.skills = [];

  assert.equal(
    result.score,
    result.power +
      result.personalContribution +
      result.conditionBonus +
      result.noise,
  );
  for (const base of [0, 20, 100, 200])
    for (const team of [0, 30, 100]) {
      s.school.base = base;
      s.teamwork = team;
      assert.ok(clubPower(s) >= 0 && clubPower(s) <= 200);
    }
  s.school.base = 100;
  s.teamwork = 17;
  assert.equal(powerTier(s).label, "中堅");
  s.teamwork = 14;
  assert.equal(powerTier(s).label, "挑戦者");
});
test("forecast matches selection formula at zero noise, adapts to competition and shows attainable or combined targets", () => {
  const s = fresh();
  s.player = { technique: 60, stamina: 60, spirit: 60, fatigue: 0 };
  s.school.competition = 70;
  const goal = developmentGoal(s),
    r = judgeContest(s, never);
  assert.equal(goal.role, r.role);
  assert.equal(goal.target, 75);
  assert.ok(goal.detail.includes("目安"));
  assert.match(goal.note, /確約/);
  s.school.competition = 200;
  assert.notEqual(developmentGoal(s).detail, goal.detail);
  assert.match(developmentGoal(s).detail, /組み合わせ/);
  s.turn = 23;
  assert.equal(developmentGoal(s).remaining, 1);
});
test("the 23rd action changes final contest stats and fatigue before judging; no recovery or extra action is inserted", () => {
  const s = fresh();
  s.turn = 23;
  s.school.competition = 0;
  s.player = { technique: 80, stamina: 80, spirit: 80, fatigue: 55 };
  const intensive = act(s, "intensive", never),
    rest = act(s, "rest", never),
    team = act(s, "team", never);
  assert.equal(intensive.screen, "tournament");
  assert.equal(rest.screen, "tournament");
  assert.equal(intensive.player.fatigue, 75);
  assert.equal(rest.player.fatigue, 25);
  assert.ok(
    intensive.pendingTournament.snapshot.player.technique >
      rest.pendingTournament.snapshot.player.technique,
  );
  assert.ok(
    rest.pendingTournament.conditionBonus >
      intensive.pendingTournament.conditionBonus,
  );
  assert.ok(team.pendingTournament.power >= rest.pendingTournament.power);
  for (const state of [intensive, rest, team]) {
    // Real prior contests are represented here only to assert that the final acknowledgement cannot add a seventh.
    state.tournaments = Array.from({ length: 5 }, (_, i) => ({
      ...state.pendingTournament,
      turn: CONFIG.tournaments[i],
      final: false,
    }));
    const end = finishTournament(state);
    assert.equal(end.screen, "graduation");
    assert.equal(end.turn, 23);
    assert.equal(end.tournaments.length, 6);
    assert.equal(end.player.fatigue, state.player.fatigue);
    assert.equal(finishTournament(end), end);
    assert.equal(act(end, "basic", never), end);
  }
});
test("graduation memories and ability growth come from this run, with no fabricated romance or skill", () => {
  let s = fresh();
  const initial = { ...s.player };
  while (s.screen === "training") {
    s = act(s, "rest", never);
    if (s.screen === "tournament") s = finishTournament(s);
  }
  assert.deepEqual(s.summary.initialPlayer, initial);
  assert.equal(s.summary.memories.length, 0);
  assert.equal(s.summary.romanceType, null);
  assert.equal(s.summary.skills.length, 0);
  assert.ok(
    s.summary.recollections.every(
      (line) => !line.includes("交際が始まった") && !line.includes("ケガ"),
    ),
  );
  assert.equal(s.summary.finalRole, s.tournaments.at(-1).roleLabel);
  assert.equal(
    s.summary.bestResult,
    s.tournaments.reduce((a, b) => (a.rank <= b.rank ? a : b)).result,
  );
  assert.match(render(s, []), /入学から卒業/);
});
test("old 24-turn and new 23-turn albums coexist without rewriting or deleting trophies", () => {
  const old = {
    id: "old24",
    version: 2,
    school: "昔の高校",
    club: "美術部",
    trophies: ["頂点の景色"],
    results: [],
    player: { technique: 70, stamina: 60, spirit: 50 },
    teamwork: 30,
  };
  let raw = JSON.stringify([old]);
  const storage = { getItem: () => raw, setItem: (k, v) => (raw = v) };
  let s = fresh();
  while (s.screen === "training") {
    s = act(s, "rest", never);
    if (s.screen === "tournament") s = finishTournament(s);
  }
  saveResult(s.summary, storage);
  assert.equal(loadHistory(storage).length, 2);
  assert.deepEqual(loadHistory(storage)[1], old);
  saveResult(s.summary, storage);
  assert.equal(loadHistory(storage).length, 2);
  const html = render(null, loadHistory(storage));
  assert.match(html, /旧24ターン版/);
  assert.match(html, /23ターン版/);
  assert.match(html, /頂点の景色/);
});
test("coach varies matching conditions and reports actual improvement without affecting ranks", () => {
  const s = fresh();
  s.turn = 5;
  s.teamwork = 20;
  s.player = { technique: 40, stamina: 35, spirit: 30, fatigue: 0 };
  const comments = [];
  for (const turn of CONFIG.tournaments) {
    s.turn = turn;
    const r = judgeContest(s, never);
    comments.push(r.critique);
    assert.ok(
      ["teamwork", "technique", "stamina", "spirit", "reserve"].includes(
        r.critiqueReason,
      ),
    );
    s.tournaments.push(r);
  }
  assert.ok(new Set(comments).size >= 3);
  for (let i = 1; i < comments.length; i++)
    assert.notEqual(comments[i], comments[i - 1]);
  s.player.technique += 20;
  s.turn = 23;
  assert.match(judgeContest(s, never).critique, /前回から技術/);
});
test("romance requirements and bonuses remain unchanged after schedule update", () => {
  assert.equal(ROMANCE.encounter, 0.5);
  assert.equal(ROMANCE.confessionAt, 60);
  assert.equal(ROMANCE.confessionChance, 0.85);
  assert.deepEqual(CONFIG.actions.date.gains, { affection: 20, spirit: 2 });
  assert.deepEqual(ROMANCE.types.support.bonus, { spirit: 8, fatigue: -10 });
  assert.deepEqual(ROMANCE.types.diligent.bonus, { technique: 8, spirit: 3 });
  assert.deepEqual(ROMANCE.types.free.bonus, { spirit: 12 });
});

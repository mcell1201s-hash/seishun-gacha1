import assert from "node:assert/strict";
import { CONFIG } from "../js/config.js";
import { begin, enroll, act, finishTournament } from "../js/game.js";
import { judgeContest } from "../js/contest.js";
import { clubPower, powerTier } from "../js/development.js";
import { createRandom } from "../js/random.js";
function seeded(seed) {
  return createRandom(() => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  });
}
// Frozen reference to the published 760428c formula, including its three random draws.
function legacyRank(s, rng) {
  const p = { ...s.player };
  if (s.skills.includes("clutch")) p.spirit += 10;
  if (s.romance.dating && s.romance.type === "support") p.spirit += 12;
  const ability = p.technique * 0.5 + p.stamina * 0.25 + p.spirit * 0.25;
  const margin = ability + rng.int(-12, 12) - s.school.competition;
  const exposure = margin >= 5 ? 1 : margin >= -25 ? 0.6 : 0;
  const condition = Math.max(0.6, 1 - (s.player.fatigue / 100) * 0.35);
  const personal = Math.max(
    0,
    ability * condition +
      rng.int(-24, 24) +
      (s.skills.includes("focus") ? 8 : 0),
  );
  const score =
    s.school.base * 0.72 +
    (s.teamwork + (s.skills.includes("mood") ? 8 : 0)) * 0.45 +
    (exposure ? personal * exposure : 8) * 0.28 +
    condition * 15 +
    rng.int(-32, 32);
  return {
    rank: [175, 145, 112, 80, -Infinity].findIndex((min) => score >= min),
    score,
  };
}
const fixed = [];
for (const base of [30, 100, 171, 180]) {
  const s = begin(enroll(seeded(1), "fixed"));
  s.school.base = base;
  s.school.competition = Math.round(base * 0.65);
  s.teamwork = 45;
  s.player = { technique: 90, stamina: 55, spirit: 65, fatigue: 30 };
  const oldRng = seeded(42),
    newRng = seeded(42),
    oldCounts = [0, 0, 0, 0, 0],
    newCounts = [0, 0, 0, 0, 0];
  let oldSame = 0,
    newSame = 0,
    changed = 0,
    maxScoreDelta = 0;
  for (let run = 0; run < 10000; run++) {
    const oldSix = [],
      newSix = [];
    for (let i = 0; i < 6; i++) {
      const old = legacyRank(s, oldRng),
        next = judgeContest(s, newRng);
      oldCounts[old.rank]++;
      newCounts[next.rank]++;
      oldSix.push(old.rank);
      newSix.push(next.rank);
      if (old.rank !== next.rank) changed++;
      maxScoreDelta = Math.max(maxScoreDelta, Math.abs(old.score - next.score));
      assert.ok(Math.abs(old.score - next.score) <= 0.5000001);
      assert.equal(
        next.score,
        next.power +
          next.personalContribution +
          next.conditionBonus +
          next.noise,
      );
    }
    if (new Set(oldSix).size === 1) oldSame++;
    if (new Set(newSix).size === 1) newSame++;
  }
  fixed.push({
    base,
    teamwork: 45,
    power: clubPower(s),
    tier: powerTier(s).label,
    contests: 60000,
    oldCounts,
    newCounts,
    oldSameSixRate: oldSame / 10000,
    newSameSixRate: newSame / 10000,
    changedRankRate: changed / 60000,
    maxScoreDelta: +maxScoreDelta.toFixed(5),
  });
}
const tiers = [];
for (const [base, teamwork] of [
  [20, 20],
  [110, 40],
  [190, 60],
]) {
  const s = begin(enroll(seeded(1), "tier"));
  s.school.base = base;
  s.school.competition = Math.round(base * 0.65);
  s.teamwork = teamwork;
  s.player = { technique: 90, stamina: 55, spirit: 65, fatigue: 30 };
  const rng = seeded(2026),
    counts = [0, 0, 0, 0, 0];
  for (let i = 0; i < 12000; i++) counts[judgeContest(s, rng).rank]++;
  tiers.push({
    base,
    teamwork,
    power: clubPower(s),
    tier: powerTier(s).label,
    counts,
    contests: 12000,
  });
}
const careers = [];
for (const club of CONFIG.clubs)
  for (const base of [30, 100, 180])
    for (const love of [false, true]) {
      const counts = [0, 0, 0, 0, 0];
      let sameSix = 0,
        sameCoach = 0,
        dating = 0;
      for (let i = 1; i <= 100; i++) {
        const rng = seeded(i);
        let s = begin(enroll(rng, `${club.name}-${base}-${love}-${i}`));
        s.school.club = club;
        s.school.base = base;
        s.school.competition = Math.round(base * 0.65);
        s.school.environment = 50;
        const initialBase = s.school.base;
        while (s.screen === "training") {
          let key =
            s.player.fatigue >= 60 ? "rest" : s.turn % 2 ? "basic" : "team";
          if (love) {
            if (!s.met && s.turn <= 6) key = "social";
            else if (s.met && !s.romance.dating && !s.romance.heartbroken)
              key = "date";
            else if (s.romance.dating && [12, 17].includes(s.turn))
              key = "date";
          }
          s = act(s, key, rng);
          if (s.screen === "tournament") s = finishTournament(s);
        }
        assert.equal(s.turn, 23);
        assert.equal(s.screen, "graduation");
        assert.equal(s.tournaments.length, 6);
        assert.equal(s.school.base, initialBase);
        assert.ok(s.summary.trophyIds.includes("graduate"));
        for (const r of s.tournaments) counts[r.rank]++;
        if (new Set(s.tournaments.map((r) => r.rank)).size === 1) sameSix++;
        if (new Set(s.tournaments.map((r) => r.critique)).size === 1)
          sameCoach++;
        if (s.romance.dating) dating++;
      }
      careers.push({
        club: club.name,
        base,
        love,
        runs: 100,
        counts,
        sameSix,
        sameCoach,
        dating,
      });
    }
console.log(
  JSON.stringify(
    {
      referenceCommit: "760428c",
      rankOrder: [
        "優勝相当",
        "準優勝相当",
        "ベスト4相当",
        "ベスト8相当",
        "初戦敗退相当",
      ],
      fixed,
      tiers,
      careers,
      completedCareers: 1800,
    },
    null,
    2,
  ),
);

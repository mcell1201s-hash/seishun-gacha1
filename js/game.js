import { CONFIG as C, SKILLS } from "./config.js";
import { newState } from "./state.js";
import { relationshipAction, skillAction } from "./relationships.js";
import { judgeContest } from "./contest.js";
import { earnTrophies } from "./trophies.js";
import { yearFor } from "./calendar.js";
export { yearFor } from "./calendar.js";
import { captureMemories, graduate } from "./graduation.js";
const clamp = (n, max = 200) => Math.max(0, Math.min(max, n));
export function enroll(rng, id = globalThis.crypto.randomUUID()) {
  const base = rng.int(0, 200);
  const school = {
    name:
      rng.pick(["県立", "市立", "私立"]) +
      rng.pick(["青葉", "星見", "桜丘", "朝凪", "晴海"]) +
      "高校",
    club: rng.pick(C.clubs),
    base,
    environment: clamp(
      Math.round(50 + (base - 100) * 0.25 + rng.int(-45, 45)),
      100,
    ),
    competition: clamp(Math.round(base * 0.65 + rng.int(-45, 65))),
  };
  return newState(
    school,
    {
      technique: rng.int(20, 55),
      stamina: rng.int(25, 60),
      spirit: rng.int(20, 55),
      fatigue: 0,
    },
    rng.pick(C.aptitudes),
    id,
  );
}
export function begin(state) {
  return { ...state, screen: "training" };
}
export function act(state, key, rng) {
  if (state.screen !== "training" || state.turn > C.trainingTurns) return state;
  const action = C.actions[key];
  if (!action || (key === "date" && (!state.met || state.romance.heartbroken)))
    return state;
  const s = structuredClone(state);
  const messages = [`T${s.turn}：${action.name}`];
  const beforeFatigue = s.player.fatigue;
  const fatigueMultiplier =
    beforeFatigue >= C.fatigue.high
      ? C.fatigue.highMultiplier
      : beforeFatigue >= C.fatigue.medium
        ? C.fatigue.mediumMultiplier
        : 1;
  for (const [stat, value] of Object.entries(action.gains)) {
    let gain = value;
    if (action.practice && ["technique", "stamina", "spirit"].includes(stat)) {
      gain = Math.round(
        value *
          (C.environment.minimumMultiplier +
            (s.school.environment / 100) * C.environment.rangeMultiplier) *
          fatigueMultiplier *
          (s.aptitude.stat === stat ? s.aptitude.multiplier : 1),
      );
    }
    if (action.practice && stat === "technique" && s.skills.includes("effort"))
      gain += SKILLS.effort.technique;
    if (action.practice && stat === "fatigue" && s.skills.includes("iron"))
      gain = Math.round(gain * SKILLS.iron.fatigueMultiplier);
    if (stat in s.player)
      s.player[stat] = clamp(
        s.player[stat] + gain,
        stat === "fatigue" ? 100 : 200,
      );
    else s[stat] = clamp(s[stat] + gain, 100);
  }
  relationshipAction(s, key, rng, messages);
  if (rng.chance(C.events.positive)) {
    s.teamwork = clamp(s.teamwork + 3, 100);
    messages.push(
      action.practice
        ? "声を掛け合って、仲間との距離が縮まった。連携 +3"
        : "あなたの笑顔が仲間にも伝わった。連携 +3",
    );
  } else if (rng.chance(C.events.negative / (1 - C.events.positive))) {
    s.teamwork = clamp(s.teamwork - 3, 100);
    messages.push(
      action.practice
        ? "練習方針で意見がすれ違った。連携 −3"
        : "連絡が行き違い、少し気まずい空気に。連携 −3",
    );
  }
  if (
    action.practice &&
    rng.chance(
      (beforeFatigue >= C.fatigue.high
        ? C.injury.high
        : beforeFatigue >= C.fatigue.medium
          ? C.injury.medium
          : C.injury.normal) *
        (s.skills.includes("iron") ? SKILLS.iron.injuryMultiplier : 1),
    )
  ) {
    s.player.fatigue = clamp(s.player.fatigue + C.injury.fatigue, 100);
    s.player.spirit = clamp(s.player.spirit + C.injury.spirit);
    messages.push("軽いケガをしてしまった。疲労 +8 / 精神 −3");
  }
  skillAction(s, key, rng, messages);
  earnTrophies(s);
  captureMemories(state, s, messages);
  s.logs = [...messages, ...s.logs].slice(0, 100);
  if (C.tournaments.includes(s.turn)) {
    s.pendingTournament = judgeContest(s, rng);
    s.screen = "tournament";
  } else advance(s);
  return s;
}
function advance(s) {
  s.turn++;
  if (C.yearStarts.includes(s.turn)) {
    s.player.fatigue = clamp(s.player.fatigue - C.recovery.year, 100);
    s.logs.unshift(
      `${yearFor(s.turn)}年生に進級。新しい春、疲労 −${C.recovery.year}`,
    );
  }
  s.screen = "training";
}
export function finishTournament(state) {
  if (state.screen !== "tournament") return state;
  const s = structuredClone(state);
  s.tournaments.push(s.pendingTournament);
  s.pendingTournament = null;
  earnTrophies(s);
  if (s.turn === C.trainingTurns) {
    s.logs.unshift(`T${s.turn}：最後の大会を終え、部活動を引退した。`);
    return graduate(s);
  }
  s.player.fatigue = clamp(s.player.fatigue - C.recovery.tournament, 100);
  s.logs.unshift(
    `T${s.turn}：${s.school.club.tournament}：${s.tournaments.at(-1).result} / ${s.tournaments.at(-1).personalLabel}。疲労 −${C.recovery.tournament}`,
  );
  advance(s);
  return s;
}

import { CLUB_POWER, CONTEST, ROMANCE, SKILLS } from "./config.js";
import { nextTournament } from "./calendar.js";
export function clubPower(s) {
  return Math.max(
    0,
    Math.min(
      200,
      Math.round(
        s.school.base * CLUB_POWER.baseWeight +
          s.teamwork * CLUB_POWER.teamworkWeight,
      ),
    ),
  );
}
export function powerTier(s) {
  const power = clubPower(s);
  return { power, ...CLUB_POWER.tiers.find((t) => power >= t.min) };
}
export function selectionStats(s) {
  const buffs = { ...s.player };
  if (s.skills.includes("clutch")) buffs.spirit += SKILLS.clutch.spirit;
  if (s.romance.dating && s.romance.type === "support")
    buffs.spirit += ROMANCE.types.support.tournamentSpirit;
  const ability = Object.entries(CONTEST.abilityWeights).reduce(
    (sum, [key, weight]) => sum + buffs[key] * weight,
    0,
  );
  return { buffs, ability };
}
export function roleForMargin(margin) {
  return margin >= CONTEST.regularMargin
    ? "regular"
    : margin >= CONTEST.substituteMargin
      ? "substitute"
      : "reserve";
}
export function developmentGoal(s) {
  const { ability, buffs } = selectionStats(s);
  const target = s.school.competition + CONTEST.regularMargin;
  const role = roleForMargin(ability - s.school.competition);
  const keys = Object.keys(CONTEST.abilityWeights);
  // Prioritize the weighted gap, never recommend a capped ability.
  const focus =
    keys
      .filter((key) => s.player[key] < 200)
      .sort(
        (a, b) =>
          (target - buffs[b]) * CONTEST.abilityWeights[b] -
          (target - buffs[a]) * CONTEST.abilityWeights[a],
      )[0] || "spirit";
  const allCapped = keys.every((key) => s.player[key] >= 200);
  const labels = { technique: "技術", stamina: "体力", spirit: "精神" };
  const required = Math.ceil(
    s.player[focus] +
      Math.max(0, target - ability) / CONTEST.abilityWeights[focus],
  );
  const round = nextTournament(s.turn);
  return {
    role,
    label: CONTEST.roles[role].label,
    ability,
    target,
    focus,
    hint: allCapped
      ? "能力は上限。選考にはばらつきもあります"
      : role === "regular"
        ? "レギュラーの見込み。疲労にも気を配ろう"
        : `レギュラーへ：${labels[focus]}を磨こう`,
    detail: allCapped
      ? "能力はすでに上限です。校内競争が高い場合、最終的な出場区分は本番の選考にも左右されます。"
      : role === "regular"
        ? "抽選前はレギュラー相当です。ただし本番の選考にはばらつきがあります。"
        : required <= 200
          ? `他の能力が今のままなら、${labels[focus]}${required}前後が抽選前の目安です。現在は${s.player[focus]}。`
          : `今の競争水準では${labels[focus]}だけを伸ばしても届きにくいため、技術・体力・精神を組み合わせて伸ばしましょう。`,
    remaining: round ? round.turn - s.turn + 1 : 0,
    note: "出場区分は現在の能力と校内競争から求めた見込みです。スキル・交際の大会バフを反映します。本番は選考のばらつきがあり、出場を確約する表示ではありません。",
  };
}

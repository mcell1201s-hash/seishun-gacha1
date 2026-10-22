import { CONTEST as C, CLUB_POWER, SKILLS } from "./config.js";
import { clubPower, selectionStats, roleForMargin } from "./development.js";
import { tournamentFor } from "./calendar.js";
import { coachComment } from "./coach.js";
export function judgeContest(s, rng) {
  const { buffs, ability } = selectionStats(s);
  const supported = s.romance.dating && s.romance.type === "support";
  const role = roleForMargin(
    ability +
      rng.int(-C.selectionNoise, C.selectionNoise) -
      s.school.competition,
  );
  const exposure = C.roles[role].exposure;
  const condition = Math.max(
    C.condition.minimum,
    1 - (s.player.fatigue / 100) * C.condition.fatiguePenalty,
  );
  const personalScore = Math.max(
    0,
    ability * condition +
      rng.int(-C.personalNoise, C.personalNoise) +
      (s.skills.includes("focus") ? SKILLS.focus.personal : 0),
  );
  const personal = !exposure
    ? "none"
    : personalScore >= C.personalThresholds.excellent
      ? "excellent"
      : personalScore >= C.personalThresholds.good
        ? "good"
        : "quiet";
  const personalContribution =
    (exposure ? personalScore * exposure : C.reserveContribution) *
      C.teamWeights.contribution +
    (s.skills.includes("mood")
      ? SKILLS.mood.teamwork * CLUB_POWER.teamworkWeight
      : 0);
  const power = clubPower(s),
    conditionBonus = condition * C.teamWeights.condition,
    noise = rng.int(-C.teamNoise, C.teamNoise);
  const score = power + personalContribution + conditionBonus + noise;
  const rank = C.ranks.findIndex((r) => score >= r.min),
    labels = C.labels[s.school.club.name];
  const round = tournamentFor(s.turn);
  const snapshot = { player: { ...s.player }, teamwork: s.teamwork };
  const critique = coachComment(s, { rank, role, buffs }, snapshot);
  return {
    turn: s.turn,
    name: `${round?.phase || "大会"}・${s.school.club.tournament}`,
    year: round?.year,
    season: round?.season,
    final: !!round?.final,
    rank,
    result: labels.ranks[rank],
    record:
      s.school.club.name === "野球部"
        ? C.ranks[rank].record
        : `総合評価：${rank + 1} / 5段階（上位から）`,
    role,
    roleLabel: C.roles[role].label,
    personal,
    personalLabel:
      personal === "none" ? "出場なし・仲間を支えた" : labels[personal],
    scene:
      labels.scenes[rank] +
      (personal === "excellent" && rank >= 3
        ? " あなたの活躍は、結果にかかわらず仲間の心に残った。"
        : ""),
    critique: critique.text,
    critiqueReason: critique.reason,
    supported,
    snapshot,
    // Stored evidence for reproducible balance tests and future adjustments; never exposed as coach dialogue.
    power,
    personalContribution,
    conditionBonus,
    noise,
    score,
  };
}

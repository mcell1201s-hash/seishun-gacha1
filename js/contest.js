import { CONTEST as C, ROMANCE, SKILLS } from './config.js';
const weighted = player => Object.entries(C.abilityWeights).reduce((sum, [key, weight]) => sum + player[key] * weight, 0);
export function judgeContest(s, rng) {
  const buffs = { ...s.player };
  if (s.skills.includes('clutch')) buffs.spirit += SKILLS.clutch.spirit;
  const supported = s.romance.dating && s.romance.type === 'support';
  if (supported) buffs.spirit += ROMANCE.types.support.tournamentSpirit;
  const ability = weighted(buffs);
  const margin = ability + rng.int(-C.selectionNoise, C.selectionNoise) - s.school.competition;
  const role = margin >= C.regularMargin ? 'regular' : margin >= C.substituteMargin ? 'substitute' : 'reserve';
  const exposure = C.roles[role].exposure;
  const condition = Math.max(C.condition.minimum, 1 - s.player.fatigue / 100 * C.condition.fatiguePenalty);
  const personalScore = Math.max(0, ability * condition + rng.int(-C.personalNoise, C.personalNoise) + (s.skills.includes('focus') ? SKILLS.focus.personal : 0));
  const personal = !exposure ? 'none' : personalScore >= C.personalThresholds.excellent ? 'excellent' : personalScore >= C.personalThresholds.good ? 'good' : 'quiet';
  const contribution = exposure ? personalScore * exposure : C.reserveContribution;
  const teamwork = s.teamwork + (s.skills.includes('mood') ? SKILLS.mood.teamwork : 0);
  const w = C.teamWeights;
  const score = s.school.base * w.base + teamwork * w.teamwork + contribution * w.contribution + condition * w.condition + rng.int(-C.teamNoise, C.teamNoise);
  const rank = C.ranks.findIndex(r => score >= r.min);
  const labels = C.labels[s.school.club.name];
  let critique;
  // A concrete current weakness is selected before any generic comment.
  const weaknesses = ['technique','stamina','spirit'].map(key => ({ key, gap: (C.critique[key] - buffs[key]) / C.critique[key] })).filter(x => x.gap > 0).sort((a,b) => b.gap-a.gap);
  if (s.player.fatigue >= C.critique.fatigue) critique = '疲れが見えていた。休むことも、次の舞台への準備だ。';
  else if (s.teamwork < C.critique.teamwork) critique = '個々の力は悪くない。あとは噛み合うかどうかだ。';
  else if (weaknesses.length) critique = { technique: '基礎をもう一度磨こう。大事な場面ほど、積み重ねが出る。', stamina: '終盤まで勢いを保ちたいな。', spirit: '勝負どころで少し硬くなっていたようだ。' }[weaknesses[0].key];
  else if (role === 'reserve') critique = '仲間を支える姿も見ている。自分の持ち味を磨いて、次の出番をつかもう。';
  else critique = rank <= 1 ? '積み重ねが形になったな。この経験を次にもつなげよう。' : '自分たちの持ち味は出せた。相手の良さも学んで、次へ進もう。';
  return { turn: s.turn, name: s.school.club.tournament, rank, result: labels.ranks[rank], record: s.school.club.name === '野球部' ? C.ranks[rank].record : `総合評価：${rank+1} / 5段階（上位から）`, role, roleLabel: C.roles[role].label,
    personal, personalLabel: personal === 'none' ? '出場なし・仲間を支えた' : labels[personal], scene: labels.scenes[rank] + (personal === 'excellent' && rank >= 3 ? ' あなたの活躍は、結果にかかわらず仲間の心に残った。' : ''), critique, supported };
}

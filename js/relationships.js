import { ROMANCE as R, SKILLS } from './config.js';
export const bounded = (value, max = 200) => Math.max(0, Math.min(max, value));
export function gains(s, values) {
  for (const [key, value] of Object.entries(values)) s.player[key] = bounded(s.player[key] + value, key === 'fatigue' ? 100 : 200);
}
export function relationshipStage(s) {
  const r = s.romance;
  return r.dating ? '交際中' : r.heartbroken ? '失恋を乗り越えて' : !s.met ? '未遭遇' : s.affection >= R.intimate ? '親密' : '知り合い';
}
function meet(s, rng, messages, season) {
  s.met = true; s.affection = R.initialAffection;
  s.romance.type = rng.pick(Object.keys(R.types));
  messages.push(`${season ? '季節の行事で' : '帰り道に'}${R.types[s.romance.type].name}と出会った。好感度20・デートが解放！`);
}
export function relationshipAction(s, key, rng, messages) {
  const r = s.romance;
  // Social and seasonal rolls are exclusive: a social action always has exactly a 50% encounter chance.
  if (!s.met) {
    const probability = key === 'social' ? R.encounter : R.seasons.includes(s.turn) ? R.seasonalEncounter : 0;
    if (probability > 0 && rng.chance(probability)) meet(s, rng, messages, key !== 'social');
  }
  const wasDating = r.dating;
  if (key === 'date' && !r.heartbroken) {
    if (wasDating) {
      r.datesAfterDating++;
      if (rng.chance(R.dateRecoveryChance)) { gains(s, { fatigue: -R.dateRecovery }); messages.push('寄り道して、肩の力が抜けた。疲労が回復。'); }
      if (rng.chance(R.dateMemoryChance)) { r.memories++; messages.push('ふたりだけの大切な思い出が増えた。'); }
      if (r.type === 'free' && !r.freeAwakened && rng.chance(R.types.free.awakeningChance)) {
        r.freeAwakened = true; gains(s, R.awakeningGains); messages.push('なぎと見た知らない景色が、あなたの表現を変えた。覚醒！');
      }
    } else if (s.affection >= R.confessionAt && !r.confessionTried) {
      r.confessionTried = true;
      if (rng.chance(R.confessionChance)) {
        r.dating = true;
        if (!r.bonusApplied) { gains(s, R.types[r.type].bonus); r.bonusApplied = true; }
        messages.push(`${R.types[r.type].name}に思いを伝えた。「私も、同じ気持ち。」交際が始まった！`);
      } else { r.heartbroken = true; gains(s, { spirit: R.rejectionSpirit }); messages.push('勇気を出した告白は、実らなかった。それでも、この気持ちは本物だった。'); }
    }
  }
  if (r.heartbroken && key in { basic: 1, intensive: 1, team: 1 }) {
    r.practiceAfterHeartbreak++;
    if (!r.awakened && r.practiceAfterHeartbreak >= R.heartbreakPracticeMinimum && rng.chance(R.awakeningChance)) {
      r.awakened = true; gains(s, R.awakeningGains); messages.push('悔しさを練習に変えた日々。昨日までの自分を越えた。覚醒！');
    }
  }
  // Ongoing effects start on the action AFTER the confession. The one-time bonus cannot repeat.
  if (!wasDating) return;
  const type = R.types[r.type];
  if (r.type === 'support' && rng.chance(type.recoveryChance)) { gains(s, { fatigue: -type.recovery }); messages.push('こはるからの励ましで、疲れが少し軽くなった。'); }
  if (r.type === 'diligent' && ['basic','intensive','team'].includes(key) && rng.chance(type.practiceChance)) { gains(s, { technique: type.practiceTechnique }); messages.push('ひまりも頑張っている。もう少し練習しよう。技術 +3'); }
  if (r.type === 'free') {
    if (rng.chance(type.positiveChance)) { gains(s, { spirit: type.positiveSpirit }); messages.push('なぎのひと言に背中を押された。精神 +5'); }
    else if (rng.chance(type.negativeChance / (1 - type.positiveChance))) { gains(s, { spirit: type.negativeSpirit }); messages.push('なぎの自由なペースに少し戸惑った。精神 −3'); }
  }
}
export function skillAction(s, key, rng, messages) {
  s.actionCounts[key] = (s.actionCounts[key] || 0) + 1;
  for (const [id, skill] of Object.entries(SKILLS)) {
    const count = skill.actions.reduce((sum, action) => sum + (s.actionCounts[action] || 0), 0);
    if (!s.skills.includes(id) && skill.actions.includes(key) && count >= skill.minimum && rng.chance(skill.chance)) {
      s.skills.push(id); messages.push(`日々の積み重ねが力に。スキル「${skill.name}」を獲得！`);
    }
  }
}
export function romanceEnding(s) {
  const r = s.romance;
  if (r.dating) {
    const special = r.datesAfterDating >= R.endingDates && r.memories > 0 && s.affection >= R.endingAffection;
    return { special, text: special ? `${R.types[r.type].name}と、卒業後も一緒に歩く約束をした。ふたりの春は、これからも続く。` : `${R.types[r.type].name}と校門で並んだ。忙しい日々も支え合えた、大切な青春だった。` };
  }
  return { special: false, text: r.heartbroken ? '叶わなかった恋も、あなたを育ててくれた。胸を張って、新しい春へ。' : s.met ? '恋にはならなくても、あの出会いは大切な思い出になった。' : '部活と仲間に夢中だった3年間。あなたらしい青春がここにある。' };
}

import { romanceEnding, relationshipStage } from "./relationships.js";
import { earnTrophies, trophyDetails } from "./trophies.js";
import { CONFIG, ROMANCE, SKILLS } from "./config.js";
import { clubPower } from "./development.js";
export function captureMemories(before, after, messages) {
  const record = (type, text) =>
    after.memories.push({ turn: before.turn, type, text });
  if (!before.met && after.met)
    record("meeting", `${ROMANCE.types[after.romance.type].name}と出会った。`);
  if (!before.romance.dating && after.romance.dating)
    record(
      "dating",
      `${ROMANCE.types[after.romance.type].name}との交際が始まった。`,
    );
  if (!before.romance.heartbroken && after.romance.heartbroken)
    record(
      "heartbreak",
      "告白は実らなかった。それでも、思いを伝える勇気を出した。",
    );
  if (
    (!before.romance.awakened && after.romance.awakened) ||
    (!before.romance.freeAwakened && after.romance.freeAwakened)
  )
    record("awakening", "新しい自分に目覚めた、忘れられない一日。");
  for (const id of after.skills.filter((id) => !before.skills.includes(id)))
    record("skill", `練習を重ねて「${SKILLS[id].name}」が身についた。`);
  if (messages.some((message) => message.includes("ケガをして")))
    record("injury", "ケガで思うようにいかない日もあった。");
}
export function recollections(s) {
  const lines = [
    `${s.school.name}の${s.school.club.name}。偶然から始まった、あなたの3年間。`,
  ];
  const labels = { technique: "技術", stamina: "体力", spirit: "精神" };
  if (s.initialPlayer) {
    const key = Object.keys(labels).sort(
      (a, b) =>
        s.player[b] - s.initialPlayer[b] - (s.player[a] - s.initialPlayer[a]),
    )[0];
    lines.push(
      `${labels[key]}は${s.initialPlayer[key]}から${s.player[key]}へ。日々の選択が、今のあなたを育てた。`,
    );
  }
  const best = s.tournaments.reduce(
    (a, b) => (!a || b.rank < a.rank ? b : a),
    null,
  );
  const last = s.tournaments.at(-1);
  if (best)
    lines.push(
      `最高成績は${best.year}年の${best.season}、${best.result}。${best.roleLabel}として迎えた大会だった。`,
    );
  const low = s.tournaments.find((t) => t.rank === 4);
  if (low && low !== best && low !== last)
    lines.push(
      `${low.year}年の${low.season}は${low.result}。届かなかった舞台も、青春の一部になった。`,
    );
  const moment = [
    "awakening",
    "heartbreak",
    "skill",
    "injury",
    "dating",
    "meeting",
  ]
    .map((type) => s.memories.find((m) => m.type === type))
    .find(Boolean);
  if (moment) lines.push(`T${moment.turn}、${moment.text}`);
  if (last)
    lines.push(
      `最後の夏は${last.roleLabel}で、チームは${last.result}。${last.personal === "none" ? "仲間を支えて、部活動を締めくくった。" : `あなたは「${last.personalLabel}」を記録した。`}`,
    );
  return lines;
}
export function graduate(s) {
  s.screen = "graduation";
  earnTrophies(s, true);
  const best = s.tournaments.reduce(
    (a, b) => (!a || b.rank < a.rank ? b : a),
    null,
  );
  s.summary = {
    version: 3,
    turns: CONFIG.turns,
    id: s.id,
    date: new Date().toISOString(),
    school: s.school.name,
    club: s.school.club.name,
    initialPlayer: { ...s.initialPlayer },
    player: { ...s.player },
    teamwork: s.teamwork,
    clubPower: clubPower(s),
    finalRole: s.tournaments.at(-1)?.roleLabel,
    bestResult: best?.result,
    tournaments: s.tournaments.length,
    results: structuredClone(s.tournaments),
    skills: [...s.skills],
    romance: romanceEnding(s).text,
    romanceType: s.romance.type,
    romanceStage: relationshipStage(s),
    dating: s.romance.dating,
    memories: structuredClone(s.memories),
    recollections: recollections(s),
    trophyIds: [...s.trophyIds],
    trophies: trophyDetails(s.trophyIds).map((t) => t.name),
  };
  return s;
}

import { CONFIG, SKILLS } from "./config.js";
import { yearFor } from "./game.js";
import { clubArt, art } from "./presentation.js";

export const TIMING = { action: 550, result: 1050, cooldown: 280 };
export const DESCRIPTIONS = {
  野球部: {
    basic: [
      "キャッチボールで、いつもの感覚を確かめた。",
      "足運びを意識して、素振りを重ねた。",
    ],
    intensive: [
      "日が暮れるまでバットを振り続けた。",
      "苦手なコースに、何度も向き合った。",
    ],
    team: [
      "声を掛け合い、連係プレーを確かめた。",
      "みんなで守備位置を見直した。",
    ],
    rest: [
      "グラウンドの隅で、風に当たって休んだ。",
      "練習着を干して、体をゆっくり休めた。",
    ],
    social: [
      "帰り道、仲間と今日のプレーを語った。",
      "ベンチで笑い合い、距離が少し縮まった。",
    ],
    date: [
      "放課後の帰り道、ふたりで遠回りした。",
      "試合の話を、隣でじっくり聞いてくれた。",
    ],
  },
  吹奏楽部: {
    basic: [
      "息の流れを意識して、基礎の音を重ねた。",
      "音階練習で、指先の動きを確かめた。",
    ],
    intensive: [
      "難しいフレーズを何度も吹き直した。",
      "音楽室に残り、納得の一音を探した。",
    ],
    team: [
      "隣の音を聴きながら、響きを合わせた。",
      "みんなの呼吸をそろえ、曲を通した。",
    ],
    rest: [
      "楽器を手入れして、静かな時間を過ごした。",
      "音楽室の窓辺で、深く息をついた。",
    ],
    social: [
      "好きな曲を教え合い、話が弾んだ。",
      "楽譜を片づけながら、仲間と笑い合った。",
    ],
    date: [
      "好きな音楽を聴きながら、並んで歩いた。",
      "今日の演奏の話を、ふたりで交わした。",
    ],
  },
  美術部: {
    basic: [
      "光の当たり方を見て、線を重ねた。",
      "色を混ぜながら、絵の具の感覚を覚えた。",
    ],
    intensive: [
      "納得がいくまでデッサンを描き続けた。",
      "一枚の絵に向き合い、細部を描き直した。",
    ],
    team: [
      "作品を並べて、互いの良さを話し合った。",
      "みんなで展示の配置を考えた。",
    ],
    rest: [
      "筆を洗い、窓の外の色を眺めた。",
      "画集を閉じて、目と肩を休ませた。",
    ],
    social: [
      "好きな作品の話で、放課後が過ぎた。",
      "スケッチを見せ合い、会話が広がった。",
    ],
    date: [
      "街の色を探して、ふたりで散歩した。",
      "小さな展示を、並んでゆっくり眺めた。",
    ],
  },
};

// Descriptions use a deterministic variation, never the game's RNG stream.
export function describeAction(state, key) {
  const choices = DESCRIPTIONS[state.school.club.name][key];
  return choices[(state.actionCounts[key] || 0) % choices.length];
}
export function newMessages(before, after) {
  const oldStart = after.logs.indexOf(before.logs[0]);
  return after.logs.slice(0, oldStart < 0 ? 1 : oldStart);
}
export function actionFeedback(before, after, key) {
  const messages = newMessages(before, after);
  const events = [];
  for (const id of after.skills.filter((id) => !before.skills.includes(id)))
    events.push({ title: `スキル「${SKILLS[id].name}」獲得`, icon: "trophy" });
  if (messages.some((text) => text.includes("ケガをして")))
    events.push({ title: "ケガをしてしまった", icon: "rest" });
  if (!before.met && after.met)
    events.push({ title: "新しい出会い", icon: "face-" + after.romance.type });
  if (!before.romance.confessionTried && after.romance.confessionTried)
    events.push({
      title: after.romance.dating
        ? "思いが届いた。交際スタート！"
        : "告白は実らなかった",
      icon: after.romance.dating ? "heart" : "rest",
    });
  if (
    (!before.romance.awakened && after.romance.awakened) ||
    (!before.romance.freeAwakened && after.romance.freeAwakened)
  )
    events.push({ title: "あの日の自分を越えた。覚醒！", icon: "fire" });
  if (yearFor(after.turn) > yearFor(before.turn))
    events.push({ title: `${yearFor(after.turn)}年生に進級！`, icon: "cap" });
  const delta = ["technique", "stamina", "spirit", "fatigue"].map((stat) => ({
    stat,
    value: after.player[stat] - before.player[stat],
  }));
  for (const stat of ["teamwork", "affection"])
    if (after[stat] !== before[stat])
      delta.push({ stat, value: after[stat] - before[stat] });
  return {
    name: CONFIG.actions[key].name,
    description: describeAction(before, key),
    icon:
      key === "basic"
        ? clubArt(before).key
        : key === "date"
          ? "face-" + before.romance.type
          : { intensive: "fire", team: "team", rest: "rest", social: "social" }[
              key
            ],
    delta,
    messages: messages.filter((text) => !text.startsWith(`T${before.turn}：`)),
    events,
    important: events.length > 0,
  };
}
export function promotionFeedback(before, after) {
  return {
    name: "新しい春",
    description: "少し背伸びした制服で、また一歩。",
    icon: "cap",
    delta: [
      { stat: "fatigue", value: after.player.fatigue - before.player.fatigue },
    ],
    messages: newMessages(before, after),
    events: [{ title: `${yearFor(after.turn)}年生に進級！`, icon: "cap" }],
    important: true,
  };
}
const escape = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function renderFeedback(feedback) {
  const labels = {
    technique: "技術",
    stamina: "体力",
    spirit: "精神",
    fatigue: "疲労",
    teamwork: "連携",
    affection: "好感度",
  };
  const result = feedback.phase === "result";
  return `<div class="turn-feedback" role="dialog" aria-modal="true" aria-label="${result ? "行動結果" : "行動中"}" tabindex="-1"><section class="feedback-panel ${result ? "show-result" : "show-action"}"><p class="eyebrow">${result ? (feedback.important ? "大切な青春のひとこま" : "今日の成果") : "放課後のひとこま"}</p>${art(result && feedback.events.length ? feedback.events[0].icon : feedback.icon, "feedback-icon")}<h2>${escape(feedback.name)}${result ? "の結果" : "！"}</h2><p class="action-description">${escape(feedback.description)}</p>${result ? `<div class="result-deltas">${feedback.delta.map(({ stat, value }) => `<span class="delta ${!value ? "neutral" : (stat === "fatigue" ? value < 0 : value > 0) ? "benefit" : "cost"}">${labels[stat]} <b>${value > 0 ? "+" : value < 0 ? "−" : "±"}${Math.abs(value)}</b>${stat === "fatigue" && value > 0 ? "<small>疲れが増えた</small>" : ""}</span>`).join("")}</div>${feedback.events.map((event) => `<h3 class="important-event">${art(event.icon, "event-icon")}${escape(event.title)}</h3>`).join("")}<div class="feedback-messages">${feedback.messages.map((message) => `<p>${escape(message)}</p>`).join("")}</div>` : ""}<button class="feedback-next" data-action="feedback-next">${!result ? "タップで結果を見る" : feedback.important ? "確認して次へ ▶" : "タップで次へ ▶"}</button>${result && !feedback.important ? '<small class="auto-hint">まもなく次のターンへ</small>' : ""}</section></div>`;
}

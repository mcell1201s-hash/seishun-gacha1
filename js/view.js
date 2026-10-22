import { powerTier, developmentGoal } from "./development.js";
import { nextTournament } from "./calendar.js";
import { CONFIG as C, ROMANCE, SKILLS } from "./config.js";
import { yearFor } from "./game.js";
import { relationshipStage } from "./relationships.js";
import { trophyDetails } from "./trophies.js";
import {
  art,
  clubArt,
  seasonFor,
  SEASONS,
  PIXEL_ROOT,
} from "./presentation.js";
const escape = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const button = (action, text, cls = "primary") =>
  `<button class="${cls}" data-action="${action}">${text}</button>`;

function progress(s) {
  const position = (turn) => ((turn - 1) / (C.turns - 1)) * 100;
  return `<section class="turn-panel" aria-label="高校生活の進行"><div class="progress-head"><span>青春のあしあと</span><strong><span class="turn-number">${s.turn}</span><small> / ${C.turns}</small></strong><span>${s.turn <= C.trainingTurns ? "育成中" : "卒業まで"}</span></div><div class="runner-track"><progress max="${C.turns}" value="${s.turn}" aria-label="現在のターン">${s.turn}/${C.turns}</progress><div class="runner-lane">${C.tournaments.map((turn) => `<span class="milestone" style="left:${position(turn)}%" title="T${turn} 大会" aria-hidden="true"></span>`).join("")}${C.yearStarts
    .slice(1)
    .map(
      (turn) =>
        `<span class="year-mark" style="left:${position(turn)}%" aria-hidden="true"></span>`,
    )
    .join(
      "",
    )}<span class="runner" style="left:${position(s.turn)}%">${art("runner")}</span></div></div><div class="progress-legend"><span>1年</span><span>2年</span><span>3年・卒業</span></div></section>`;
}

function scenery(s) {
  const season = seasonFor(s.turn),
    info = SEASONS[season],
    club = clubArt(s);
  const tier = powerTier(s);
  return `<section class="school-scene season-${season} club-${club.key}" aria-label="${yearFor(s.turn)}年生の${info.label}・${escape(s.school.name)}・${s.school.club.name}"><img class="season-bg pixel" src="${PIXEL_ROOT}school-${season}.svg" alt="${info.label}の高校風景" width="320" height="180"><div class="season-chip">${yearFor(s.turn)}年生 <span>${info.label}</span><small>${s.turn === C.trainingTurns ? "最後の夏" : "放課後"}</small></div><div class="school-overlay">${art(club.key, "club-icon")}<div><p class="school-name">${escape(s.school.name)}</p><div class="club-title"><h1>${s.school.club.name}</h1><p class="club-power" aria-label="部活総合力 ${tier.power} / 200 ${tier.label}">総合力 <b>${tier.power}</b>/200｜${tier.label}</p></div><p class="scene-caption">${info.caption}</p></div></div></section>`;
}

function romance(s) {
  const type = ROMANCE.types[s.romance.type];
  if (!s.met || !type) return "";
  const stage = relationshipStage(s);
  return `<aside class="romance"><h3 class="sr-only">放課後のつながり ${stage}</h3><div class="partner">${art("face-" + s.romance.type, "face", type.name + "の顔")}<div><strong>${type.name}</strong><small>${type.label}</small></div><span class="relationship-stage">${stage}</span></div><details class="relationship-notes"><summary>ふたりのメモ</summary><p>${type.description}</p><p>${s.romance.dating ? `交際後のデート ${s.romance.datesAfterDating}回・思い出 ${s.romance.memories}個。デートをしなくても交際は続きます。` : s.romance.heartbroken ? "思いは届かなかった。でも、練習の先に新しい自分が待っているかもしれない。" : "好感度60以上のデートで、追加のターンを使わず告白します。"}</p></details></aside>`;
}

function stats(s) {
  const rows = [
    ["technique", "技術", 200],
    ["stamina", "体力", 200],
    ["spirit", "精神", 200],
    ["fatigue", "疲労", 100],
  ];
  return `<section class="card status-card"><div class="panel-heading"><h2>あなたのステータス</h2><span>${escape(s.aptitude.name)}</span></div><div class="stats">${rows.map(([key, label, max]) => `<div class="stat ${key}"><div><span>${label}</span><strong>${s.player[key]}<small>/${max}</small></strong></div><meter min="0" max="${max}" value="${s.player[key]}" aria-label="${label}">${s.player[key]}</meter></div>`).join("")}</div><div class="teamline"><span>チーム連携 <b>${s.teamwork}<small>/100</small></b></span><span>好感度 <b>${s.affection}<small>/100</small></b></span></div>${s.screen === "training" ? goalLine(s) : ""}${s.player.fatigue >= 60 ? `<p class="warning">疲労に注意！ 練習成長 −${s.player.fatigue >= 80 ? "40" : "20"}%・ケガのリスク増</p>` : ""}</section>`;
}

function commands(s) {
  const club = clubArt(s);
  return `<section class="command-panel club-${club.key}"><div class="section-title"><h2>今日は、どうする？</h2><span>あと <b>${C.trainingTurns + 1 - s.turn}</b> 回</span></div><div class="actions">${Object.entries(
    C.actions,
  )
    .map(([key, a]) => {
      const locked = key === "date" && (!s.met || s.romance.heartbroken);
      const sprite =
        key === "date"
          ? s.met
            ? "face-" + s.romance.type
            : "lock"
          : {
              basic: club.key,
              intensive: "fire",
              team: "team",
              rest: "rest",
              social: "social",
            }[key];
      const effectLabels = {
        technique: "技術",
        stamina: "体力",
        spirit: "精神",
        fatigue: "疲労",
        teamwork: "連携",
        affection: "好感",
      };
      const effects = Object.entries(a.gains)
        .map(
          ([stat, value]) =>
            `<span class="command-effect ${stat === "fatigue" && value > 0 ? "cost" : ""}">${effectLabels[stat]}${value > 0 ? "+" : "−"}${Math.abs(value)}</span>`,
        )
        .join("");
      const flavor =
        key === "basic" ? club.practice : key === "team" ? club.team : "";
      return `<button data-action="act" data-key="${key}" class="action action-${key}" ${locked ? "disabled" : ""} ${flavor ? `title="${flavor}"` : ""}>${art(sprite, "action-icon")}<strong>${a.name}</strong><small>${locked ? (s.romance.heartbroken ? "思い出を力に" : "まだ出会っていない") : `<span class="command-effects">${effects}</span>`}</small>${key === "team" ? art(club.key, "command-badge") : ""}${locked ? '<span class="locked-label">未解放</span>' : ""}</button>`;
    })
    .join(
      "",
    )}</div><p class="schedule">◆ 大会 ${C.tournaments.map((t) => `T${t}`).join("・")} <span>行動後に開催</span></p></section>`;
}

function skills(ids = []) {
  return `<div class="skill-list">${ids.length ? ids.map((id) => (SKILLS[id] ? `<span class="skill"><strong>${SKILLS[id].name}</strong><small>${SKILLS[id].description}</small></span>` : "")).join("") : '<p class="muted">練習を重ねると、あなたの武器が見つかります。</p>'}</div>`;
}
function skillPanel(s) {
  return `<details class="card skills-panel"><summary>身につけたスキル <span>${s.skills.length}個</span></summary>${skills(s.skills)}</details>`;
}
function trophies(ids) {
  return `<div class="trophies">${trophyDetails(ids)
    .map(
      (t) =>
        `<div class="trophy">${art("trophy")}<div><small>${t.category}</small><strong>${t.name}</strong><p>${t.description}</p></div></div>`,
    )
    .join("")}</div>`;
}
function albumEntry(r) {
  return `<details class="memory"><summary><span class="album-stamp">${art("cap")}</span><span><strong>${escape(r.school)} · ${escape(r.club)}</strong><small>${r.version >= 3 ? "23ターン版" : "旧24ターン版・記録保持"} · ${escape(typeof r.date === "string" ? r.date.slice(0, 10) : "")} · トロフィー ${r.trophies.length}個</small></span></summary><div class="album-pages">${retrospective(r)}<h3>卒業時のあなた</h3>${r.player ? `<p>技術 ${escape(r.player.technique)} / 体力 ${escape(r.player.stamina)} / 精神 ${escape(r.player.spirit)} / 連携 ${escape(r.teamwork)}</p>` : ""}${skills(Array.isArray(r.skills) ? r.skills : [])}<h3>大会の記録</h3>${Array.isArray(r.results) ? r.results.map((t) => `<p class="album-contest">T${escape(t.turn)} ${escape(t.name)}<br><b>${escape(t.result)}</b> · ${escape(t.roleLabel)}<br>${escape(t.personalLabel)}<br><small>${escape(t.critique)}</small></p>`).join("") : '<p class="muted">旧バージョンの記録には大会詳細がありません。</p>'}<h3>青春の結末</h3><p>${escape(r.romance || "この青春の記録は、アルバムに残っています。")}</p><h3>獲得トロフィー</h3>${Array.isArray(r.trophyIds) ? trophies(r.trophyIds) : r.trophies.map((name) => `<p>${escape(name)}</p>`).join("")}</div></details>`;
}

export function render(s, history, saveOk = true) {
  if (!s)
    return `<section class="hero"><div class="title-landscape"><img class="pixel" src="${PIXEL_ROOT}school-spring.svg" alt="桜の咲く高校" width="320" height="180"><div class="title-logo"><span>あなただけの、3年間。</span><h1>青春ガチャ<span>。</span></h1><p>部活は選べない。青春は選べる。</p></div></div><div class="hero-body"><div class="title-clubs">${["baseball", "band", "art"].map((name) => art(name)).join("")}</div><p>どんな学校も、どんな部活も。<br>偶然から始まる、あなただけの青春。</p>${button("enroll", "入学ガチャを引く ▶")}<p class="muted">全${C.turns}育成ターン・最後の夏へ</p></div></section><section class="card album"><h2>青春アルバム <span>${history.length}冊</span></h2>${history.length ? history.map(albumEntry).join("") : '<p class="muted">卒業したら、ここに思い出が残ります。</p>'}</section>`;
  let content = "";
  if (s.screen === "admission")
    content = `<section class="admission"><div class="card admission-heading"><p class="eyebrow">入学ガチャ / YOUR NEW STORY</p><h1>入学おめでとう。</h1><p>この場所で、青春が始まる。</p></div>${scenery(s)}<div class="card admission-card"><span class="drawn-stamp">入学決定</span><div class="school-data"><p>学校の基礎戦力 <b>${s.school.base}<small>/200</small></b></p><p>育成環境 <b>${s.school.environment}<small>/100</small></b></p><p>校内の競争水準 <b>${s.school.competition}<small>/200</small></b></p></div><p class="muted">環境が違っても、選ぶのはあなた。</p>${button("begin", "この青春を始める ▶")}</div></section>${stats(s)}`;
  if (s.screen === "training")
    content = `${scenery(s)}${romance(s)}${stats(s)}${commands(s)}`;
  if (s.screen === "tournament") {
    const t = s.pendingTournament,
      club = clubArt(s);
    content = `<section class="card moment tournament club-${club.key} ${t.final ? "final-tournament" : ""}">${t.final ? '<p class="final-banner">高校最後の大会 / LAST SUMMER</p>' : ""}<div class="tournament-stage"><img class="stage-bg pixel" src="${PIXEL_ROOT}stage-${club.key}.svg" alt="${s.school.club.name}の大会会場" width="320" height="100"><div class="stage-heading">${art(club.key)}<div><p>第${s.tournaments.length + 1}回 / ${t.year}年・${t.season}</p><h1>${escape(t.name)}</h1></div></div></div><div class="moment-body"><div class="contest-result"><span>チームの成績</span><h2>${t.result}</h2><p>${t.record}</p></div><div class="performance"><p>大会時の部活総合力 <b>${t.power}/200</b></p><p>出場機会 <b>${t.roleLabel}</b></p><p>あなたの活躍 <b>${t.personalLabel}</b></p></div><p class="scene-text">${t.scene}</p>${t.supported ? '<p class="muted">こはるの応援が、舞台に向かう背中を押してくれた。</p>' : ""}<blockquote>${art("face-coach", "coach-face", "監督・顧問の顔")}<div><span>監督・顧問の講評</span><p>「${t.critique}」</p></div></blockquote><p class="muted">${t.final ? "この大会で引退。卒業はターンを消費しません。" : `大会後に疲労 −${C.recovery.tournament}<br>育成行動は消費しません`}</p>${button("tournament", t.final ? "卒業アルバムへ ▶" : "次の季節へ ▶")}</div></section>`;
  }
  if (s.screen === "graduation")
    content = `<section class="card graduation album"><div class="graduation-heading"><p class="eyebrow">青春アルバム / YOUR STORY, FOREVER</p>${art("cap", "big-icon")}<h1>卒業おめでとう。</h1><p>${escape(s.school.name)}<br><strong>${s.school.club.name}</strong></p></div><p class="album-intro">${s.tournaments.length}回の大会と、${C.trainingTurns}回の選択。<br>あなたの青春が、ここに残りました。</p>${retrospective(s.summary)}<h2>集めた青春のしるし</h2>${trophies(s.trophyIds)}<h2>あなただけの結末</h2><p class="ending">${escape(s.summary.romance)}</p><details class="graduation-records"><summary>3年間の大会記録を見る</summary>${s.tournaments.map((t) => `<p class="album-contest">T${t.turn} ${escape(t.name)}<br><b>${escape(t.result)}</b> · ${escape(t.roleLabel)}<br>${escape(t.personalLabel)}</p>`).join("")}</details><p class="muted save-status">${saveOk ? "卒業結果とトロフィーをこの端末に保存しました。" : "保存できませんでした。ブラウザの保存設定を確認してください。"}</p>${button("home", "青春アルバムへ ▶")}</section>${stats(s)}${skillPanel(s)}`;
  const diary =
    s.screen !== "admission"
      ? `<section class="card diary"><h2>青春日誌 <span>DIARY</span></h2><ol>${s.logs
          .slice(0, 8)
          .map((log) => `<li>${escape(log)}</li>`)
          .join("")}</ol></section>`
      : "";
  if (s.screen === "training")
    return `<div class="training-shell">${progress(s)}${content}<button class="training-info-button" data-action="info">日誌・スキル・行動の説明 ▤</button></div><dialog id="training-info" class="training-info"><button class="primary" data-action="close-info">閉じて育成に戻る</button><h2>青春ノート</h2>${skillPanel(s)}${diary}<h3>次の育成目標</h3><p>現在：${developmentGoal(s).label}の見込み。${developmentGoal(s).detail}</p><p class="muted">${developmentGoal(s).note}</p><p>選考の加重評価 ${developmentGoal(s).ability.toFixed(1)} / レギュラーの目安 ${developmentGoal(s).target}（技術50%・体力25%・精神25%、大会バフ込み）。本番は±12のばらつきがあります。</p>${s.tournaments.length ? `<p>前大会の実績：${s.tournaments.at(-1).roleLabel}・${s.tournaments.at(-1).personalLabel}</p>` : ""}<h3>部活総合力</h3><p>${powerTier(s).power}/200・${powerTier(s).label}：${powerTier(s).goal}。基礎戦力×0.72と連携×0.45を合計して四捨五入した、大会に使う実戦力です。基礎は固定、連携によって上下します。主人公の能力やスキルの貢献は大会時に別途加算します。</p><h3>大会の予定</h3>${C.tournamentSchedule.map((r) => `<p>T${r.turn}：${r.year}年・${r.season}${r.final ? "（最終大会）" : ""}</p>`).join("")}<h3>行動の基本効果</h3><p class="muted">練習成長は環境・疲労・適性で変化します。実際の増減は行動後に表示します。大会後と進級時は自然回復します。</p>${Object.values(
      C.actions,
    )
      .map((a) => `<p><b>${a.name}</b><br>${a.hint}</p>`)
      .join(
        "",
      )}<h3>放課後のつながり</h3><p>${s.met ? `${ROMANCE.types[s.romance.type].name}・${relationshipStage(s)}。${ROMANCE.types[s.romance.type].description}` : "交流や季節の行事で出会いがあります。恋愛をしなくても大会で活躍できます。"}</p><p>${s.romance.dating ? `交際後のデート${s.romance.datesAfterDating}回・思い出${s.romance.memories}個。デートしなくても交際は続きます。` : "好感度60以上のデートで告白。追加のターンは使いません。"}</p></dialog>`;
  return progress(s) + content + diary;
}

function goalLine(s) {
  const goal = developmentGoal(s),
    round = nextTournament(s.turn);
  const label = {
    regular: "レギュラー",
    substitute: "途中出場",
    reserve: "控え",
  }[goal.role];
  return `<div class="training-goal"><span>見込み：${label}</span><b>${round?.final ? "最終" : "次の"}大会まで${goal.remaining}行動</b><small>${goal.hint}</small></div>`;
}
function retrospective(summary) {
  if (!summary?.initialPlayer)
    return '<p class="legacy-note muted">旧版のアルバムです。初期能力と回想は当時未記録のため表示できません。保存済みの結果・トロフィーはそのまま残しています。</p>';
  return `<section class="retrospective"><h2>この青春を振り返る</h2><ol>${(summary.recollections || []).map((text) => `<li>${escape(text)}</li>`).join("")}</ol><table class="growth-table"><caption>入学から卒業まで</caption><thead><tr><th>能力</th><th>入学</th><th>卒業</th></tr></thead><tbody>${[
    ["technique", "技術"],
    ["stamina", "体力"],
    ["spirit", "精神"],
    ["fatigue", "疲労"],
  ]
    .map(
      ([key, label]) =>
        `<tr><th>${label}</th><td>${summary.initialPlayer[key]}</td><td>${summary.player[key]}</td></tr>`,
    )
    .join(
      "",
    )}</tbody></table><p>最終出場区分：<b>${escape(summary.finalRole)}</b><br>最高成績：<b>${escape(summary.bestResult)}</b><br>恋愛：${summary.romanceType ? `${ROMANCE.types[summary.romanceType].name}・${escape(summary.romanceStage || (summary.dating ? "交際成立" : "交際なし"))}` : "未遭遇"}</p>${skills(summary.skills)}</section>`;
}

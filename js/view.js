import { CONFIG as C, ROMANCE, SKILLS } from './config.js';
import { yearFor } from './game.js';
import { relationshipStage } from './relationships.js';
import { trophyDetails } from './trophies.js';
const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button = (action, text, cls = 'primary') => `<button class="${cls}" data-action="${action}">${text}</button>`;
function stats(s) {
  return `<section class="card"><h2>いまのあなた</h2><div class="stats">${[['technique','技術',200],['stamina','体力',200],['spirit','精神',200],['fatigue','疲労',100]].map(([key,label,max]) => `<div class="stat ${key}"><span>${label}</span><strong>${s.player[key]}<small> / ${max}</small></strong><meter min="0" max="${max}" value="${s.player[key]}" aria-label="${label}">${s.player[key]}</meter></div>`).join('')}</div><div class="teamline">チーム連携 <b>${s.teamwork}/100</b><span>好感度 <b>${s.affection}/100</b></span></div>${s.player.fatigue >= 60 ? '<p class="warning">疲れがたまっています。練習成長 −'+ (s.player.fatigue >= 80 ? '40' : '20') +'%・ケガに注意</p>' : ''}${skills(s.skills)}${romance(s)}</section>`;
}
function school(s) { return `<div class="school"><span class="club-icon">${s.school.club.icon}</span><div><h2>${escape(s.school.name)}</h2><p>${s.school.club.name} · ${s.aptitude.name}</p></div></div>`; }
export function render(s, history, saveOk = true) {
  if (!s) return `<section class="hero"><p class="eyebrow">YOUR THREE YEARS, YOUR STORY</p><div class="hero-art" aria-hidden="true">✦<span>青春</span>✧</div><h1>部活は選べない。<br><em>青春は選べる。</em></h1><p>どんな学校も、どんな部活も。<br>偶然から始まる、あなただけの3年間。</p>${button('enroll','入学ガチャを引く →')}<p class="muted">1周 約5〜8分 / 全24ターン</p></section><section class="card"><h2>青春アルバム <span>${history.length}</span></h2>${history.length ? history.map(albumEntry).join('') : '<p class="muted">卒業したら、ここに思い出が残ります。</p>'}</section>`;
  const progress = `<div class="progress-head"><span>${yearFor(s.turn)}年生 <b>T${s.turn}</b> / 24</span><span>${s.turn <= 20 ? '育成期間' : '卒業までの時間'}</span></div><progress max="24" value="${s.turn}" aria-label="高校生活の進行"></progress>`;
  let content = '';
  if (s.screen === 'admission') content = `<section class="card admission"><p class="eyebrow">春、新しいスタート。</p><h1>入学おめでとう。</h1>${school(s)}<div class="school-data"><p>学校の基礎戦力 <b>${s.school.base}/200</b></p><p>育成環境 <b>${s.school.environment}/100</b></p><p>校内の競争水準 <b>${s.school.competition}/200</b></p></div><p class="muted">環境が違っても、選ぶのはあなた。<br>この場所で、3年間を過ごそう。</p>${button('begin','この青春を始める →')}</section>${stats(s)}`;
  if (s.screen === 'training') content = `${school(s)}${stats(s)}<section><div class="section-title"><h2>今日は、どう過ごす？</h2><span>あと${21-s.turn}回の行動</span></div><div class="actions">${Object.entries(C.actions).map(([key,a]) => `<button data-action="act" data-key="${key}" class="action" ${key === 'date' && (!s.met || s.romance.heartbroken) ? 'disabled' : ''}><span class="action-icon">${a.icon}</span><strong>${a.name}</strong><small>${key === 'date' && (!s.met || s.romance.heartbroken) ? (s.romance.heartbroken ? 'この恋は思い出に。次は部活へ' : '交流で出会うと解放') : a.hint}</small></button>`).join('')}</div></section><p class="muted schedule">大会：T4・8・12・16・18・20（行動後に開催）</p>`;
  if (s.screen === 'tournament') {
    const t = s.pendingTournament;
    content = `<section class="card moment"><p class="eyebrow">${yearFor(s.turn)}年生 · 第${s.tournaments.length+1}回の大会</p><div class="big-icon">${s.school.club.icon}</div><h1>${s.school.club.tournament}</h1><div class="contest-result"><span>チームの成績</span><h2>${t.result}</h2><p>${t.record}</p></div><div class="performance"><p>出場機会 <b>${t.roleLabel}</b></p><p>あなたの活躍 <b>${t.personalLabel}</b></p></div><p>${t.scene}</p>${t.supported ? '<p class="muted">こはるの応援が、舞台に向かう背中を押してくれた。</p>' : ''}<blockquote><span>監督・顧問の講評</span><p>「${t.critique}」</p></blockquote><p class="muted">大会後に疲労 −${C.recovery.tournament} / 育成行動は消費しません</p>${button('tournament',s.turn === 20 ? '最後の大会を終えて、引退へ →' : '大会を終えて、次の季節へ →')}</section>`;
  }
  if (s.screen === 'epilogue') content = `<section class="card moment"><p class="eyebrow">AFTER SCHOOL MEMORIES · ${s.turn-20} / 4</p><div class="big-icon">${['🌇','🌸','✉️','🎓'][s.turn-21]}</div><h1>${['次の世代へ。','いつもの帰り道。','春を待つ日々。','青春に、ありがとう。'][s.turn-21]}</h1><p>${C.epilogues[s.turn-21]}</p>${button('epilogue',s.turn === 24 ? '卒業アルバムを開く →' : '次の思い出へ →')}</section>${stats(s)}`;
  if (s.screen === 'graduation') content = `<section class="card moment"><p class="eyebrow">YOUR STORY, FOREVER</p><div class="big-icon">🎓</div><h1>卒業おめでとう。</h1>${school(s)}<p>6回の大会と、20回の選択。<br>あなたの青春が、ここに残りました。</p>${trophies(s.trophyIds)}<p class="ending">${escape(s.summary.romance)}</p><p class="muted">大会参加：${s.tournaments.length}回 / 連携：${s.teamwork}<br>${saveOk ? '卒業結果とトロフィーをこの端末に保存しました。' : '保存できませんでした。ブラウザの保存設定を確認してください。'}</p>${button('home','アルバムへ戻る →')}</section>${stats(s)}`;
  return progress + content + (s.screen !== 'admission' ? `<section class="card diary"><h2>青春日誌</h2><ol aria-live="polite">${s.logs.slice(0,8).map(log => `<li>${escape(log)}</li>`).join('')}</ol></section>` : '');
}

function skills(ids = []) {
  return `<div class="skill-list"><h3>身につけたスキル</h3>${ids.length ? ids.map(id => SKILLS[id] ? `<span class="skill" title="${SKILLS[id].description}">${SKILLS[id].name}<small>${SKILLS[id].description}</small></span>` : '').join('') : '<p class="muted">練習を重ねると、あなたの武器が見つかります。</p>'}</div>`;
}
function romance(s) {
  const type = ROMANCE.types[s.romance.type];
  return `<div class="romance"><h3>放課後のつながり <span>${relationshipStage(s)}</span></h3>${type ? `<div class="partner">${type.portrait ? `<img src="${type.portrait}" alt="金髪のショートボブで、柔らかく微笑む日向ひまり" width="80" height="80">` : `<span class="partner-icon" aria-hidden="true">${type.icon}</span>`}<div><strong>${type.name}</strong><small>${type.label}</small><p>${type.description}</p></div></div><p class="muted">${s.romance.dating ? `交際後のデート ${s.romance.datesAfterDating}回 · 大切な思い出 ${s.romance.memories}個。デートをしなくても交際は続きます。` : s.romance.heartbroken ? '思いは届かなかった。でも、練習の先に新しい自分が待っているかもしれない。' : '好感度60以上のデートで、ターンを使わず告白します。'}</p>` : '<p class="muted">恋愛は任意。交流や季節の行事で出会うことがあります。</p>'}</div>`;
}
function trophies(ids) {
  return `<div class="trophies">${trophyDetails(ids).map(t => `<div class="trophy"><small>${t.category}</small><strong>🏆 ${t.name}</strong><p>${t.description}</p></div>`).join('')}</div>`;
}
function albumEntry(r) {
  return `<details class="memory"><summary><strong>${escape(r.school)} · ${escape(r.club)}</strong><small>${escape(typeof r.date === 'string' ? r.date.slice(0,10) : '')} · トロフィー ${r.trophies.length}個</small></summary><h3>卒業時のあなた</h3>${r.player ? `<p>技術 ${escape(r.player.technique)} / 体力 ${escape(r.player.stamina)} / 精神 ${escape(r.player.spirit)} / 連携 ${escape(r.teamwork)}</p>` : ''}${skills(Array.isArray(r.skills) ? r.skills : [])}<h3>大会の記録</h3>${Array.isArray(r.results) ? r.results.map(t => `<p class="album-contest">T${escape(t.turn)} ${escape(t.name)}<br><b>${escape(t.result)}</b> · ${escape(t.roleLabel)}<br>${escape(t.personalLabel)}<br><small>${escape(t.critique)}</small></p>`).join('') : '<p class="muted">旧バージョンの記録には大会詳細がありません。</p>'}<h3>青春の結末</h3><p>${escape(r.romance || 'この青春の記録は、アルバムに残っています。')}</p><h3>獲得トロフィー</h3>${Array.isArray(r.trophyIds) ? trophies(r.trophyIds) : r.trophies.map(name => `<p>🏆 ${escape(name)}</p>`).join('')}</details>`;
}

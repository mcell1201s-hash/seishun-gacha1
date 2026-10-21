const KEY = 'seishun-gacha.history.v1';
export function loadHistory(storage) {
  try { storage ??= globalThis.localStorage; const data = JSON.parse(storage.getItem(KEY) || '[]'); return Array.isArray(data) ? data.filter(x => x && typeof x.id === 'string' && Array.isArray(x.trophies)) : []; } catch { return []; }
}
export function saveResult(result, storage) {
  try { storage ??= globalThis.localStorage; const history = loadHistory(storage); if (!history.some(x => x.id === result.id)) history.unshift(result); storage.setItem(KEY, JSON.stringify(history.slice(0, 50))); return true; } catch { return false; }
}
export function newState(school, player, aptitude, id) {
  return { id, screen: 'admission', turn: 1, school, player, aptitude, teamwork: 30, affection: 0, met: false, tournaments: [], pendingTournament: null, skills: [], actionCounts: {}, trophyIds: [], romance: { type: null, dating: false, confessionTried: false, bonusApplied: false, heartbroken: false, practiceAfterHeartbreak: 0, awakened: false, freeAwakened: false, datesAfterDating: 0, memories: 0 }, logs: ['新しい制服。新しい毎日。あなたの青春が始まる。'], summary: null };
}

const KEY = 'seishun-gacha.history.v1';
export function loadHistory(storage = globalThis.localStorage) {
  try { const data = JSON.parse(storage.getItem(KEY) || '[]'); return Array.isArray(data) ? data.filter(x => x && typeof x.id === 'string' && Array.isArray(x.trophies)) : []; } catch { return []; }
}
export function saveResult(result, storage = globalThis.localStorage) {
  try { const history = loadHistory(storage); if (!history.some(x => x.id === result.id)) history.unshift(result); storage.setItem(KEY, JSON.stringify(history.slice(0, 50))); return true; } catch { return false; }
}
export function newState(school, player, aptitude, id) {
  return { id, screen: 'admission', turn: 1, school, player, aptitude, teamwork: 30, affection: 0, met: false, tournaments: [], logs: ['新しい制服。新しい毎日。あなたの青春が始まる。'], summary: null };
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { enroll, begin, act, finishTournament, nextEpilogue } from '../js/game.js';
import { createRandom } from '../js/random.js';
import { judgeContest } from '../js/contest.js';
import { relationshipAction, romanceEnding, skillAction } from '../js/relationships.js';
import { earnTrophies } from '../js/trophies.js';
import { ROMANCE, SKILLS } from '../js/config.js';
import { render } from '../js/view.js';
import { saveResult, loadHistory } from '../js/state.js';
const neutral = createRandom(() => .5);
const never = { chance: () => false, int: () => 0, pick: list => list[0] };
const always = { chance: () => true, int: (a,b) => b, pick: list => list[0] };
const fresh = id => begin(enroll(neutral,id || 'test'));
function advanceAction(s, key, rng = neutral) { s=act(s,key,rng); return s.screen==='tournament'?finishTournament(s):s; }
test('regular selection is independent of school power; reserve can win, star can lose', () => {
 const reserve=fresh(); reserve.school.base=200;reserve.school.competition=200;reserve.teamwork=100;
 reserve.player={technique:20,stamina:20,spirit:20,fatigue:0};
 const a=judgeContest(reserve,always); assert.equal(a.role,'reserve');assert.equal(a.rank,0);assert.equal(a.personal,'none');
 const star=fresh();star.school.base=0;star.school.competition=0;star.teamwork=0;star.player={technique:200,stamina:200,spirit:200,fatigue:0};
 const b=judgeContest(star,{...never,int:a=>a});assert.equal(b.role,'regular');assert.equal(b.personal,'excellent');assert.equal(b.rank,4);
 reserve.tournaments=[a];earnTrophies(reserve);assert.ok(reserve.trophyIds.includes('reserveChampion'));
});
test('contest uses condition, skills and temporary support buff without altering player', () => {
 const s=fresh();s.school.base=120;s.school.competition=70;s.teamwork=70;s.player={technique:100,stamina:100,spirit:50,fatigue:0};
 const a=judgeContest(s,never); s.romance.dating=true;s.romance.type='support';
 const before=structuredClone(s.player);const b=judgeContest(s,never);assert.ok(b.supported);assert.deepEqual(s.player,before);
 s.player.fatigue=100;const c=judgeContest(s,never);assert.notEqual(c.critique,b.critique);assert.match(c.critique,/疲れ/);
 s.player.fatigue=0;s.skills=['focus','clutch','mood'];assert.ok(judgeContest(s,never).rank<=a.rank);
});
test('coach comments reflect actual weaknesses for all clubs, never formula output', () => {
 for(const [key,pattern] of [['technique',/基礎/],['stamina',/終盤/],['spirit',/硬く/]]){
  const s=fresh();s.teamwork=100;s.player={technique:150,stamina:150,spirit:150,fatigue:0};s.player[key]=0;
  assert.match(judgeContest(s,never).critique,pattern);
 }
 const s=fresh();s.teamwork=0;assert.match(judgeContest(s,never).critique,/噛み合う/);
 for(const club of ['野球部','吹奏楽部','美術部']) {s.school.club.name=club;const t=judgeContest(s,never);assert.ok(t.result&&t.personalLabel&&t.scene&&t.critique);}
});
test('social encounter boundary is 50%, seasonal encounters are low chance and no double roll', () => {
 for(const [value,expected] of [[.499,true],[.5,false]]) { const s=fresh();s.turn=3; const next=act(s,'social',createRandom(()=>value));assert.equal(next.met,expected);if(expected)assert.equal(next.affection,20); }
 const seasonal=fresh();seasonal.turn=3;relationshipAction(seasonal,'rest',createRandom(()=>.079),[]);assert.equal(seasonal.met,true);
 const none=fresh();none.turn=2;relationshipAction(none,'rest',always,[]);assert.equal(none.met,false);
});
test('three actions start dating, bonuses apply once for every type and no forced breakup', () => {
 for(const [id,type] of Object.entries(ROMANCE.types)){
  let s=fresh(id);s=advanceAction(s,'social',{...never,chance:p=>p===ROMANCE.encounter,pick:()=>id});
  assert.equal(s.affection,20);s=advanceAction(s,'date',never);assert.equal(s.affection,40);
  const before={...s.player};s=advanceAction(s,'date',{...never,chance:p=>p===ROMANCE.confessionChance});
  assert.equal(s.romance.dating,true);assert.equal(s.turn,4);assert.equal(s.affection,60);
  for(const [key,value] of Object.entries(type.bonus)) assert.equal(s.player[key],Math.max(0,before[key]+value+(key==='spirit'?2:0)));
  const after={...s.player};s=advanceAction(s,'date',never);
  assert.equal(s.player.technique,after.technique);assert.equal(s.player.spirit,after.spirit+2);
  for(let i=0;i<4;i++)s=advanceAction(s,'rest',never);
  assert.equal(s.romance.dating,true);assert.ok(s.trophyIds.includes('couple'));
 }
});
test('partner recurring effects: effort 30%, support recovery, free 20%/10%, special date awakening', () => {
 const s=fresh();s.met=true;s.romance.dating=true;s.romance.type='diligent';const tech=s.player.technique;
 relationshipAction(s,'basic',{...never,chance:p=>p===.3},[]);assert.equal(s.player.technique,tech+3);
 s.romance.type='support';s.player.fatigue=40;relationshipAction(s,'rest',always,[]);assert.equal(s.player.fatigue,32);
 s.romance.type='free';const spirit=s.player.spirit;relationshipAction(s,'rest',always,[]);assert.equal(s.player.spirit,spirit+5);
 relationshipAction(s,'rest',{...never,chance:p=>p!==.2},[]);assert.equal(s.player.spirit,spirit+2);
 relationshipAction(s,'date',always,[]);assert.equal(s.romance.freeAwakened,true);const once=s.player.technique;relationshipAction(s,'date',always,[]);assert.equal(s.player.technique,once);
});
test('rejection is optional, locks dates, practice can awaken once and earns adversity trophies', () => {
 let s=fresh();s.met=true;s.affection=40;s.romance.type='diligent';s=act(s,'date',never);
 assert.equal(s.romance.heartbroken,true);assert.equal(act(s,'date',always),s);assert.ok(s.trophyIds.includes('heartbreak'));
 s=advanceAction(s,'basic',always);assert.equal(s.romance.awakened,false);
 s=advanceAction(s,'basic',always);assert.equal(s.romance.awakened,true);assert.ok(s.trophyIds.includes('awakened'));
 const technique=s.player.technique;relationshipAction(s,'basic',always,[]);assert.equal(s.player.technique,technique);
 assert.match(romanceEnding(s).text,/叶わなかった/);
});
test('practice types award different permanent skills and skill effects apply next action', () => {
 const s=fresh();skillAction(s,'basic',always,[]);skillAction(s,'basic',always,[]);assert.ok(s.skills.includes('effort'));assert.ok(!s.skills.includes('focus'));
 skillAction(s,'basic',always,[]);assert.ok(s.skills.includes('iron'));
 const t=fresh();skillAction(t,'intensive',always,[]);skillAction(t,'intensive',always,[]);assert.ok(t.skills.includes('focus'));assert.ok(!t.skills.includes('effort'));
 const u=fresh();skillAction(u,'team',always,[]);skillAction(u,'team',always,[]);assert.ok(u.skills.includes('mood'));
 const n=fresh();n.skills=['effort','iron'];const plain=fresh();plain.school=structuredClone(n.school);const a=act(n,'basic',never);const b=act(plain,'basic',never);assert.equal(a.player.technique,b.player.technique+SKILLS.effort.technique);assert.ok(a.player.fatigue<b.player.fatigue);
 skillAction(s,'basic',always,[]);assert.equal(new Set(s.skills).size,s.skills.length);
});
test('post-dating memories produce special graduation ending and detailed persistent album', () => {
 let s=fresh();s.met=true;s.romance.type='diligent';s.romance.dating=true;s.romance.bonusApplied=true;s.affection=60;
 s=advanceAction(s,'date',always);s=advanceAction(s,'date',always);assert.equal(romanceEnding(s).special,true);
 while(s.screen==='training')s=advanceAction(s,'rest',never);
 while(s.screen==='epilogue')s=nextEpilogue(s);
 assert.equal(s.summary.results.length,6);assert.ok(s.summary.trophyIds.includes('ending'));
 let raw;const storage={getItem:()=>raw,setItem:(k,v)=>raw=v};saveResult(s.summary,storage);
 const html=render(null,loadHistory(storage));assert.match(html,/<details/);assert.match(html,/青春アルバム/);assert.match(html,/春の約束/);assert.match(html,/大会の記録/);
 const legacy=render(null,[{id:'old',school:'旧学校',club:'野球部',trophies:['青春の卒業証書']}]);assert.match(legacy,/旧バージョン/);
});
function seeded(seed) {return createRandom(()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;});}
test('100 full runs with same actions vary by gacha and events, all graduate with valid stats', () => {
 const signatures=new Set();
 for(let i=1;i<=100;i++){
  const rng=seeded(i);let s=begin(enroll(rng,'seed'+i));
  while(s.screen==='training')s=advanceAction(s,s.turn%4===0?'rest':'basic',rng);
  while(s.screen==='epilogue')s=nextEpilogue(s);
  assert.equal(s.screen,'graduation');assert.equal(s.tournaments.length,6);assert.ok(s.summary.trophyIds.includes('graduate'));
  for(const [key,value] of Object.entries(s.player))assert.ok(value>=0&&value<=(key==='fatigue'?100:200));
  signatures.add(JSON.stringify([s.school.base,s.tournaments.map(t=>t.result),s.skills]));
 }
 assert.ok(signatures.size>90);
});

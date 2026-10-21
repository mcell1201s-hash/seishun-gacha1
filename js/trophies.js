import { TROPHIES } from './config.js';
import { romanceEnding } from './relationships.js';
export function earnTrophies(s, graduation = false) {
  const definition = id => TROPHIES.find(t => t.id === id);
  const checks = {
    graduate: graduation,
    champion: s.tournaments.some(t => t.rank === 0),
    reserveChampion: s.tournaments.some(t => t.rank === 0 && t.role === 'reserve'),
    star: s.tournaments.some(t => t.personal === 'excellent'),
    growth: ['technique','stamina','spirit'].some(key => s.player[key] >= definition('growth').threshold),
    skills: s.skills.length >= definition('skills').threshold,
    couple: s.romance.bonusApplied,
    ending: graduation && romanceEnding(s).special,
    underdog: s.school.base <= definition('underdog').baseMax && s.tournaments.some(t => t.rank <= definition('underdog').rankMax),
    heartbreak: s.romance.heartbroken,
    awakened: s.romance.awakened,
    freeAwakened: s.romance.freeAwakened
  };
  for (const [id, earned] of Object.entries(checks)) if (earned && !s.trophyIds.includes(id)) s.trophyIds.push(id);
}
export function trophyDetails(ids) { return ids.map(id => TROPHIES.find(t => t.id === id)).filter(Boolean); }

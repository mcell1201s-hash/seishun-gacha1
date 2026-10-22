import { CONFIG } from "./config.js";
export function calendarFor(turn) {
  const year = Math.max(
    1,
    Math.min(3, CONFIG.yearStarts.filter((start) => turn >= start).length),
  );
  const local = turn - CONFIG.yearStarts[year - 1] + 1;
  const seasons = [
    "spring",
    "spring",
    "summer",
    "summer",
    "summer",
    "autumn",
    "autumn",
    "winter",
    "winter",
  ];
  return { turn, year, local, season: seasons[local - 1] || "summer" };
}
export const yearFor = (turn) => calendarFor(turn).year;
export function tournamentFor(turn) {
  return CONFIG.tournamentSchedule.find((round) => round.turn === turn);
}
export function nextTournament(turn) {
  return CONFIG.tournamentSchedule.find((round) => round.turn >= turn);
}

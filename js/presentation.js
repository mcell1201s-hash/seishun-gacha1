// Presentation-only manifest. Replace asset paths here without touching game rules.
export const PIXEL_ROOT = "assets/pixel/";
export const CLUB_ART = {
  野球部: {
    key: "baseball",
    color: "green",
    practice: "スイングを重ねよう",
    team: "みんなで声をつなごう",
  },
  吹奏楽部: {
    key: "band",
    color: "blue",
    practice: "一音ずつ、ていねいに",
    team: "みんなの音を合わせよう",
  },
  美術部: {
    key: "art",
    color: "pink",
    practice: "今日の一筆を重ねよう",
    team: "みんなの表現をつなごう",
  },
};
export const SEASONS = {
  spring: { label: "春", caption: "はじまりの風が吹く。", color: "pink" },
  summer: { label: "夏", caption: "まぶしい日々を、全力で。", color: "blue" },
  autumn: { label: "秋", caption: "少しずつ、実るもの。", color: "gold" },
  winter: { label: "冬", caption: "次の春へ、力をためて。", color: "navy" },
};
export function seasonFor(turn) {
  if (turn >= 23) return "spring";
  if (turn === 21) return "autumn";
  if (turn === 22) return "winter";
  return ["spring", "summer", "autumn", "winter"][
    Math.floor(((turn - 1) % 8) / 2)
  ];
}
export function art(name, cls = "", alt = "") {
  return `<img class="pixel ${cls}" src="${PIXEL_ROOT}${name}.svg" alt="${alt}" ${alt ? "" : 'aria-hidden="true"'} width="48" height="48">`;
}
export function clubArt(s) {
  return CLUB_ART[s.school.club.name];
}

import { CONTEST as C } from "./config.js";
const LINES = {
  fatigue: [
    "疲れが見えていた。休むことも、次の舞台への準備だ。",
    "力を出し切るためにも、直前のコンディションを整えよう。",
    "積み重ねた力を発揮できるよう、体をいたわりたいな。",
  ],
  teamwork: [
    "個々の力は悪くない。あとは噛み合うかどうかだ。",
    "仲間の動きに目を向けよう。連携を磨けば、もっとまとまる。",
    "自分の役割と仲間の役割を、練習でも確かめ合おう。",
  ],
  technique: [
    "基礎をもう一度磨こう。大事な場面ほど、積み重ねが出る。",
    "技術の精度を上げれば、自分の持ち味をもっと出せる。",
    "一つひとつの基本を確かめよう。焦らず技術を積み上げたい。",
  ],
  stamina: [
    "終盤まで勢いを保ちたいな。",
    "最後まで体の動きを保てるよう、基礎体力も育てよう。",
    "力を出し続けるために、体づくりを大切にしたい。",
  ],
  spirit: [
    "勝負どころで少し硬くなっていたようだ。",
    "本番で自分の力を信じる心も、練習で育てよう。",
    "落ち着いて舞台に向かえるよう、心の準備も重ねたい。",
  ],
  reserve: [
    "仲間を支える姿も見ている。持ち味を磨いて出番につなげよう。",
    "今回は控えだったが、日々の練習は次につながる。",
    "支える役割も大切だ。出場を狙うなら、基礎を積み重ねよう。",
  ],
  champion: [
    "頂点までたどり着いたな。自分たちの積み重ねを誇っていい。",
    "みんなでつかんだ一番だ。今日までの努力を忘れずにいよう。",
    "チームの力が結果になった。この経験は、きっと次の財産になる。",
  ],
  finalist: [
    "あと一歩だった。上位まで進んだ経験を次につなげよう。",
    "優勝争いの舞台を経験できた。その手応えも課題も持ち帰ろう。",
    "ここまで進んだ力はある。最後の差を、これからの糧にしよう。",
  ],
  learn: [
    "自分たちの持ち味と課題が見えた。次へ進もう。",
    "結果を受け止めて、次の練習で一つずつ取り組もう。",
    "届かなかった部分を、ここからの成長につなげよう。",
  ],
};
export function coachComment(s, { rank, role, buffs }, snapshot) {
  const weaknesses = ["technique", "stamina", "spirit"]
    .map((key) => ({
      key,
      gap: (C.critique[key] - buffs[key]) / C.critique[key],
    }))
    .filter((x) => x.gap > 0)
    .sort((a, b) => b.gap - a.gap);
  const reasons = [];
  if (s.player.fatigue >= C.critique.fatigue) reasons.push("fatigue");
  if (s.teamwork < C.critique.teamwork) reasons.push("teamwork");
  reasons.push(...weaknesses.map((w) => w.key));
  if (role === "reserve") reasons.push("reserve");
  const previous = s.tournaments.at(-1);
  // Rotate only among conditions that really apply, avoiding a single priority masking all others.
  const active = reasons.length
    ? reasons.filter((key) => key !== previous?.critiqueReason)
    : [];
  const reason =
    (active.length ? active : reasons)[0] ||
    (rank === 0 ? "champion" : rank === 1 ? "finalist" : "learn");
  const candidates = LINES[reason];
  const prior = s.tournaments.filter((t) => t.critiqueReason === reason).length;
  let text = candidates[prior % candidates.length];
  if (text === previous?.critique)
    text = candidates[(prior + 1) % candidates.length];
  if (previous?.snapshot) {
    const old = previous.snapshot;
    const order = { reserve: 0, substitute: 1, regular: 2 };
    if (order[role] > order[previous.role])
      text += " 前回より出場機会を広げられたな。";
    else if (
      s.teamwork >= C.critique.teamwork &&
      old.teamwork < C.critique.teamwork
    )
      text += " 前回より連携の課題を乗り越えてきたな。";
    else {
      const improved = ["technique", "stamina", "spirit"].find(
        (key) =>
          snapshot.player[key] >= old.player[key] + C.critique.improvement,
      );
      if (improved)
        text += {
          technique: " 前回から技術が育っている。",
          stamina: " 前回から体力がついてきた。",
          spirit: " 前回から心の強さが増している。",
        }[improved];
    }
  }
  return { text, reason };
}

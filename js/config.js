export const CONFIG = {
  turns: 24, trainingTurns: 20, yearStarts: [1, 9, 17],
  tournaments: [4, 8, 12, 16, 18, 20],
  recovery: { tournament: 15, year: 25 },
  fatigue: { medium: 60, high: 80, mediumMultiplier: .8, highMultiplier: .6 },
  injury: { normal: .02, medium: .08, high: .18, fatigue: 8, spirit: -3 },
  events: { positive: .18, negative: .12, encounter: .35 },
  environment: { minimumMultiplier: .8, rangeMultiplier: .4 },
  actions: {
    basic: { name: '基礎練習', icon: '🏃', hint: '技術 +5 / 体力 +2 / 疲労 +8', gains: { technique: 5, stamina: 2, fatigue: 8 }, practice: true },
    intensive: { name: '特訓', icon: '🔥', hint: '技術 +9 / 疲労 +20', gains: { technique: 9, fatigue: 20 }, practice: true },
    team: { name: 'チーム練習', icon: '🤝', hint: '技術 +3 / 精神 +2 / 連携 +2 / 疲労 +10', gains: { technique: 3, spirit: 2, teamwork: 2, fatigue: 10 }, practice: true },
    rest: { name: '休養', icon: '🌿', hint: '疲労 −30 / 精神 +3', gains: { fatigue: -30, spirit: 3 } },
    social: { name: '交流', icon: '💬', hint: '精神 +1 / 出会いのチャンス', gains: { spirit: 1 } },
    date: { name: 'デート', icon: '💗', hint: '好感度 +20 / 精神 +2', gains: { affection: 20, spirit: 2 } }
  },
  clubs: [
    { name: '野球部', icon: '⚾', tournament: '高校野球大会', message: '白球を追った一日。仲間の声がグラウンドに響いた。' },
    { name: '吹奏楽部', icon: '🎺', tournament: '吹奏楽コンクール', message: '最後の一音まで、みんなの呼吸が重なった。' },
    { name: '美術部', icon: '🎨', tournament: '高校美術展', message: '描き上げた作品を並べる。あの日の思いが色になった。' }
  ],
  aptitudes: [ { name: '技術への好奇心', stat: 'technique', multiplier: 1.1 }, { name: '体づくりが得意', stat: 'stamina', multiplier: 1.1 }, { name: '折れない心', stat: 'spirit', multiplier: 1.1 } ],
  epilogues: ['最後の大会が終わり、部活を引退した。後輩たちに、あなたの経験を手渡そう。', '放課後の教室。何気ない会話も、もうすぐ思い出になる。', '卒業式の予行。あの春から、ずいぶん遠くまで来た。', '卒業の日。選べなかった部活で、あなただけの青春を選んだ。']
};

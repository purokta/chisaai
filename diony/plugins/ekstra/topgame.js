/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .topgame — papan peringkat skor semua game Ekstra; .skorku untuk skor pribadi
const K = require('../../lib/praktis'), { B } = require('../../lib/style'), E = require('../../lib/ekstra')
module.exports = {
  name: 'topgame', alias: ['skorku', 'leaderboardgame', 'skorgame'], category: 'ekstra', noLimit: true, cmds: ['topgame', 'skorku'],
  desc: 'Papan peringkat game (anagram, kuis, mathrush, sambungkata) dan skor pribadi',
  run: async ({ m, command, reply }) => {
    if (command === 'skorku') {
      const g = K.get(m.sender, 'game', null); if (!g) return reply('Belum ada skor. Coba .anagram, .kuis, .mathrush, atau .sambungkata')
      const rank = E.top(1000).findIndex(x => x.jid === m.sender) + 1, nm = { anagram: 'Anagram', kuis: 'Kuis', mathrush: 'Math Rush', sambung: 'Sambung Kata' }
      return reply(`✦ ${B('SKORMU')}\n┣ Poin      : ${g.pts}\n┣ Kemenangan: ${g.win}\n┗ Peringkat : #${rank}\n\n` + Object.entries(g.by || {}).map(([k, v]) => `◇ ${nm[k] || k}: ${v}x menang`).join('\n'))
    }
    const t = E.top(10); if (!t.length) return reply('Belum ada skor. Coba .anagram, .kuis, .mathrush, atau .sambungkata')
    return reply(`✦ ${B('PERINGKAT GAME')}\n\n` + t.map((x, i) => `${E.medal(i)} *${x.name || x.jid.split('@')[0]}* — ${x.pts} poin (${x.win}x menang)`).join('\n') + `\n\n_Skor pribadi: .skorku_`)
  },
}

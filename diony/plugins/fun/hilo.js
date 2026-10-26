/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .hilo — Hi-Lo kartu: tebak kartu berikutnya lebih TINGGI atau lebih RENDAH. Tiap tebakan benar menambah streak.
//   .hilo            mulai   •  jawab langsung: tinggi / rendah   •  .hiloambil  bank poin (= streak)   •  .hilostop  menyerah
// Salah tebak = streak hangus. Kartu sama = seri (kartu baru). Poin masuk .topgame. 90 detik tanpa jawaban = berakhir.
const E = require('../../lib/ekstra'), { B } = require('../../lib/style')
const games = new Map()
const RANK = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'], SUIT = ['♠', '♥', '♦', '♣']
const draw = () => ({ r: Math.floor(Math.random() * 13), s: SUIT[Math.floor(Math.random() * 4)] })
const show = (c) => `[ ${RANK[c.r]}${c.s} ]`
const kill = (k) => { const g = games.get(k); if (g) clearTimeout(g.tm); games.delete(k) }
const arm = (sock, chat, k) => { const g = games.get(k); clearTimeout(g.tm); g.tm = setTimeout(() => { if (games.get(k) === g) { games.delete(k); sock.sendMessage(chat, { text: `Hi-Lo berakhir (tidak ada jawaban). Streak ${g.streak} hangus.` }).catch(() => {}) } }, 90000) }
const ANS = { tinggi: 1, atas: 1, naik: 1, high: 1, higher: 1, 'lebih tinggi': 1, rendah: -1, bawah: -1, turun: -1, low: -1, lower: -1, 'lebih rendah': -1 }
module.exports = {
  name: 'hilo', alias: ['hiloambil', 'hilostop', 'higherlower'], category: 'fun', noLimit: true, cmds: ['hilo', 'hiloambil', 'hilostop'],
  desc: 'Hi-Lo kartu: tebak tinggi/rendah, kumpulkan streak (.hilo, .hiloambil, .hilostop)',
  run: async ({ sock, m, command, reply, prefix }) => {
    const k = m.chat + '|' + m.sender, g = games.get(k)
    if (command === 'hiloambil') {
      if (!g) return reply(`Tidak ada permainan. Mulai: ${prefix}hilo`)
      if (!g.streak) return reply('Streak masih 0, tebak dulu satu kartu.')
      kill(k); const sc = E.addScore(m.sender, m.pushName, g.streak, 'hilo')
      return reply(`✦ Poin diambil! Streak *${g.streak}* → +${g.streak} poin (total ${sc.pts})`)
    }
    if (command === 'hilostop') { if (!g) return reply('Tidak ada permainan.'); kill(k); return reply(`Menyerah. Streak ${g.streak} hangus.`) }
    if (g) return reply(`${B('HI-LO')}\nKartu sekarang ${show(g.card)}  •  streak *${g.streak}*\nJawab: *tinggi* atau *rendah*`)
    const ng = { card: draw(), streak: 0 }; games.set(k, ng); arm(sock, m.chat, k)
    return reply(`${B('HI-LO')} • ${m.pushName || 'Pemain'}\n━━━━━━━━━━━━━━━━━━━━\nKartu sekarang ${show(ng.card)}\nBerikutnya lebih *tinggi* atau *rendah*?\n\n_2 terendah, A tertinggi • ${prefix}hiloambil untuk bank poin_`)
  },
  before: async ({ sock, m, budy, reply }) => {
    const k = m.chat + '|' + m.sender, g = games.get(k); if (!g || !budy) return false
    const guess = ANS[budy.trim().toLowerCase()]; if (!guess) return false
    const nx = draw()
    if (nx.r === g.card.r) { g.card = nx; arm(sock, m.chat, k); await reply(`Seri! Kartu baru ${show(nx)}. Tebak lagi: *tinggi* / *rendah*`); return true }
    if ((nx.r > g.card.r ? 1 : -1) === guess) {
      g.streak++; const prev = g.card; g.card = nx; arm(sock, m.chat, k)
      await reply(`✦ Benar! ${show(prev)} → ${show(nx)}\nStreak *${g.streak}*\nLanjut (*tinggi*/*rendah*) atau *.hiloambil* untuk ambil ${g.streak} poin.`); return true
    }
    kill(k); await reply(`✕ Salah! ${show(g.card)} → ${show(nx)}\nStreak ${g.streak} hangus. Main lagi: .hilo`); return true
  },
}

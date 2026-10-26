/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .tebakwarna — bot menampilkan kotak warna, tebak NAMA warnanya. Jawab langsung di chat. Menang = skor + gold RPG.
//   .tebakwarna petunjuk   .tebakwarna nyerah
const K2 = require('../../lib/kreasi2'), E = require('../../lib/ekstra'), R = require('../../lib/rpg'), ST = require('../../lib/style')
const LIST = [
  ['#e53935', ['merah']], ['#1e66f5', ['biru']], ['#2e9e4f', ['hijau']], ['#ffd600', ['kuning']], ['#fb8c00', ['oranye', 'jingga']], ['#8e24aa', ['ungu']], ['#ff5fa2', ['pink', 'merah muda']],
  ['#6d4c41', ['coklat', 'cokelat']], ['#9e9e9e', ['abu abu', 'abu', 'abuabu']], ['#111111', ['hitam']], ['#1abc9c', ['tosca']], ['#d4af37', ['emas']], ['#f5e6c8', ['krem']], ['#7b1f2b', ['marun']],
  ['#3f3d9c', ['nila']], ['#c8a2e8', ['lila', 'lavender']], ['#7fc8f8', ['biru langit']], ['#14377d', ['biru laut', 'navy', 'biru tua']], ['#a5e887', ['hijau muda']], ['#1b5e20', ['hijau tua']],
  ['#fa8072', ['salmon']], ['#a8ecc8', ['mint']], ['#b6f500', ['hijau limau', 'limau', 'lime']], ['#808000', ['zaitun']], ['#00bcd4', ['aqua', 'cyan']], ['#ffcba4', ['peach']], ['#d81b84', ['magenta']],
]
const games = new Map()
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim()
const stop = (c) => { const g = games.get(c); if (g) clearTimeout(g.timer); games.delete(c) }
const mask = (w) => w.split('').map((c, i) => (c === ' ' || i === 0) ? c : '_').join(' ')

module.exports = {
  name: 'tebakwarna', alias: ['warnagame', 'namawarna'], category: 'fun', cmds: ['tebakwarna'],
  desc: 'Tebak nama warna dari kotak warna (menang dapat skor dan gold RPG)',
  run: async ({ sock, m, args, reply, prefix }) => {
    const sub = String(args[0] || '').toLowerCase(), g = games.get(m.chat)
    if (sub === 'nyerah') { if (!g) return reply('Tidak ada soal yang berjalan.'); stop(m.chat); return reply(`Menyerah? Warnanya *${g.names[0]}* (${g.hex})`) }
    if (sub === 'petunjuk') { if (!g) return reply('Tidak ada soal yang berjalan.'); return reply(`Petunjuk: ${mask(g.names[0])}`) }
    if (g) return reply(`Masih ada soal yang berjalan. Jawab dulu, atau ketik ${prefix}tebakwarna nyerah`)
    const [hex, names] = E.rnd(LIST), ng = { hex, names }
    ng.timer = setTimeout(() => { if (games.get(m.chat) === ng) { games.delete(m.chat); sock.sendMessage(m.chat, { text: `Waktu habis! Warnanya *${names[0]}* (${hex})` }).catch(() => {}) } }, 40000)
    games.set(m.chat, ng)
    await sock.sendMessage(m.chat, { image: await K2.swatch(hex), caption: `${ST.B('TEBAK WARNA')}\n━━━━━━━━━━━━━━━━━━━━\nApa nama warna ini? (nama umum bahasa Indonesia)\n\nWaktu 40 detik  •  Hadiah 100 gold + 10 poin\n_${prefix}tebakwarna petunjuk / nyerah_` }, { quoted: m })
  },
  before: async ({ sock, m, budy }) => {
    const g = games.get(m.chat); if (!g || !budy) return false
    const a = norm(budy); if (!g.names.some(n => norm(n) === a)) return false
    stop(m.chat)
    E.addScore(m.sender, m.pushName, 10, 'tebakwarna')
    const u = R.get(m.sender); let bonus = ''
    if (u) { const got = R.addGold(u, 100); R.save(); bonus = `\n+${R.fmt(got)} gold RPG` }
    await sock.sendMessage(m.chat, { text: `Benar! @${m.sender.split('@')[0]} menjawab *${g.names[0]}* (${g.hex})\n+10 poin game${bonus}`, mentions: [m.sender] }, { quoted: m })
    return true
  },
}

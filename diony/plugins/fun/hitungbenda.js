/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .hitungbenda — bot menggambar bentuk warna-warni acak; hitung jumlah semuanya, ketik angkanya. Yang pertama tepat menang.
//   .hitungbenda nyerah
const K2 = require('../../lib/kreasi2'), E = require('../../lib/ekstra'), R = require('../../lib/rpg'), ST = require('../../lib/style')
const games = new Map()
const stop = (c) => { const g = games.get(c); if (g) clearTimeout(g.timer); games.delete(c) }

module.exports = {
  name: 'hitungbenda', alias: ['hitunggambar', 'countgame', 'berapabenda'], category: 'fun', cmds: ['hitungbenda'],
  desc: 'Hitung jumlah bentuk di gambar acak buatan bot (menang dapat skor dan gold RPG)',
  run: async ({ sock, m, args, reply, prefix }) => {
    const g = games.get(m.chat)
    if (String(args[0] || '').toLowerCase() === 'nyerah') { if (!g) return reply('Tidak ada soal yang berjalan.'); stop(m.chat); return reply(`Menyerah? Jumlahnya *${g.n}*`) }
    if (g) return reply(`Masih ada soal yang berjalan. Ketik angkanya, atau ${prefix}hitungbenda nyerah`)
    const lvl = ['mudah', 'sedang', 'sulit'].indexOf(String(args[0] || '').toLowerCase()), n0 = [12, 20, 32][lvl < 0 ? 1 : lvl]
    const want = n0 + Math.floor(Math.random() * 6), { buf, count } = await K2.shapesImage(want, String(Date.now()))
    const ng = { n: count }
    ng.timer = setTimeout(() => { if (games.get(m.chat) === ng) { games.delete(m.chat); sock.sendMessage(m.chat, { text: `Waktu habis! Jumlahnya *${ng.n}*` }).catch(() => {}) } }, 45000)
    games.set(m.chat, ng)
    await sock.sendMessage(m.chat, { image: buf, caption: `${ST.B('HITUNG BENDA')}\n━━━━━━━━━━━━━━━━━━━━\nAda berapa bentuk (lingkaran, kotak, segitiga) di gambar ini?\nKetik angkanya saja.\n\nWaktu 45 detik  •  Hadiah 100 gold + 10 poin\n_Tingkat: ${prefix}hitungbenda mudah|sedang|sulit_` }, { quoted: m })
  },
  before: async ({ sock, m, budy }) => {
    const g = games.get(m.chat); if (!g || !budy || !/^\d{1,3}$/.test(budy.trim())) return false
    if (parseInt(budy, 10) !== g.n) return false
    stop(m.chat)
    E.addScore(m.sender, m.pushName, 10, 'hitungbenda')
    const u = R.get(m.sender); let bonus = ''
    if (u) { const got = R.addGold(u, 100); R.save(); bonus = `\n+${R.fmt(got)} gold RPG` }
    await sock.sendMessage(m.chat, { text: `Benar! @${m.sender.split('@')[0]} menghitung *${g.n}* bentuk.\n+10 poin game${bonus}`, mentions: [m.sender] }, { quoted: m })
    return true
  },
}

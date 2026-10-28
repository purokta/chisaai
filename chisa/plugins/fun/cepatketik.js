/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .cepatketik — bot mengirim kalimat; orang pertama yang mengetik PERSIS sama menang. Waktu dan kecepatan (kata per menit) dicatat.
//   .cepatketik [mudah|sedang|sulit]   .cepatketik nyerah
const E = require('../../lib/ekstra'), R = require('../../lib/rpg'), ST = require('../../lib/style')
const SENT = {
  mudah: ['kucing duduk di atas meja', 'hari ini cuaca sangat cerah', 'saya suka makan nasi goreng', 'adik bermain bola di lapangan', 'ibu membeli sayur di pasar', 'burung terbang tinggi di langit'],
  sedang: ['bot chisa ai siap melayani semua perintahmu', 'kecepatan mengetik melatih ketelitian jari', 'matahari terbit dari timur dan terbenam di barat', 'belajar sedikit setiap hari lebih baik daripada sekaligus', 'kopi hangat menemani malam yang panjang', 'jangan menunda pekerjaan yang bisa selesai sekarang'],
  sulit: ['pak budi berangkat ke bandung naik kereta api pukul enam pagi', 'seekor kelinci putih melompati pagar kayu sambil membawa tiga wortel', 'keberhasilan adalah hasil dari kerja keras, ketekunan, dan doa', 'dalam keheningan malam, terdengar suara jangkrik dari kejauhan', 'perjalanan seribu mil dimulai dari satu langkah kecil'],
}
const games = new Map()
const stop = (c) => { const g = games.get(c); if (g) clearTimeout(g.timer); games.delete(c) }
const same = (a, b) => String(a).trim().toLowerCase().replace(/\s+/g, ' ') === String(b).trim().toLowerCase().replace(/\s+/g, ' ')

module.exports = {
  name: 'cepatketik', alias: ['typerace', 'ketikcepat', 'adumengetik'], category: 'fun', cmds: ['cepatketik'],
  desc: 'Adu cepat mengetik kalimat dari bot; yang pertama persis sama menang (mudah/sedang/sulit)',
  run: async ({ sock, m, args, reply, prefix }) => {
    const sub = String(args[0] || '').toLowerCase(), g = games.get(m.chat)
    if (sub === 'nyerah') { if (!g) return reply('Tidak ada soal yang berjalan.'); stop(m.chat); return reply('Dibatalkan. Tidak ada pemenang.') }
    if (g) return reply(`Masih ada soal yang berjalan. Ketik kalimatnya, atau ${prefix}cepatketik nyerah`)
    const lvl = SENT[sub] ? sub : 'sedang', s = E.rnd(SENT[lvl]), ng = { s, lvl, t0: 0 }
    games.set(m.chat, ng)
    await sock.sendMessage(m.chat, { text: `${ST.B('CEPAT KETIK')} (${lvl})\n━━━━━━━━━━━━━━━━━━━━\nOrang pertama yang mengetik kalimat ini PERSIS sama menang. Huruf besar-kecil boleh bebas.\n\n> ${s}\n\nWaktu 60 detik  •  Poin ${{ mudah: 5, sedang: 10, sulit: 15 }[lvl]}\n_Tingkat: ${prefix}cepatketik mudah|sedang|sulit_` }, { quoted: m })
    ng.t0 = Date.now()
    ng.timer = setTimeout(() => { if (games.get(m.chat) === ng) { games.delete(m.chat); sock.sendMessage(m.chat, { text: 'Waktu habis! Tidak ada yang berhasil.' }).catch(() => {}) } }, 60000)
  },
  before: async ({ sock, m, budy }) => {
    const g = games.get(m.chat); if (!g || !g.t0 || !budy || !same(budy, g.s)) return false
    const sec = Math.max(0.5, (Date.now() - g.t0) / 1000)
    stop(m.chat)
    const wpm = Math.round((g.s.split(' ').length / sec) * 60), pts = { mudah: 5, sedang: 10, sulit: 15 }[g.lvl]
    E.addScore(m.sender, m.pushName, pts, 'cepatketik')
    const u = R.get(m.sender); let bonus = ''
    if (u) { const got = R.addGold(u, pts * 10); R.save(); bonus = `\n+${R.fmt(got)} gold RPG` }
    await sock.sendMessage(m.chat, { text: `Selesai! @${m.sender.split('@')[0]} menang dalam *${sec.toFixed(1)} detik* (${wpm} kata/menit)\n+${pts} poin game${bonus}`, mentions: [m.sender] }, { quoted: m })
    return true
  },
}

/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .siapakahaku — teka-teki "Siapakah / apakah aku?" dengan 3 petunjuk bertahap. Jawab langsung di chat. Makin sedikit petunjuk, makin besar poin.
//   .siapakahaku petunjuk   .siapakahaku nyerah
const E = require('../../lib/ekstra'), R = require('../../lib/rpg'), ST = require('../../lib/style')
const Q = [
  [['bulan'], ['Aku muncul di langit malam', 'Bentukku berubah dari sabit sampai purnama', 'Aku mengorbit Bumi']],
  [['payung'], ['Aku dipakai saat hujan', 'Aku bisa dibuka dan ditutup', 'Gagangku dipegang, kainku di atas kepala']],
  [['cermin'], ['Aku bisa meniru gerakanmu tanpa suara', 'Aku terbuat dari kaca', 'Kamu melihat wajahmu di diriku']],
  [['jam', 'jam dinding'], ['Aku punya jarum tapi tidak menjahit', 'Aku berputar tanpa pernah pergi', 'Aku menunjukkan waktu']],
  [['kunci'], ['Aku kecil tapi menjaga rumahmu', 'Aku punya gerigi', 'Aku dimasukkan ke lubang untuk membuka pintu']],
  [['bayangan'], ['Aku selalu mengikutimu', 'Aku hilang saat gelap total', 'Aku muncul saat ada cahaya menimpa badanmu']],
  [['telur'], ['Aku harus dipecahkan sebelum dipakai', 'Aku bisa digoreng, direbus, atau didadar', 'Dari diriku bisa lahir anak ayam']],
  [['buku'], ['Aku punya halaman tapi bukan situs web', 'Aku punya punggung tapi tak bisa berdiri sendiri', 'Isiku bisa kamu baca']],
  [['api'], ['Aku butuh udara untuk hidup', 'Aku panas dan bercahaya', 'Aku bisa memasak dan juga membakar']],
  [['es', 'es batu'], ['Aku air yang membeku', 'Aku dingin dan keras', 'Aku mencair saat dipanaskan']],
  [['pelangi'], ['Aku muncul setelah hujan reda', 'Aku punya banyak warna', 'Aku melengkung di langit, jumlah warnaku tujuh']],
  [['gunung'], ['Aku tinggi dan sulit didaki', 'Kadang puncakku berselimut salju', 'Ada yang bisa meletus dan mengeluarkan lahar']],
  [['kamera'], ['Aku menangkap momen', 'Aku punya lensa', 'Hasilku adalah foto']],
  [['sepatu'], ['Aku berpasangan', 'Aku melindungi kakimu', 'Aku punya tali dan sol']],
  [['bantal'], ['Aku empuk', 'Aku menemani tidurmu', 'Kepalamu bersandar padaku']],
  [['listrik'], ['Aku tidak terlihat tapi bisa menyalakan lampu', 'Aku mengalir lewat kabel', 'Aku bisa menyengat kalau kamu ceroboh']],
  [['lampu'], ['Aku mengusir gelap', 'Aku punya saklar', 'Aku bersinar saat dialiri listrik']],
  [['sendok'], ['Aku ada di meja makan', 'Aku berbentuk cekung kecil', 'Aku membawa sup ke mulutmu']],
  [['sepeda'], ['Aku punya dua roda', 'Aku bergerak karena kamu mengayuh', 'Aku tidak butuh bensin']],
  [['pensil'], ['Aku bisa dihapus jejakku', 'Aku semakin pendek kalau diraut', 'Aku menulis dengan grafit']],
  [['garam'], ['Aku putih dan berbutir', 'Aku datang dari laut', 'Tanpa aku masakan terasa hambar']],
  [['kopi'], ['Aku pahit tapi dicari banyak orang', 'Aku sering diminum pagi hari', 'Ada yang menyebutku penyelamat kantuk']],
  [['kalender'], ['Aku punya banyak angka', 'Aku menggantung di dinding atau berdiri di meja', 'Aku menunjukkan hari dan tanggal']],
  [['gitar'], ['Aku punya senar', 'Aku dipetik atau dipukul', 'Aku punya lubang suara di badanku']],
  [['tangga'], ['Aku punya banyak anak', 'Aku membantumu naik', 'Aku bisa dari kayu, besi, atau beton']],
  [['laut', 'samudra'], ['Aku luas dan asin', 'Aku punya ombak', 'Kapal berlayar di atasku']],
  [['hujan'], ['Aku jatuh dari awan', 'Aku membuat tanah basah', 'Kadang aku datang bersama petir']],
  [['kuku'], ['Aku tumbuh terus tapi dipotong', 'Aku ada di ujung jari', 'Aku bisa dicat warna-warni']],
  [['sumur'], ['Aku dalam dan berisi air', 'Timba turun ke dalamku', 'Aku dibuat dengan menggali tanah']],
  [['peta'], ['Aku menunjukkan jalan', 'Aku berisi gambar daratan dan laut', 'Aku dipakai untuk menemukan lokasi']],
]
const games = new Map()
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim()
const stop = (c) => { const g = games.get(c); if (g) clearTimeout(g.timer); games.delete(c) }
const clues = (g) => g.q[1].slice(0, g.step).map((c, i) => `${i + 1}. ${c}`).join('\n')

module.exports = {
  name: 'siapakahaku', alias: ['apakahaku', 'tekateki', 'riddle'], category: 'fun', cmds: ['siapakahaku'],
  desc: 'Teka-teki "Siapakah aku?" dengan petunjuk bertahap (poin lebih besar kalau petunjuk sedikit)',
  run: async ({ sock, m, args, reply, prefix }) => {
    const sub = String(args[0] || '').toLowerCase(), g = games.get(m.chat)
    if (sub === 'nyerah') { if (!g) return reply('Tidak ada soal yang berjalan.'); stop(m.chat); return reply(`Menyerah? Jawabannya *${g.q[0][0]}*`) }
    if (sub === 'petunjuk') {
      if (!g) return reply('Tidak ada soal yang berjalan.')
      if (g.step >= 3) return reply('Petunjuk sudah habis. Jawab, atau ' + prefix + 'siapakahaku nyerah')
      g.step++; return reply(`${ST.B('PETUNJUK')} ${g.step}/3\n${clues(g)}`)
    }
    if (g) return reply(`Masih ada soal yang berjalan.\n${clues(g)}\n\n_${prefix}siapakahaku petunjuk / nyerah_`)
    const ng = { q: E.rnd(Q), step: 1 }
    ng.timer = setTimeout(() => { if (games.get(m.chat) === ng) { games.delete(m.chat); sock.sendMessage(m.chat, { text: `Waktu habis! Jawabannya *${ng.q[0][0]}*` }).catch(() => {}) } }, 90000)
    games.set(m.chat, ng)
    await sock.sendMessage(m.chat, { text: `${ST.B('SIAPAKAH AKU?')}\n━━━━━━━━━━━━━━━━━━━━\n${clues(ng)}\n\nJawab langsung di chat • 90 detik\nPoin: 15 (1 petunjuk), 10 (2), 5 (3)\n_${prefix}siapakahaku petunjuk / nyerah_` }, { quoted: m })
  },
  before: async ({ sock, m, budy }) => {
    const g = games.get(m.chat); if (!g || !budy || budy.length > 40) return false
    const a = norm(budy); if (!g.q[0].some(x => norm(x) === a)) return false
    stop(m.chat)
    const pts = [15, 10, 5][g.step - 1] || 5
    E.addScore(m.sender, m.pushName, pts, 'siapakahaku')
    const u = R.get(m.sender); let bonus = ''
    if (u) { const got = R.addGold(u, pts * 8); R.save(); bonus = `\n+${R.fmt(got)} gold RPG` }
    await sock.sendMessage(m.chat, { text: `Benar! @${m.sender.split('@')[0]} menjawab *${g.q[0][0]}*\n+${pts} poin game${bonus}`, mentions: [m.sender] }, { quoted: m })
    return true
  },
}

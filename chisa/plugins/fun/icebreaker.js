/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Icebreaker & teka-teki. Jawaban teka-teki dikenali OTOMATIS dari chat biasa (hook before), tanpa perlu command.
//   .topik [santai|seru|dalam|kerja]   topik obrolan pemecah suasana
//   .teka                              teka-teki acak; jawab langsung lewat chat biasa
//   .tekamenyerah                      tampilkan jawabannya
const { B } = require('../../lib/style')
const pick = (a) => a[Math.floor(Math.random() * a.length)]
const TOPIK = {
  santai: ['Makanan apa yang tidak pernah bikin kamu bosan?', 'Lagu apa yang lagi sering kamu putar minggu ini?', 'Kalau hari ini libur total, kamu bakal ngapain?', 'Minuman favoritmu saat hujan apa?', 'Film atau series terakhir yang kamu tonton, worth it nggak?', 'Kebiasaan kecilmu yang aneh tapi bikin nyaman apa?'],
  seru: ['Kalau bisa punya satu kekuatan super, kamu pilih apa?', 'Kamu lebih pilih bisa terbang atau bisa menghilang? Kenapa?', 'Kalau harus hidup di satu negara selama setahun, pilih mana?', 'Hewan apa yang paling cocok jadi maskot grup ini?', 'Kalau kamu jadi tokoh anime, kamu ingin jadi siapa?', 'Makanan apa yang kamu rela makan seumur hidup, tapi cuma itu?'],
  dalam: ['Apa hal kecil yang akhir-akhir ini bikin kamu bersyukur?', 'Pelajaran terbesar yang kamu dapat tahun ini apa?', 'Kalau bisa memberi nasihat ke dirimu 5 tahun lalu, apa isinya?', 'Apa satu hal yang ingin kamu coba sebelum tahun ini habis?', 'Siapa orang yang paling berpengaruh dalam hidupmu, dan kenapa?', 'Apa definisi "cukup" menurutmu?'],
  kerja: ['Tools atau aplikasi apa yang paling menghemat waktumu?', 'Tips produktif yang benar-benar berhasil buatmu apa?', 'Pekerjaan impian kecilmu waktu SD itu apa?', 'Skill baru apa yang ingin kamu pelajari tahun ini?', 'Kalau bisa ganti satu hal di rutinitas kerja/belajarmu, apa?', 'Kamu tim begadang atau tim bangun pagi?'],
}
const TEKA = [
  ['Apa yang makin diambil makin besar?', ['lubang']], ['Benda apa yang punya gigi tapi tidak bisa menggigit?', ['sisir']],
  ['Aku punya kota tanpa rumah, hutan tanpa pohon, dan sungai tanpa air. Apakah aku?', ['peta']], ['Apa yang bisa berlari tapi tidak punya kaki?', ['air', 'sungai']],
  ['Semakin dikeringkan semakin basah. Apa itu?', ['handuk']], ['Apa yang selalu datang tapi tidak pernah tiba?', ['besok', 'hari esok']],
  ['Punya kepala dan ekor tapi tidak punya badan. Apa itu?', ['koin', 'uang koin', 'uang logam']], ['Apa yang ada di tengah-tengah kata "Paris"?', ['r', 'huruf r']],
  ['Semakin tinggi aku, semakin pendek aku. Apakah aku?', ['lilin']], ['Benda apa yang harus dipecahkan dulu baru bisa dipakai?', ['telur']],
  ['Apa yang bisa dipecahkan tanpa disentuh?', ['janji']], ['Punya jarum tapi tidak menjahit, punya angka tapi bukan buku. Apa itu?', ['jam']],
  ['Apa yang naik terus tapi tidak pernah turun?', ['umur', 'usia']], ['Aku selalu mengikutimu saat ada cahaya dan hilang saat gelap. Apakah aku?', ['bayangan']],
  ['Pagi berkaki empat, siang berkaki dua, sore berkaki tiga. Siapa dia?', ['manusia']], ['Apa yang bisa keliling dunia tapi tetap diam di pojok?', ['perangko', 'prangko']],
  ['Ringan seperti bulu, tapi orang kuat pun tak sanggup menahannya lebih dari beberapa menit. Apa itu?', ['napas', 'nafas']],
]
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
const live = new Map()   // chat -> { q, a, at }
const TTL = 5 * 60000

module.exports = {
  name: 'topik', alias: ['icebreaker', 'teka', 'tekamenyerah'], category: 'fun', noLimit: true, cmds: ['topik', 'teka', 'tekamenyerah'],
  desc: 'Topik pemecah suasana dan teka-teki (jawab lewat chat biasa, tanpa command)',
  run: async ({ m, command, args, prefix, reply }) => {
    if (command === 'tekamenyerah') {
      const s = live.get(m.chat); if (!s || Date.now() - s.at > TTL) return reply(`Tidak ada teka-teki aktif. Mulai dengan ${prefix}teka`)
      live.delete(m.chat); return reply(`🏳️ Jawabannya: *${s.a[0]}*`)
    }
    if (command === 'teka' || command === 'tekateki') {
      const old = live.get(m.chat); if (old && Date.now() - old.at <= TTL) return reply(`🧩 ${B('TEKA-TEKI AKTIF')}\n${old.q}\n\n_Jawab langsung lewat chat, atau ${prefix}tekamenyerah._`)
      const [q, a] = pick(TEKA); live.set(m.chat, { q, a, at: Date.now() })
      return reply(`🧩 ${B('TEKA-TEKI')}\n${q}\n\n_Jawab langsung lewat chat (tanpa command). Menyerah? ${prefix}tekamenyerah_`)
    }
    const k = String(args[0] || '').toLowerCase(), key = TOPIK[k] ? k : pick(Object.keys(TOPIK))
    return reply(`💬 ${B('TOPIK OBROLAN')} — ${key}\n${pick(TOPIK[key])}\n\n_Kategori: ${Object.keys(TOPIK).join(' • ')}_`)
  },
  before: async ({ m, budy, sock }) => {
    const s = live.get(m.chat); if (!s) return false
    if (Date.now() - s.at > TTL) { live.delete(m.chat); return false }
    const t = norm(budy); if (!t || t.length > 40) return false
    if (!s.a.some(a => t === a || (a.length > 2 && new RegExp(`(^| )${a}( |$)`).test(t)))) return false
    live.delete(m.chat)
    await sock.sendMessage(m.chat, { text: `🎉 Benar, @${m.sender.split('@')[0]}! Jawabannya *${s.a[0]}*.`, mentions: [m.sender] }, { quoted: m }).catch(() => {})
    return true
  },
}

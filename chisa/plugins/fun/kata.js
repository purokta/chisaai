/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kumpulan kata acak: fakta unik, pantun, gombalan, kata bijak, receh
//   .fakta  .pantun  .gombal  .bijak  .receh
// Menambah isi: tambahkan satu baris di array yang sesuai.
const ST = require('../../lib/style')
const pick = (a) => a[Math.floor(Math.random() * a.length)]
const H = (t) => `${ST.B(t)}\n━━━━━━━━━━━━━━━━━━━━\n`

const FAKTA = [
  'Madu yang disimpan dengan baik hampir tidak pernah basi. Madu berusia ribuan tahun dari makam kuno masih ditemukan layak makan.',
  'Gurita punya tiga jantung: dua memompa darah ke insang, satu ke seluruh tubuh.',
  'Pisang secara botani termasuk beri, sedangkan stroberi bukan.',
  'Sehari di planet Venus lebih lama daripada setahun di Venus.',
  'Jerapah dan manusia sama-sama punya tujuh tulang di leher.',
  'Kuku tumbuh sekitar tiga milimeter per bulan, lebih cepat di jari tengah dibanding jempol.',
  'Kamu tidak bisa bersin dengan mata terbuka lebar; refleks tubuh menutupnya otomatis.',
  'Cahaya Matahari butuh sekitar delapan menit untuk sampai ke Bumi.',
  'Kupu-kupu mencicipi rasa dengan kakinya.',
  'Hiu sudah ada lebih lama daripada pohon, sekitar 400 juta tahun lalu.',
  'Otak manusia memakai sekitar 20 persen energi tubuh walau beratnya hanya sekitar 2 persen.',
  'Wombat adalah satu-satunya hewan yang kotorannya berbentuk kubus.',
]
const PANTUN = [
  'Pergi ke pasar membeli kain,\nKain dipotong jadi selendang.\nBelajar sabar itu tak main-main,\nHasilnya manis datang kemudian.',
  'Buah mangga di atas meja,\nDipetik pagi dari halaman.\nJangan lelah berusaha, kawan,\nSukses datang pada yang bertahan.',
  'Burung camar terbang tinggi,\nHinggap sebentar di tepi dermaga.\nRajin belajar sepenuh hati,\nMasa depan cerah menanti kita.',
  'Anak ayam turun sepuluh,\nMati satu tinggal sembilan.\nJangan malu untuk bertanya penuh,\nKarena ilmu tak kenal kesombongan.',
  'Pagi hari minum kopi hangat,\nDitemani roti dan secangkir susu.\nSenyum dulu sebelum beraktivitas,\nHati riang, hari pun merdu.',
  'Kalau ada sumur di ladang,\nBoleh kita menumpang mandi.\nKalau ada waktu yang lapang,\nMari kita saling mengunjungi.',
]
const GOMBAL = [
  'Kamu itu kayak Wi-Fi, kalau dekat hatiku langsung tenang.',
  'Kalau kamu jadi kode, aku rela debug seumur hidup.',
  'Aku bukan bot, tapi kalau soal kamu, aku selalu siap dipanggil kapan saja.',
  'Kamu tahu bedanya kamu dan baterai? Baterai bisa habis, perhatianku buat kamu enggak.',
  'Kamu pasti kopi ya, soalnya bikin aku melek terus mikirin kamu.',
  'Kalau kamu hilang dari chat, rasanya kayak server down.',
  'Bukan hanya sinyal yang kucari, tapi juga sinyal darimu.',
  'Denganmu, loading terlama pun terasa sebentar.',
]
const BIJAK = [
  'Mulailah dari yang kecil dan konsisten; besar itu hanya kumpulan kecil yang tidak berhenti.',
  'Kesalahan adalah guru yang paling jujur, asal mau mendengarkan.',
  'Orang yang tenang bukan yang tak punya masalah, tapi yang tahu urutan menyelesaikannya.',
  'Jangan membandingkan babak awalmu dengan babak akhir orang lain.',
  'Waktu terbaik menanam pohon adalah dua puluh tahun lalu; waktu terbaik berikutnya adalah sekarang.',
  'Istirahat itu bagian dari perjalanan, bukan penyimpangan.',
  'Yang kamu ulang setiap hari pelan-pelan akan menjadi dirimu.',
  'Bertanya sebentar membuatmu tampak ragu, tak bertanya membuatmu tersesat lama.',
]
const RECEH = [
  'Kenapa ayam nyeberang jalan? Karena nggak ada jembatan penyeberangan buat ayam.',
  'Sapi apa yang paling pintar? Sapi-ens.',
  'Kenapa komputer sering sakit? Karena banyak virus dan kurang vitamin RAM.',
  'Apa bedanya kamu dan buku? Buku ada daftar isinya, kamu isinya nggak jelas.',
  'Ikan apa yang bikin kita mandi? Ikan-dung.',
  'Kenapa programmer susah tidur? Karena masih ada bug yang belum dia tutup.',
  'Teh apa yang bisa nyetir? Teh-rminal.',
  'Hewan apa yang paling suka hemat? Kuda... kuda-ta tabungan.',
]
const SETS = { fakta: ['FAKTA UNIK', FAKTA], pantun: ['PANTUN', PANTUN], gombal: ['GOMBALAN', GOMBAL], bijak: ['KATA BIJAK', BIJAK], receh: ['JOKES RECEH', RECEH] }
const ALIAS = { fakta: 'fakta', faktaunik: 'fakta', pantun: 'pantun', gombal: 'gombal', gombalan: 'gombal', bijak: 'bijak', katabijak: 'bijak', receh: 'receh', jokes: 'receh', lawakan: 'receh' }

module.exports = {
  name: 'fakta', alias: Object.keys(ALIAS).filter(k => k !== 'fakta'), category: 'fun', cmds: ['fakta', 'pantun', 'gombal', 'bijak', 'receh'], noLimit: true,
  desc: 'Fakta unik, pantun, gombalan, kata bijak, dan jokes receh acak',
  run: async ({ reply, command }) => { const [title, arr] = SETS[ALIAS[command] || 'fakta']; return reply(`${H(title)}${pick(arr)}`) },
}

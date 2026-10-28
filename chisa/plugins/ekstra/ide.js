/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .ide <jenis> • .makan [waktu] • .aktivitas [suasana] • .lempar — generator ide dan pembantu mengambil keputusan
const { B } = require('../../lib/style'), { rnd, shuffle } = require('../../lib/ekstra')
const G = {
  bisnis: () => `${rnd(['Langganan bulanan', 'Jasa antar', 'Marketplace kecil', 'Kelas online', 'Toko tematik', 'Katering mingguan', 'Aplikasi pemesanan', 'Konten berbayar'])} ${rnd(['kopi spesialti', 'bekal sehat', 'perawatan tanaman', 'kebutuhan hewan peliharaan', 'perlengkapan sepeda', 'les privat', 'kerajinan lokal', 'pakaian bekas pilihan', 'camilan tradisional', 'jasa bersih-bersih'])} untuk ${rnd(['mahasiswa', 'pekerja kantoran', 'ibu muda', 'pelajar SMA', 'pensiunan', 'para pecinta hobi', 'anak kos', 'pelaku UMKM'])}, dijual lewat ${rnd(['Instagram', 'WhatsApp', 'TikTok Shop', 'marketplace', 'komunitas lokal', 'situs sendiri'])}.`,
  konten: () => `${rnd(['Video pendek', 'Utas panjang', 'Podcast', 'Carousel', 'Live', 'Artikel blog'])} tentang ${rnd(['kesalahan pemula', 'hal yang kuharap kuketahui lebih awal', 'mitos yang sering dipercaya', 'perbandingan murah vs mahal', 'proses di balik layar', 'rutinitas 24 jam', 'tantangan 7 hari', 'review jujur'])} di bidang ${rnd(['kuliner', 'teknologi', 'keuangan', 'kesehatan', 'travel', 'belajar', 'game', 'produktivitas'])}.`,
  coding: () => `${rnd(['Bot WhatsApp', 'Aplikasi web', 'Ekstensi browser', 'Skrip CLI', 'Dasbor data', 'Game mini'])} untuk ${rnd(['mencatat pengeluaran', 'mengatur jadwal belajar', 'melacak kebiasaan', 'membagi tagihan', 'mengelola stok toko kecil', 'mengingatkan minum obat', 'menghitung zakat', 'mengatur arisan'])} dengan fitur ${rnd(['laporan otomatis', 'pengingat harian', 'ekspor CSV', 'papan peringkat', 'mode gelap', 'sinkronisasi antarperangkat', 'integrasi kalender'])}.`,
  cerita: () => `Tokoh: ${rnd(['penjaga mercusuar', 'kurir yang pelupa', 'dukun yang skeptis', 'astronot yang takut ketinggian', 'penjual bakso keliling', 'arsiparis tua', 'anak pindahan'])}. Latar: ${rnd(['kota yang tak pernah malam', 'desa di balik kabut', 'kapal barang tengah samudra', 'stasiun yang tak ada di peta', 'pasar malam terakhir'])}. Konflik: ${rnd(['menemukan surat dari masa depan', 'semua orang lupa satu nama', 'harus mengembalikan barang curian', 'ramalan yang ternyata salah ketik', 'jam berhenti di satu menit yang sama'])}.`,
  hadiah: () => rnd(['Buku dengan catatan tulisan tangan', 'Tanaman kecil di pot unik', 'Kopi/teh pilihan + cangkir', 'Voucher makan bersama', 'Album foto kenangan', 'Lilin aromaterapi', 'Botol minum personal', 'Kartu ucapan + camilan favorit', 'Langganan aplikasi belajar', 'Tiket nonton/konser kecil', 'Kotak hadiah berisi hal-hal kecil kesukaannya']),
  nama: () => `${rnd(['Nusa', 'Lintang', 'Arunika', 'Bayu', 'Cakra', 'Dara', 'Kala', 'Mega', 'Pelita', 'Satya', 'Tirta', 'Wana'])}${rnd(['kita', ' Studio', 'ku', ' Lab', ' Karya', 'loka', ' Hub', 'wangi', ' Kopi', ' Works'])}`,
}
const MAKAN = {
  pagi: ['Bubur ayam', 'Nasi uduk', 'Lontong sayur', 'Roti bakar', 'Nasi kuning', 'Soto ayam', 'Oatmeal buah', 'Telur dadar + nasi hangat', 'Lemper & teh hangat'],
  siang: ['Nasi padang', 'Gado-gado', 'Ayam geprek', 'Soto Betawi', 'Nasi campur', 'Mie ayam bakso', 'Pecel lele', 'Rawon', 'Nasi teri + tempe orek', 'Bakso urat'],
  malam: ['Nasi goreng', 'Sate ayam', 'Seblak', 'Martabak', 'Sop buntut', 'Kwetiau goreng', 'Bebek bakar', 'Pempek', 'Tumis kangkung + ikan goreng', 'Ramen/udon'],
  jajan: ['Cilok', 'Pisang goreng', 'Cireng', 'Kue cubit', 'Es campur', 'Risoles', 'Klepon', 'Batagor', 'Roti bakar cokelat keju', 'Es teh + gorengan'],
}
const AKT = {
  sendiri: ['Jalan sore 30 menit tanpa ponsel', 'Rapikan satu laci/rak', 'Baca 20 halaman buku', 'Belajar satu keterampilan baru 25 menit', 'Tulis tiga hal yang disyukuri', 'Dengarkan album lengkap dengan headphone', 'Masak resep yang belum pernah dicoba', 'Gambar apa pun selama 10 menit'],
  bareng: ['Main game papan/kartu', 'Piknik kecil di taman', 'Masak bareng', 'Maraton film dengan voting', 'Jalan-jalan naik sepeda', 'Kunjungi pasar/museum lokal', 'Tantangan foto: cari 10 benda berwarna merah', 'Karaoke di rumah'],
  hemat: ['Cari spot sunset terdekat', 'Piknik bawa bekal sendiri', 'Tukar buku dengan teman', 'Olahraga di taman', 'Ikut kegiatan komunitas gratis', 'Buat konten/vlog sederhana', 'Belajar dari video tutorial gratis', 'Bersihkan dan donasikan barang tak terpakai'],
}
const alias = { aktivitas: 'sendiri' }
module.exports = {
  name: 'ide', alias: ['aktivitas', 'lempar', 'koinflip', 'bingung'], category: 'ekstra', noLimit: true, cmds: ['ide', 'aktivitas', 'lempar'],
  desc: 'Generator ide & keputusan: .ide <bisnis|konten|coding|cerita|hadiah|nama> • .makan • .aktivitas • .lempar',
  run: async ({ command, args, prefix, reply }) => {
    const a = (args[0] || '').toLowerCase()
    if (command === 'lempar' || command === 'koinflip') { const n = Math.min(10, Math.max(1, parseInt(a, 10) || 1)); const r = Array.from({ length: n }, () => (Math.random() < 0.5 ? 'GAMBAR' : 'ANGKA')); return reply(`${B('LEMPAR KOIN')}\n${n === 1 ? `*${r[0]}*` : r.join(' • ') + `\n\nGambar ${r.filter(x => x === 'GAMBAR').length} • Angka ${r.filter(x => x === 'ANGKA').length}`}`) }
    if (command === 'makan') {
      const k = MAKAN[a] ? a : (() => { const h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', hour12: false }).format(new Date())) % 24; return h < 10 ? 'pagi' : h < 16 ? 'siang' : 'malam' })()
      const pick = shuffle(MAKAN[k]).slice(0, 3)
      return reply(`${B('MAU MAKAN APA?')} (${k})\n\nPilihan utama: *${pick[0]}*\nCadangan: ${pick[1]}, ${pick[2]}\n\n_Belum cocok? ${prefix}makan ${Object.keys(MAKAN).join('|')}_`)
    }
    if (command === 'aktivitas') { const k = AKT[a] ? a : 'sendiri', pick = shuffle(AKT[k]).slice(0, 3); return reply(`${B('LAGI BOSAN?')} (${k})\n\n` + pick.map((x, i) => `${i + 1}. ${x}`).join('\n') + `\n\n_Suasana: ${prefix}aktivitas ${Object.keys(AKT).join('|')}_`) }
    if (!G[a]) return reply(`${B('GENERATOR IDE')}\nJenis: ${Object.keys(G).join(', ')}\nContoh: ${prefix}ide bisnis\n\nLainnya: ${prefix}makan • ${prefix}aktivitas • ${prefix}lempar`)
    return reply(`${B('IDE ' + a.toUpperCase())}\n\n${G[a]()}\n\n_Ketik lagi untuk ide lain._`)
  },
}

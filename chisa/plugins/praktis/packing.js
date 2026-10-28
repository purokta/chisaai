/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .packing <jenis> [hari] — daftar bawaan perjalanan yang menyesuaikan jenis dan lama
const { B } = require('../../lib/style')
const DASAR = ['KTP / identitas', 'Dompet, uang tunai & kartu', 'Ponsel + charger + kabel', 'Power bank', 'Obat pribadi & P3K kecil', 'Alat mandi (sikat gigi, sabun, sampo)', 'Masker & hand sanitizer', 'Botol minum', 'Tas kecil untuk bawaan harian']
const JENIS = {
  pantai: { alias: ['laut'], extra: ['Pakaian renang', 'Sandal jepit', 'Tabir surya', 'Topi / kacamata hitam', 'Handuk pantai', 'Kantong kedap air untuk ponsel', 'Pakaian ganti cadangan'] },
  gunung: { alias: ['hiking', 'camping'], extra: ['Sepatu gunung', 'Jaket tebal & jas hujan', 'Senter / headlamp + baterai cadangan', 'Kaos kaki tebal cadangan', 'Sarung tangan & kupluk', 'Makanan tinggi energi', 'Tenda, matras, kantong tidur', 'Peta / jalur offline', 'Kantong sampah'] },
  kota: { alias: ['wisata', 'liburan'], extra: ['Sepatu nyaman untuk jalan', 'Payung lipat', 'Kamera', 'Peta / tiket offline', 'Tas selempang anti-copet'] },
  bisnis: { alias: ['dinas', 'kerja'], extra: ['Pakaian formal', 'Laptop + charger', 'Kartu nama', 'Dokumen presentasi / flashdisk', 'Sepatu formal', 'Alat tulis'] },
  luarnegeri: { alias: ['internasional', 'abroad'], extra: ['Paspor (berlaku > 6 bulan)', 'Visa / e-visa', 'Tiket & bukti akomodasi (cetak + digital)', 'Asuransi perjalanan', 'Adaptor colokan', 'Uang asing + kartu tanpa biaya luar negeri', 'Salinan dokumen terpisah dari aslinya', 'Kartu SIM / eSIM lokal'] },
  mudik: { alias: ['pulang', 'lebaran'], extra: ['Oleh-oleh', 'Uang saku / amplop', 'Pakaian ibadah / baju hari raya', 'Bantal leher & selimut kecil', 'Camilan perjalanan', 'Cek kendaraan: ban, oli, aki, BBM'] },
}
module.exports = {
  name: 'packing', alias: ['packinglist', 'bawaan', 'bawaanjalan'], category: 'praktis', noLimit: true, cmds: ['packing'],
  desc: 'Daftar bawaan perjalanan sesuai jenis (pantai, gunung, kota, bisnis, luar negeri, mudik) dan lama hari',
  run: async ({ args, prefix, reply }) => {
    const key = String(args[0] || '').toLowerCase(), jenis = Object.keys(JENIS).find(k => k === key || JENIS[k].alias.includes(key)), hari = args[1] === undefined ? 3 : parseInt(args[1], 10)
    if (!jenis || !(hari >= 1 && hari <= 60)) return reply(`✦ ${B('PACKING LIST')}\n${prefix}packing <jenis> [hari]\nJenis: ${Object.keys(JENIS).join(', ')}\nContoh: ${prefix}packing pantai 4`)
    const baju = Math.min(hari, 7) + (hari > 7 ? 1 : 0), dalam = Math.min(hari + 1, 8), kaos = Math.min(hari, 7)
    const isi = [`Pakaian atas × ${kaos}`, `Celana / bawahan × ${Math.max(2, Math.ceil(hari / 2))}`, `Pakaian dalam × ${dalam}`, `Kaus kaki × ${Math.min(hari + 1, 8)}`, ...(hari > 7 ? [`Cuci ulang/laundry: bawa cukup untuk ${baju} hari saja`] : []), ...DASAR, ...JENIS[jenis].extra]
    return reply(`✦ ${B('PACKING LIST')} — ${jenis} · ${hari} hari\n\n` + isi.map(x => `◇ ${x}`).join('\n') + `\n\n_Centang di kepala sebelum berangkat. Perjalanan > 7 hari: cuci pakaian di tempat tujuan, bukan membawa semuanya._`)
  },
}

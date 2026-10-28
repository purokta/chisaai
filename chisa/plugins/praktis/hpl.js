/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .hpl <HPHT> [siklus=28] — perkiraan hari persalinan (rumus Naegele) dan usia kehamilan
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
const diff = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5)
module.exports = {
  name: 'hpl', alias: ['hariperkiraanlahir', 'usiakehamilan'], category: 'praktis', noLimit: true, cmds: ['hpl'],
  desc: 'Perkiraan hari lahir (HPL) dari hari pertama haid terakhir + usia kehamilan',
  run: async ({ args, prefix, reply }) => {
    const hpht = K.parseTanggal(args[0]), mm = args.slice(1).join(' ').match(/siklus=(\d+)/i), sik = mm ? +mm[1] : 28
    if (!hpht || !(sik >= 21 && sik <= 40)) return reply(`✦ ${B('HARI PERKIRAAN LAHIR')}\n${prefix}hpl <HPHT> [siklus=28]\nContoh: ${prefix}hpl 2026-03-01  atau  ${prefix}hpl 01-03-2026 siklus=30\n_HPHT = hari pertama haid terakhir. Siklus 21–40 hari._`)
    const today = K.dayKey(), hpl = K.addDays(hpht, 280 + (sik - 28)), age = diff(hpht, today)
    if (age < 0) return reply('✕ HPHT tidak boleh di masa depan.')
    if (age > 300) return reply('✕ HPHT lebih dari 300 hari lalu; periksa lagi tanggalnya.')
    const w = Math.floor(age / 7), d = age % 7, tri = w < 14 ? 'trimester 1' : w < 28 ? 'trimester 2' : 'trimester 3', sisa = diff(today, hpl)
    return reply(`✦ ${B('HARI PERKIRAAN LAHIR')}\n┣ HPHT : ${K.fmtTanggal(hpht)}\n┣ ${B('HPL')} : *${K.fmtTanggal(hpl)}*\n┣ Usia kehamilan : *${w} minggu ${d} hari* (${tri})\n┗ ${sisa >= 0 ? `Sekitar ${sisa} hari menuju HPL` : `Lewat ${-sisa} hari dari HPL`}\n${K.bar(Math.min(1, age / (280 + sik - 28)))}\n\n_Hanya perkiraan dengan rumus Naegele. Pemeriksaan USG dan konsultasi bidan/dokter lebih akurat._`)
  },
}

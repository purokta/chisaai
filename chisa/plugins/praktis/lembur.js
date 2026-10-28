/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .lembur <gaji sebulan> <jam> [kerja|libur5|libur6]  hitung upah lembur (Kepmenaker 102/2004: upah sejam = 1/173 upah sebulan)
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
// tiap segmen: [batas jam kumulatif, pengali]. Hari kerja: jam 1 = 1,5×, jam 2+ = 2×.
// Hari libur (5 hari kerja/minggu): 8 jam pertama 2×, jam ke-9 3×, ke-10 dst 4×. Hari libur (6 hari kerja/minggu): 7 jam pertama 2×, jam ke-8 3×, ke-9 dst 4×.
const MODE = {
  kerja:  { nama: 'Hari kerja biasa', seg: [[1, 1.5], [Infinity, 2]] },
  libur5: { nama: 'Hari libur (sistem 5 hari kerja)', seg: [[8, 2], [9, 3], [Infinity, 4]] },
  libur6: { nama: 'Hari libur (sistem 6 hari kerja)', seg: [[7, 2], [8, 3], [Infinity, 4]] },
}
const ALIAS = { biasa: 'kerja', hk: 'kerja', libur: 'libur5', libur5hk: 'libur5', libur6hk: 'libur6', '5hk': 'libur5', '6hk': 'libur6' }
const num = (n) => String(Math.round(n * 100) / 100).replace('.', ',')
function hitung(gaji, jam, modeKey) {
  const upahJam = gaji / 173, rows = []; let from = 0, total = 0
  for (const [lim, mult] of MODE[modeKey].seg) {
    if (from >= jam) break
    const h = Math.min(jam, lim) - from; if (h <= 0) { from = lim; continue }
    const nominal = h * mult * upahJam; rows.push({ h, mult, nominal }); total += nominal; from = lim
  }
  return { upahJam, rows, total }
}
module.exports = {
  name: 'lembur', alias: ['upahlembur', 'hitunglembur', 'overtime'], category: 'praktis', noLimit: true, cmds: ['lembur'],
  desc: 'Hitung upah lembur: hari kerja atau hari libur (5/6 hari kerja), rumus 1/173 upah sebulan',
  hitung, MODE,
  run: async ({ args, prefix, reply }) => {
    const p = prefix + 'lembur', a = args.map(x => String(x).toLowerCase()); let modeKey = 'kerja'
    const rest = a.filter(x => { const k = ALIAS[x] || x; if (MODE[k]) { modeKey = k; return false } return true })
    const gaji = K.parseNominal(rest[0]), jam = parseFloat(String(rest[1] || '').replace(',', '.'))
    if (!(gaji > 0) || !(jam > 0)) return reply(`${B('UPAH LEMBUR')}\nFormat: ${p} <upah sebulan> <jam lembur> [kerja|libur5|libur6]\nContoh: ${p} 5jt 3\n        ${p} 6,5jt 10 libur5\n_Upah sebulan = gaji pokok + tunjangan tetap. Tanpa mode = hari kerja biasa._`)
    if (jam > 24) return reply('Jam lembur tidak masuk akal (maksimal 24 jam dalam sehari).')
    const r = hitung(gaji, jam, modeKey)
    let t = `✦ ${B('UPAH LEMBUR')}\n${MODE[modeKey].nama}\n\n${B('Upah sebulan')} : ${K.rupiah(gaji)}\n${B('Upah sejam')}   : ${K.rupiah(r.upahJam)} (1/173)\n${B('Lembur')}       : ${num(jam)} jam\n\n`
    for (const x of r.rows) t += `• ${num(x.h)} jam × ${num(x.mult)} = ${K.rupiah(x.nominal)}\n`
    t += `\n${B('Total lembur')} : *${K.rupiah(r.total)}*\n\n_Acuan: Kepmenaker 102/2004, dipertahankan PP 35/2021 (maks. 4 jam/hari dan 18 jam/minggu). Perjanjian kerja atau peraturan perusahaan bisa memberi tarif lebih tinggi; hasil ini perkiraan, bukan keputusan hukum._`
    return reply(t)
  },
}

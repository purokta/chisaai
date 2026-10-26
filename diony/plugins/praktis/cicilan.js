/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Simulasi cicilan: flat / anuitas
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
module.exports = {
  name: 'cicilan', alias: ['simulasicicilan', 'pinjaman', 'kreditsim'], category: 'praktis', noLimit: true, cmds: ['cicilan'],
  desc: 'Simulasi cicilan/kredit: bunga flat atau anuitas (efektif)',
  run: async ({ args, prefix, reply }) => {
    const P = K.parseNominal(args[0]), rate = parseFloat(args[1]), n = parseInt(args[2], 10), mode = (args[3] || 'anuitas').toLowerCase()
    if (!(P > 0) || !(rate >= 0) || !(n >= 1) || n > 600 || !['flat', 'anuitas'].includes(mode))
      return reply(`✦ ${B('SIMULASI CICILAN')}\n${prefix}cicilan <pokok> <bunga%/thn> <tenor bln> [flat|anuitas]\nContoh: ${prefix}cicilan 12jt 12 12 flat\n\n┣ flat : bunga dari pokok awal\n┗ anuitas : bunga dari sisa pokok (default)`)
    const rows = []; let monthly, totalBunga = 0
    if (mode === 'flat') {
      const b = P * (rate / 100) * (n / 12) / n; monthly = P / n + b; totalBunga = b * n; let sisa = P
      for (let i = 1; i <= n; i++) { sisa -= P / n; rows.push([i, b, Math.max(0, sisa)]) }
    } else {
      const r = rate / 100 / 12; monthly = r === 0 ? P / n : P * r / (1 - Math.pow(1 + r, -n)); let sisa = P
      for (let i = 1; i <= n; i++) { const b = sisa * r; totalBunga += b; sisa -= monthly - b; rows.push([i, b, Math.max(0, sisa)]) }
    }
    let t = `✦ ${B('SIMULASI CICILAN')} (${mode})\n\n${B('Pokok')} : ${K.rupiah(P)}\n${B('Bunga')} : ${rate}%/tahun\n${B('Tenor')} : ${n} bulan\n\n┣ Cicilan/bulan : *${K.rupiah(monthly)}*\n┣ Total bunga : ${K.rupiah(totalBunga)}\n┗ Total bayar : *${K.rupiah(P + totalBunga)}*\n\n`
    const show = rows.length > 6 ? [...rows.slice(0, 3), null, ...rows.slice(-2)] : rows
    for (const r of show) t += r ? `· Bln ${r[0]}: bunga ${K.rupiah(r[1])} • sisa ${K.rupiah(r[2])}\n` : '  ⋮\n'
    return reply(t + `\n_Simulasi saja; angka bank bisa berbeda (admin, provisi, asuransi)._`)
  },
}

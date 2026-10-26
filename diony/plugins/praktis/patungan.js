/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Bagi tagihan: pajak, service, pembulatan
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
module.exports = {
  name: 'patungan', alias: ['splitbill', 'bagitagihan', 'urunan'], category: 'praktis', noLimit: true, cmds: ['patungan'],
  desc: 'Bagi tagihan patungan dengan pajak, service charge, dan pembulatan',
  run: async ({ args, prefix, reply }) => {
    const total = K.parseNominal(args[0]), n = parseInt(args[1], 10)
    const pajak = args[2] !== undefined ? parseFloat(args[2]) : 0, svc = args[3] !== undefined ? parseFloat(args[3]) : 0
    if (!(total > 0) || !(n >= 1) || n > 500 || !(pajak >= 0) || !(svc >= 0))
      return reply(`✦ ${B('PATUNGAN')}\n${prefix}patungan <total> <orang> [pajak%] [service%]\nContoh: ${prefix}patungan 450rb 5 10 5\n_Total boleh ditulis 450rb, 1,5jt, atau 250000_`)
    const sv = total * svc / 100, tx = (total + sv) * pajak / 100, grand = total + sv + tx, per = grand / n, round = Math.ceil(per / 100) * 100
    let t = `✦ ${B('HITUNG PATUNGAN')}\n\n${B('Subtotal')} : ${K.rupiah(total)}\n`
    if (svc) t += `${B('Service')} ${svc}% : ${K.rupiah(sv)}\n`
    if (pajak) t += `${B('Pajak')} ${pajak}% : ${K.rupiah(tx)}\n`
    t += `${B('Total')} : *${K.rupiah(grand)}*\n${B('Orang')} : ${n}\n\n┣ Per orang : *${K.rupiah(per)}*\n┗ Dibulatkan : *${K.rupiah(round)}*`
    if (round * n - grand > 0.5) t += `\n\n_Kelebihan pembulatan: ${K.rupiah(round * n - grand)}_`
    return reply(t)
  },
}

/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Hitung tagihan restoran: service charge + pajak, lalu bagi rata per orang.
//   .tip <subtotal> [service%] [pajak%] [orang]     contoh: .tip 350rb 5 10 4
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
module.exports = {
  name: 'tip', alias: ['tagihanresto', 'splitresto', 'bayarresto'], category: 'praktis', noLimit: true, cmds: ['tip'],
  desc: 'Hitung tagihan restoran: service charge + pajak, dibagi per orang',
  run: async ({ args, prefix, reply }) => {
    const sub = K.parseNominal(args[0]), sv = args[1] === undefined ? 0 : parseFloat(String(args[1]).replace(',', '.')), tx = args[2] === undefined ? 0 : parseFloat(String(args[2]).replace(',', '.')), n = args[3] === undefined ? 1 : parseInt(args[3], 10)
    if (!(sub > 0) || !(sv >= 0 && sv <= 100) || !(tx >= 0 && tx <= 100) || !(n >= 1 && n <= 200)) return reply(`🧾 ${B('TAGIHAN RESTO')}\n${prefix}tip <subtotal> [service%] [pajak%] [orang]\n${prefix}tip 350rb 5 10 4\n_Subtotal boleh 350000 / 350rb / 1,2jt. Service & pajak dalam persen (bawaan 0)._`)
    const svc = sub * sv / 100, tax = (sub + svc) * tx / 100, total = sub + svc + tax, per = Math.ceil(total / n / 100) * 100
    return reply(`🧾 ${B('TAGIHAN RESTO')}\n┣ Subtotal : ${K.rupiah(sub)}\n┣ Service  : ${K.rupiah(svc)} (${sv}%)\n┣ Pajak    : ${K.rupiah(tax)} (${tx}% dari subtotal+service)\n┣ ${B('Total')}    : *${K.rupiah(total)}*\n┗ Per orang (${n}): *${K.rupiah(per)}* _(dibulatkan ke atas Rp100)_`)
  },
}

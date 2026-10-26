/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Diskon bertingkat + PPN
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
module.exports = {
  name: 'diskon', alias: ['hitungdiskon', 'discount', 'ppn'], category: 'praktis', noLimit: true, cmds: ['diskon'],
  desc: 'Hitung harga setelah diskon (bisa bertingkat, mis. 50+20) dan PPN',
  run: async ({ args, prefix, reply }) => {
    const harga = K.parseNominal(args[0]), ds = String(args[1] || '').replace(/%/g, '').split('+').map(parseFloat), ppn = args[2] !== undefined ? parseFloat(args[2]) : 0
    if (!(harga > 0) || !ds.length || ds.some(d => !(d >= 0 && d <= 100)) || !(ppn >= 0))
      return reply(`✦ ${B('HITUNG DISKON')}\n${prefix}diskon <harga> <diskon%> [ppn%]\nDiskon bertingkat pakai tanda +\nContoh: ${prefix}diskon 500rb 50+20 11`)
    let cur = harga; const steps = []
    for (const d of ds) { const cut = cur * d / 100; cur -= cut; steps.push(`· −${d}% = ${K.rupiah(cut)}`) }
    const pajak = cur * ppn / 100, hemat = harga - cur
    let t = `✦ ${B('HITUNG DISKON')}\n\n${B('Harga awal')} : ${K.rupiah(harga)}\n${steps.join('\n')}\n\n${B('Setelah diskon')} : *${K.rupiah(cur)}*\n`
    if (ppn) t += `${B('PPN')} ${ppn}% : +${K.rupiah(pajak)}\n${B('Total bayar')} : *${K.rupiah(cur + pajak)}*\n`
    return reply(t + `\nHemat ${K.rupiah(hemat)} (${(hemat / harga * 100).toFixed(1)}%)`)
  },
}

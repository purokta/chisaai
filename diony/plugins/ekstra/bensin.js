/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .bensin <jarak km> <km/liter> <harga/liter> [tol] [orang] — hitung biaya perjalanan
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
const PRESET = { pertalite: 10000, pertamax: 12200, solar: 6800, dexlite: 13700 }
module.exports = {
  name: 'bensin', alias: ['biayaperjalanan', 'biayabbm', 'bbm', 'mudik'], category: 'ekstra', noLimit: true, cmds: ['bensin'],
  desc: 'Biaya perjalanan: .bensin <km> <km/liter> <harga/liter> [tol] [jumlah orang]',
  run: async ({ args, prefix, reply }) => {
    const km = parseFloat(String(args[0] || '').replace(',', '.')), kpl = parseFloat(String(args[1] || '').replace(',', '.'))
    const pr = PRESET[(args[2] || '').toLowerCase()] || K.parseNominal(args[2]), tol = args[3] ? K.parseNominal(args[3]) : 0, org = Math.max(1, Math.min(50, parseInt(args[4], 10) || 1))
    if (!(km > 0 && km <= 20000) || !(kpl > 0 && kpl <= 100) || !(pr > 0) || !Number.isFinite(tol)) return reply(`${B('BIAYA PERJALANAN')}\nFormat: ${prefix}bensin <jarak km> <km per liter> <harga per liter> [tol] [jumlah orang]\n\nContoh: ${prefix}bensin 150 12 10rb 80rb 4\n_Harga bisa nama BBM (${Object.keys(PRESET).join(', ')}) — harga bawaan perkiraan, sesuaikan dengan harga SPBU terkini._`)
    const lt = km / kpl, bbm = lt * pr, tot = bbm + tol, pp = tot / org
    return reply(`✦ ${B('BIAYA PERJALANAN')}\n┣ Jarak     : ${km} km\n┣ Konsumsi  : ${kpl} km/liter → *${lt.toFixed(1)} liter*\n┣ BBM       : ${K.rupiah(bbm)} (@${K.rupiah(pr)}/liter)\n┣ Tol/parkir: ${K.rupiah(tol)}\n┃\n┣ Total     : *${K.rupiah(tot)}*\n┣ Pergi-pulang: ${K.rupiah(tot * 2)}\n┗ ${org > 1 ? `Per orang (${org}): *${K.rupiah(pp)}* (PP ${K.rupiah(pp * 2)})` : 'Per km: ' + K.rupiah(tot / km)}`)
  },
}

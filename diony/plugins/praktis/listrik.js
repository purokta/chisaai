/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .listrik <watt> <jam/hari> [hari] [tarif=1444.7] | ... — estimasi pemakaian dan biaya listrik per bulan
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
const TARIF = 1444.7   // Rp/kWh, tarif rumah tangga non-subsidi umum (bisa diganti: tarif=1699)
module.exports = {
  name: 'listrik', alias: ['biayalistrik', 'kwh', 'tagihanlistrik'], category: 'praktis', noLimit: true, cmds: ['listrik'],
  desc: 'Estimasi kWh dan biaya listrik per bulan dari daftar alat elektronik',
  run: async ({ text, prefix, reply }) => {
    let tarif = TARIF; const t0 = String(text || '').replace(/tarif=([\d.,]+)/i, (_, v) => { tarif = parseFloat(v.replace(/\.(?=\d{3}\b)/g, '').replace(',', '.')); return '' })
    const parts = t0.split('|').map(s => s.trim()).filter(Boolean)
    const help = `✦ ${B('BIAYA LISTRIK')}\n${prefix}listrik <watt> <jam/hari> [hari/bulan] | alat lain\nContoh: ${prefix}listrik 350 8 30 | 100w 5 | 1,5kw 2 20 tarif=1699\n_Hari bawaan 30. Tarif bawaan Rp1.444,70/kWh._`
    if (!parts.length || !(tarif > 0)) return reply(help)
    let total = 0, t = `✦ ${B('BIAYA LISTRIK')}\n`
    for (const [i, p] of parts.slice(0, 15).entries()) {
      const [w0, j0, h0] = p.split(/\s+/), mm = String(w0).toLowerCase().match(/^(\d+(?:[.,]\d+)?)(kw|w)?$/)
      const watt = mm ? parseFloat(mm[1].replace(',', '.')) * (mm[2] === 'kw' ? 1000 : 1) : NaN, jam = parseFloat(String(j0).replace(',', '.')), hari = h0 === undefined ? 30 : parseInt(h0, 10)
      if (!(watt > 0) || !(jam > 0 && jam <= 24) || !(hari >= 1 && hari <= 31)) return reply(`✕ Alat ${i + 1} ("${p}") tidak valid.\n\n${help}`)
      const kwh = watt * jam * hari / 1000; total += kwh; t += `◆ ${p}\n   ${kwh.toFixed(2)} kWh → ${K.rupiah(kwh * tarif)}\n`
    }
    return reply(t + `\n${B('Total')} : ${total.toFixed(2)} kWh/bulan\n${B('Biaya')} : *${K.rupiah(total * tarif)}* /bulan  _(≈ ${K.rupiah(total * tarif * 12)} /tahun)_\n\n_Estimasi di luar biaya beban/pajak penerangan; alat berdaya berubah-ubah (kulkas, AC inverter) rata-ratanya lebih kecil dari label watt._`)
  },
}

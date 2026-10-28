/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .bandingharga <harga> <jumlah> | <harga> <jumlah> | ...  — bandingkan harga per satuan, cari yang paling hemat
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
module.exports = {
  name: 'bandingharga', alias: ['hargasatuan', 'unitprice', 'hemat'], category: 'praktis', noLimit: true, cmds: ['bandingharga'],
  desc: 'Bandingkan harga per satuan (per 100 gram/ml/pcs) untuk cari yang paling hemat',
  run: async ({ text, prefix, reply }) => {
    const parts = String(text || '').split('|').map(s => s.trim()).filter(Boolean), items = []
    for (const [i, p] of parts.entries()) {
      const [h, j] = p.split(/\s+/), harga = K.parseNominal(h), jml = parseFloat(String(j || '').replace(',', '.'))
      if (!(harga > 0) || !(jml > 0)) return reply(`✕ Item ${i + 1} ("${p}") tidak valid. Format: <harga> <jumlah>`)
      items.push({ no: i + 1, harga, jml, per: harga / jml })
    }
    if (items.length < 2) return reply(`✦ ${B('BANDING HARGA')}\n${prefix}bandingharga 12rb 250 | 20rb 500 | 9rb 100\n_Tiap item: harga lalu jumlah (gram/ml/pcs, satuannya harus sama). Pisahkan dengan |_`)
    if (items.length > 10) return reply('✕ Maksimal 10 item.')
    const s = [...items].sort((a, b) => a.per - b.per), best = s[0]
    let t = `✦ ${B('BANDING HARGA')}\n\n`
    s.forEach((x, i) => { t += `${i === 0 ? '◆' : '◇'} *Item ${x.no}* — ${K.rupiah(x.harga)} / ${x.jml}\n   ${K.rupiah(x.per * 100)} per 100 satuan${i ? `  (+${((x.per / best.per - 1) * 100).toFixed(1)}%)` : '  — termurah'}\n` })
    return reply(t + `\nPaling hemat: *Item ${best.no}*.`)
  },
}

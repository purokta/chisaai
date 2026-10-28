/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Dapur: .takaran (cup/sdm/sdt <-> gram), .oven (suhu C/F/gas), .skalaresep (ubah porsi resep)
const { B } = require('../../lib/style')
// gram per 1 cup (240 ml); bahan cair dalam ml
const BAHAN = { tepung: [125, 'g'], terigu: [125, 'g'], gula: [200, 'g'], gulahalus: [120, 'g'], gulamerah: [213, 'g'], mentega: [227, 'g'], margarin: [227, 'g'], minyak: [218, 'g'], air: [240, 'ml'], susu: [245, 'ml'], beras: [185, 'g'], madu: [340, 'g'], garam: [288, 'g'], maizena: [128, 'g'], kakao: [85, 'g'], oat: [90, 'g'] }
const SAT = { cup: 1, gelas: 1, sdm: 1 / 16, sdt: 1 / 48 }
const num = (x) => String(+x.toFixed(2)).replace('.', ',')
const GAS = [[140, 1], [150, 2], [160, 3], [180, 4], [190, 5], [200, 6], [220, 7], [230, 8], [240, 9]]
function frac(s) { s = s.replace(',', '.'); const m = s.match(/^(\d+)\/(\d+)$/); return m ? +m[1] / +m[2] : parseFloat(s) }

module.exports = {
  name: 'takaran', alias: ['oven', 'skalaresep', 'resepskala'], category: 'praktis', noLimit: true, cmds: ['takaran', 'oven', 'skalaresep'],
  desc: 'Alat dapur: takaran cup/sendok ke gram, suhu oven, dan ubah porsi resep',
  run: async ({ args, text, command, prefix, reply }) => {
    if (command === 'oven') {
      const m = String(args[0] || '').toLowerCase().match(/^(\d+(?:[.,]\d+)?)(c|f)?$/); if (!m) return reply(`✦ ${B('SUHU OVEN')}\n${prefix}oven 180  _(Celsius)_\n${prefix}oven 350f  _(Fahrenheit)_`)
      let v = parseFloat(m[1].replace(',', '.')); const isF = m[2] === 'f'; const c = isF ? (v - 32) * 5 / 9 : v, fh = isF ? v : v * 9 / 5 + 32
      if (c < 50 || c > 330) return reply('✕ Suhu di luar rentang oven rumahan (50–330 °C).')
      const g = GAS.reduce((b, x) => (Math.abs(x[0] - c) < Math.abs(b[0] - c) ? x : b)), tingkat = c < 150 ? 'rendah' : c < 190 ? 'sedang' : c < 230 ? 'panas' : 'sangat panas'
      return reply(`✦ ${B('SUHU OVEN')}\n┣ Celsius : *${Math.round(c)} °C*\n┣ Fahrenheit : *${Math.round(fh)} °F*\n┣ Gas mark (terdekat) : ${g[1]}\n┗ Tingkat : ${tingkat}${c > 230 ? '\n\n_Untuk oven listrik biasa, kurangi sekitar 10–20 °C jika memakai mode kipas (fan)._' : ''}`)
    }
    if (command === 'skalaresep') {
      const lines = String(text || '').split(/[|\n]/).map(s => s.trim()).filter(Boolean), head = (lines.shift() || '').match(/^(\d+(?:[.,]\d+)?)\s*(?:>|->|ke)\s*(\d+(?:[.,]\d+)?)$/i)
      if (!head || !lines.length) return reply(`✦ ${B('SKALA RESEP')}\n${prefix}skalaresep 4>10 | 200g tepung | 2 telur | 1/2 sdt garam\n_Angka pertama = porsi asli, kedua = porsi yang diinginkan. Pisahkan bahan dengan |_`)
      const a = parseFloat(head[1].replace(',', '.')), b = parseFloat(head[2].replace(',', '.')); if (!(a > 0) || !(b > 0)) return reply('✕ Porsi harus lebih dari 0.')
      const k = b / a; let t = `✦ ${B('SKALA RESEP')}  ×${num(k)}\n_${num(a)} porsi → ${num(b)} porsi_\n\n`
      for (const l of lines.slice(0, 40)) { const mm = l.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?)\s*(.*)$/); if (!mm) { t += `◇ ${l} _(tanpa angka, sesuaikan sendiri)_\n`; continue }
        const raw = mm[1].split(/\s+/), qty = raw.reduce((s, x) => s + frac(x), 0); t += `◆ ${num(qty * k)} ${mm[2]}  _(asli ${mm[1]})_\n` }
      return reply(t + '\n_Telur, ragi, dan pengembang: bulatkan sesuai kebutuhan, waktu masak biasanya perlu disesuaikan._')
    }
    // .takaran
    const list = Object.keys(BAHAN).join(', ')
    const help = `✦ ${B('TAKARAN DAPUR')}\n${prefix}takaran 2 cup tepung\n${prefix}takaran 3 sdm gula\n${prefix}takaran 250 gram tepung  _(balik ke cup/sdm)_\n\n_Bahan: ${list}. Cup = 240 ml, sdm = 15 ml, sdt = 5 ml (nilai pendekatan)._`
    const n = frac(args[0] || ''), u = String(args[1] || '').toLowerCase().replace(/^gram$|^gr$/, 'g'), bhn = String(args[2] || '').toLowerCase()
    if (!(n > 0) || !BAHAN[bhn]) return reply(help)
    const [gpc, unit] = BAHAN[bhn]
    if (SAT[u]) return reply(`✦ ${B('TAKARAN')}\n${num(n)} ${u} ${bhn} ≈ *${num(n * SAT[u] * gpc)} ${unit}*`)
    if (['g', 'ml'].includes(u)) { const cup = n / gpc; return reply(`✦ ${B('TAKARAN')}\n${num(n)} ${u} ${bhn} ≈\n┣ *${num(cup)}* cup\n┣ *${num(cup * 16)}* sdm\n┗ *${num(cup * 48)}* sdt`) }
    return reply(help)
  },
}

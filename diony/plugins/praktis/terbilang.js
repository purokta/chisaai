/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Angka -> kata bahasa Indonesia
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
const SAT = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'], BESAR = ['', 'ribu', 'juta', 'miliar', 'triliun', 'kuadriliun']
function tiga(n) {
  const s = [], r = Math.floor(n / 100), sisa = n % 100
  if (r) s.push(r === 1 ? 'seratus' : SAT[r] + ' ratus')
  if (sisa) { if (sisa < 12) s.push(SAT[sisa]); else if (sisa < 20) s.push(SAT[sisa - 10] + ' belas'); else s.push(SAT[Math.floor(sisa / 10)] + ' puluh' + (sisa % 10 ? ' ' + SAT[sisa % 10] : '')) }
  return s.join(' ')
}
function terbilang(str) {
  const c = String(str).replace(/^0+(?=\d)/, ''); if (!/^\d+$/.test(c)) return null; if (c === '0') return 'nol'
  const g = []; for (let i = c.length; i > 0; i -= 3) g.unshift(+c.slice(Math.max(0, i - 3), i)); if (g.length > BESAR.length) return null
  const out = []; g.forEach((v, i) => { const idx = g.length - 1 - i; if (!v) return; out.push(idx === 1 && v === 1 ? 'seribu' : tiga(v) + (BESAR[idx] ? ' ' + BESAR[idx] : '')) })
  return out.join(' ').trim()
}
module.exports = {
  name: 'terbilang', alias: ['bilang', 'angkakekata'], category: 'praktis', noLimit: true, cmds: ['terbilang'],
  desc: 'Ubah angka jadi kata bahasa Indonesia (kwitansi, surat)',
  run: async ({ m, text, prefix, reply }) => {
    const num = K.parseNominal(text || K.quotedText(m))
    if (!Number.isFinite(num) || num < 0) return reply(`✦ ${B('TERBILANG')}\n${prefix}terbilang <angka>\nContoh: ${prefix}terbilang 1250000  atau  ${prefix}terbilang 3,5jt`)
    if (num > 9e15) return reply('✕ Angka terlalu besar (maks 9 kuadriliun).')
    const [ip, dec] = num.toFixed(2).split('.'); let kata = terbilang(ip); if (!kata) return reply('✕ Angka tidak valid.')
    if (+dec) kata += ' koma ' + [...dec.replace(/0+$/, '')].map(d => d === '0' ? 'nol' : SAT[+d]).join(' ')
    return reply(`✦ ${B('TERBILANG')}\n\n${num.toLocaleString('id-ID')}\n\n*${kata[0].toUpperCase() + kata.slice(1)}*${+dec ? '' : ' rupiah'}`)
  },
}

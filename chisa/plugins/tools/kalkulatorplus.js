/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kalkulator Plus: akar & pangkat, logaritma, trigonometri, perankingan, minggu ke-berapa,
// konversi suhu, konversi kecepatan, format durasi detik → jam/menit/detik.
const { B } = require('../../lib/style'), K = require('../../lib/praktis')
const num = (s) => { const n = parseFloat(String(s).replace(',', '.')); return Number.isFinite(n) ? n : NaN }
const fmt = (n) => Number.isInteger(n) ? n.toLocaleString('id-ID') : (Math.round(n * 1e6) / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 6 })

const CMDS = ['akarkuadrat', 'pangkatn', 'logaritma', 'trigon', 'rangkinghitung', 'mingguke', 'suhuconv', 'kecepatanconv', 'durasiformat']

module.exports = {
  name: 'kalkulatorplus', alias: CMDS, category: 'tools', noLimit: true, cmds: CMDS,
  desc: 'Kalkulator tambahan: akar, pangkat, logaritma, trigonometri, ranking, minggu ke-, konversi suhu/kecepatan, format durasi',
  run: async ({ command, args, text, prefix, reply }) => {
    const p = prefix
    if (command === 'akarkuadrat') {
      const n = num(args[0])
      if (!Number.isFinite(n)) return reply(`${B('AKAR KUADRAT')}\nContoh: ${p}akarkuadrat 144`)
      if (n < 0) return reply(`${B('AKAR KUADRAT')}\n√${fmt(n)} = *${fmt(Math.sqrt(-n))}i* (akar kompleks, bilangan negatif)`)
      return reply(`${B('AKAR KUADRAT')}\n√${fmt(n)} = *${fmt(Math.sqrt(n))}*`)
    }
    if (command === 'pangkatn') {
      const [a, b] = [num(args[0]), num(args[1])]
      if (!Number.isFinite(a) || !Number.isFinite(b)) return reply(`${B('PANGKAT')}\nFormat: ${p}pangkatn <basis> <pangkat>\nContoh: ${p}pangkatn 2 10`)
      const r = Math.pow(a, b)
      return reply(`${B('PANGKAT')}\n${fmt(a)}^${fmt(b)} = *${Number.isFinite(r) ? fmt(r) : 'tak terhingga / tidak valid'}*`)
    }
    if (command === 'logaritma') {
      const [n, base] = [num(args[0]), args[1] ? num(args[1]) : Math.E]
      if (!Number.isFinite(n) || n <= 0 || !Number.isFinite(base) || base <= 0 || base === 1) return reply(`${B('LOGARITMA')}\nFormat: ${p}logaritma <angka> [basis]\nContoh: ${p}logaritma 1000 10  (basis 10)\n       ${p}logaritma 8 2     (basis 2)\n       ${p}logaritma 10      (ln, basis e)`)
      const r = Math.log(n) / Math.log(base)
      return reply(`${B('LOGARITMA')}\nlog${args[1] ? '_' + fmt(base) : '_e (ln)'}(${fmt(n)}) = *${fmt(r)}*`)
    }
    if (command === 'trigon') {
      const fn = (args[0] || '').toLowerCase(), deg = num(args[1])
      const FN = { sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan }
      if (!FN[fn] || !Number.isFinite(deg)) return reply(`${B('TRIGONOMETRI')}\nFormat: ${p}trigon <sin|cos|tan|asin|acos|atan> <derajat>\nContoh: ${p}trigon sin 30\n       ${p}trigon atan 1`)
      const isInverse = fn.startsWith('a')
      const input = isInverse ? deg : deg * Math.PI / 180
      if (isInverse && (fn !== 'atan') && (deg < -1 || deg > 1)) return reply('✕ Untuk asin/acos, nilai harus antara -1 dan 1.')
      const out = FN[fn](input), result = isInverse ? out * 180 / Math.PI : out
      return reply(`${B('TRIGONOMETRI')}\n${fn}(${fmt(deg)}${isInverse ? '' : '°'}) = *${fmt(result)}${isInverse ? '°' : ''}*`)
    }
    if (command === 'rangkinghitung') {
      const vals = text.split(/[\s,;]+/).filter(Boolean).map(num)
      if (vals.length < 2 || vals.some(x => !Number.isFinite(x)) || vals.length > 100) return reply(`${B('RANKING')}\nTulis angka dipisah spasi/koma (2-100 angka).\nContoh: ${p}rangkinghitung 80 95 70 95 60`)
      const sorted = [...vals].sort((a, b) => b - a)
      const rank = vals.map(v => sorted.indexOf(v) + 1)
      return reply(`${B('RANKING')} (makin besar makin tinggi)\n${vals.map((v, i) => `${fmt(v)} → rank ${rank[i]}`).join('\n')}`)
    }
    if (command === 'mingguke') {
      const d = K.parseTanggal(args[0]) || K.dayKey()
      const [y, m, day] = d.split('-').map(Number)
      const date = new Date(Date.UTC(y, m - 1, day))
      const target = new Date(date); target.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
      const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
      const week = Math.ceil((((target - yearStart) / 864e5) + 1) / 7)
      return reply(`${B('MINGGU KE-')}\n${K.fmtTanggal(d)} berada di *minggu ke-${week}* tahun ${target.getUTCFullYear()} (ISO 8601).`)
    }
    if (command === 'suhuconv') {
      const [n, from] = [num(args[0]), (args[1] || '').toLowerCase()]
      if (!Number.isFinite(n) || !['c', 'f', 'k', 'r'].includes(from)) return reply(`${B('KONVERSI SUHU')}\nFormat: ${p}suhuconv <angka> <c|f|k|r>\nContoh: ${p}suhuconv 100 c  (dari Celsius ke semua satuan)`)
      const c = from === 'c' ? n : from === 'f' ? (n - 32) * 5 / 9 : from === 'k' ? n - 273.15 : n * 5 / 4
      return reply(`${B('KONVERSI SUHU')}\nDari ${fmt(n)}°${from.toUpperCase()}:\n┣ Celsius    : ${fmt(c)}°C\n┣ Fahrenheit : ${fmt(c * 9 / 5 + 32)}°F\n┣ Kelvin     : ${fmt(c + 273.15)}K\n┗ Reamur     : ${fmt(c * 4 / 5)}°R`)
    }
    if (command === 'kecepatanconv') {
      const [n, from] = [num(args[0]), (args[1] || '').toLowerCase()]
      const TO_MS = { kmh: 1 / 3.6, ms: 1, mph: 0.44704, knot: 0.514444 }
      if (!Number.isFinite(n) || !TO_MS[from]) return reply(`${B('KONVERSI KECEPATAN')}\nFormat: ${p}kecepatanconv <angka> <kmh|ms|mph|knot>\nContoh: ${p}kecepatanconv 100 kmh`)
      const ms = n * TO_MS[from]
      return reply(`${B('KONVERSI KECEPATAN')}\nDari ${fmt(n)} ${from}:\n┣ km/jam : ${fmt(ms / TO_MS.kmh)}\n┣ m/s    : ${fmt(ms)}\n┣ mph    : ${fmt(ms / TO_MS.mph)}\n┗ knot   : ${fmt(ms / TO_MS.knot)}`)
    }
    if (command === 'durasiformat') {
      const n = Math.abs(Math.round(num(args[0])))
      if (!Number.isFinite(n)) return reply(`${B('FORMAT DURASI')}\nMasukkan jumlah detik.\nContoh: ${p}durasiformat 9025`)
      const h = Math.floor(n / 3600), mn = Math.floor((n % 3600) / 60), s = n % 60
      return reply(`${B('FORMAT DURASI')}\n${n.toLocaleString('id-ID')} detik = *${h > 0 ? h + ' jam ' : ''}${mn} menit ${s} detik*`)
    }
  },
}

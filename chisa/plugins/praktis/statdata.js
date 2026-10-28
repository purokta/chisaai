/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .statdata <angka...> — statistik deskriptif lengkap
const { B } = require('../../lib/style')
const f = (x) => (Number.isInteger(x) ? String(x) : String(+x.toFixed(4)).replace('.', ','))
const med = (a) => { const n = a.length, h = n >> 1; return n % 2 ? a[h] : (a[h - 1] + a[h]) / 2 }
module.exports = {
  name: 'statdata', alias: ['deskriptif', 'statistikdata', 'statistika'], category: 'praktis', noLimit: true, cmds: ['statdata'],
  desc: 'Statistik deskriptif: rata-rata, median, modus, simpangan baku, kuartil, pencilan',
  run: async ({ m, text, prefix, reply }) => {
    const src = String(text || '').trim() || ((m.quoted && (m.quoted.text || m.quoted.caption)) || '')
    const toks = src.split(/[\s,;]+/).filter(Boolean), a = toks.map(x => Number(x.replace(',', '.')))
    if (!a.length || a.some(x => !Number.isFinite(x))) return reply(`✦ ${B('STATISTIK DATA')}\n${prefix}statdata 4 8 15 16 23 42\n_Pisahkan dengan spasi atau koma. Bisa juga reply pesan berisi angka._`)
    if (a.length > 500) return reply('✕ Maksimal 500 angka.')
    const s = [...a].sort((x, y) => x - y), n = s.length, sum = s.reduce((x, y) => x + y, 0), mean = sum / n
    const ss = s.reduce((x, y) => x + (y - mean) ** 2, 0), cnt = new Map(); s.forEach(x => cnt.set(x, (cnt.get(x) || 0) + 1))
    const mx = Math.max(...cnt.values()), modus = mx === 1 ? 'tidak ada' : [...cnt].filter(([, c]) => c === mx).map(([v]) => f(v)).join(', ') + ` (${mx}×)`
    const lo = s.slice(0, n >> 1), hi = s.slice(n % 2 ? (n >> 1) + 1 : n >> 1), q1 = lo.length ? med(lo) : s[0], q3 = hi.length ? med(hi) : s[n - 1], iqr = q3 - q1
    const out = s.filter(x => x < q1 - 1.5 * iqr || x > q3 + 1.5 * iqr)
    let t = `✦ ${B('STATISTIK DATA')}\n┣ Banyak data : ${n}\n┣ Jumlah : ${f(sum)}\n┣ ${B('Rata-rata')} : ${f(mean)}\n┣ ${B('Median')} : ${f(med(s))}\n┣ Modus : ${modus}\n┣ Min / Maks : ${f(s[0])} / ${f(s[n - 1])}  (rentang ${f(s[n - 1] - s[0])})\n┣ Q1 / Q3 : ${f(q1)} / ${f(q3)}  (IQR ${f(iqr)})\n`
    t += n > 1 ? `┣ Varians : ${f(ss / n)} (populasi) • ${f(ss / (n - 1))} (sampel)\n┗ Simpangan baku : ${f(Math.sqrt(ss / n))} (populasi) • ${f(Math.sqrt(ss / (n - 1)))} (sampel)` : '┗ Simpangan baku : 0'
    if (out.length) t += `\n\n${B('Pencilan')} (di luar 1,5×IQR): ${out.map(f).join(', ')}`
    return reply(t)
  },
}

/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .kontras <warna teks> <warna latar>  rasio kontras WCAG 2.x + lulus/gagal AA / AAA
const { B } = require('../../lib/style')
function parseHex(s) {
  let h = String(s || '').trim().replace(/^#/, '').toLowerCase()
  if (/^[0-9a-f]{3}$/.test(h)) h = h.split('').map(c => c + c).join('')
  return /^[0-9a-f]{6}$/.test(h) ? [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)) : null
}
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
function ratio(a, b) { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05) }
const hex = (c) => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase()
const LV = (r) => [['Teks biasa AA', 4.5], ['Teks besar AA (18pt / 14pt tebal)', 3], ['Teks biasa AAA', 7], ['Teks besar AAA', 4.5], ['Komponen UI & grafik (AA)', 3]].map(([n, min]) => `${r >= min ? 'LULUS' : 'GAGAL'}  ${n} (min ${String(min).replace('.', ',')}:1)`)
module.exports = {
  name: 'kontras', alias: ['contrast', 'wcag', 'cekkontras'], category: 'praktis', noLimit: true, cmds: ['kontras'],
  desc: 'Cek rasio kontras dua warna (WCAG): lulus AA / AAA untuk teks dan komponen UI',
  parseHex, ratio,
  run: async ({ args, prefix, reply }) => {
    const a = parseHex(args[0]), b = parseHex(args[1])
    if (!a || !b) return reply(`${B('KONTRAS WARNA')}\nFormat: ${prefix}kontras <warna teks> <warna latar>\nContoh: ${prefix}kontras #1a1a1a #ffffff\n        ${prefix}kontras 777 fff\n_Warna heksadesimal 3 atau 6 digit, tanda # boleh dihilangkan._`)
    const r = ratio(a, b), rs = (Math.round(r * 100) / 100).toFixed(2).replace('.', ',')
    return reply(`✦ ${B('KONTRAS WARNA')}\nTeks ${hex(a)}  di atas  latar ${hex(b)}\n\n${B('Rasio')} : *${rs}:1*\n\n${LV(r).join('\n')}\n\n_Rumus WCAG 2.x. Nilai terbaik 21:1 (hitam di atas putih), terburuk 1:1._`)
  },
}

/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .fancy <teks> — ubah teks ke belasan gaya huruf Unicode (bio, nama, caption). Gaya spesifik: .fancy <gaya> <teks>
const ST = require('../../lib/style')
const range = (up, lo, dg, hole = {}) => (c) => {
  const k = c.charCodeAt(0)
  if (hole[c]) return hole[c]
  if (k >= 65 && k <= 90 && up) return String.fromCodePoint(up + k - 65)
  if (k >= 97 && k <= 122 && lo) return String.fromCodePoint(lo + k - 97)
  if (k >= 48 && k <= 57 && dg) return String.fromCodePoint(dg + k - 48)
  return c
}
const DS = { C: 'ℂ', H: 'ℍ', N: 'ℕ', P: 'ℙ', Q: 'ℚ', R: 'ℝ', Z: 'ℤ' }
const SC = 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ', UD = 'ɐqɔpǝɟƃɥᴉɾʞlɯuodbɹsʇnʌʍxʎz'
const map = (fn) => (t) => Array.from(t).map(fn).join('')
const STYLES = {
  tebal:      map(range(0x1D5D4, 0x1D5EE, 0x1D7EC)),
  miring:     map(range(0x1D608, 0x1D622, 0)),
  tebalmiring: map(range(0x1D63C, 0x1D656, 0)),
  skrip:      map(range(0x1D4D0, 0x1D4EA, 0)),
  fraktur:    map(range(0x1D56C, 0x1D586, 0)),
  ganda:      map(range(0x1D538, 0x1D552, 0x1D7D8, DS)),
  mono:       map(range(0x1D670, 0x1D68A, 0x1D7F6)),
  lebar:      map((c) => c === ' ' ? '　' : /[!-~]/.test(c) ? String.fromCharCode(c.charCodeAt(0) + 0xFEE0) : c),
  bulat:      map((c) => /[A-Z]/.test(c) ? String.fromCodePoint(0x24B6 + c.charCodeAt(0) - 65) : /[a-z]/.test(c) ? String.fromCodePoint(0x24D0 + c.charCodeAt(0) - 97) : c === '0' ? '⓪' : /[1-9]/.test(c) ? String.fromCodePoint(0x2460 + +c - 1) : c),
  kapitalkecil: map((c) => /[a-z]/.test(c) ? SC[c.charCodeAt(0) - 97] : c),
  terbalik:   (t) => Array.from(t.toLowerCase()).map(c => /[a-z]/.test(c) ? UD[c.charCodeAt(0) - 97] : c).reverse().join(''),
  coret:      map((c) => c === ' ' ? c : c + '̶'),
  garisbawah: map((c) => c === ' ' ? c : c + '̲'),
  renggang:   (t) => Array.from(t).join(' '),
  mengejek:   (t) => { let i = 0; return Array.from(t).map(c => /[a-z]/i.test(c) ? (i++ % 2 ? c.toUpperCase() : c.toLowerCase()) : c).join('') },
  titik:      (t) => Array.from(t).join('·'),
}
module.exports = {
  name: 'fancy', alias: ['gayahuruf', 'fonts', 'hurufkeren', 'stylish'], category: 'tools', cmds: ['fancy'],
  desc: 'Ubah teks ke 15 gaya huruf: .fancy <teks> atau .fancy <gaya> <teks>',
  run: async ({ m, args, text, prefix, reply }) => {
    const name = (args[0] || '').toLowerCase(), one = STYLES[name]
    const src = (one ? args.slice(1).join(' ') : text || (m.quoted && (m.quoted.text || m.quoted.caption)) || '').trim()
    if (!src) return reply(`${ST.B('FANCY TEKS')}\nContoh: ${prefix}fancy Chisa AI\nGaya tertentu: ${prefix}fancy <gaya> <teks>\nGaya: ${Object.keys(STYLES).join(', ')}`)
    if (src.length > 200) return reply('Maksimal 200 karakter.')
    if (one) return reply(one(src))
    return reply(`${ST.B('FANCY TEKS')}\n━━━━━━━━━━━━━━━━━━━━\n` + Object.entries(STYLES).map(([k, f]) => `*${k}*\n${f(src)}`).join('\n\n'))
  },
}

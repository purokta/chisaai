/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Alat teks: palindrom, urutkan, acak baris, frekuensi huruf & kata. Teks bisa diketik atau diambil dari pesan yang di-reply.
//   .palindrom <teks> • .urutkan [turun] <item/baris> • .acakbaris <baris> • .frekuensi <teks>
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }
const split = (s) => (/\n/.test(s) ? s.split(/\n/) : /,/.test(s) ? s.split(',') : s.split(/\s+/)).map(x => x.trim()).filter(Boolean)
const short = (a, n = 60) => (a.length > n ? a.slice(0, n) + '…' : a)
module.exports = {
  name: 'baristeks', alias: ['palindrom', 'urutkan', 'acakbaris', 'frekuensi'], category: 'tools', noLimit: true, cmds: ['palindrom', 'urutkan', 'acakbaris', 'frekuensi'],
  desc: 'Alat teks: cek palindrom, urutkan daftar, acak baris, frekuensi huruf & kata',
  run: async ({ m, command, args, prefix, reply }) => {
    const c = command === 'baristeks' ? 'urutkan' : command
    let raw = args.join(' ').trim()
    if (c === 'urutkan' && /^(turun|desc|z-a|besar)$/i.test(args[0] || '')) raw = args.slice(1).join(' ').trim()
    const desc = c === 'urutkan' && /^(turun|desc|z-a|besar)$/i.test(args[0] || '')
    raw = raw || K.quotedText(m)
    if (!raw) return reply(`✦ ${B(c.toUpperCase())}\n${{ palindrom: `${prefix}palindrom Katak\n${prefix}palindrom Ibu Ratna antar ubi`, urutkan: `${prefix}urutkan pisang, apel, jeruk\n${prefix}urutkan turun 5 12 3 40\n_Atau reply pesan berisi daftar (satu item per baris)._`, acakbaris: `${prefix}acakbaris (daftar bertingkat, satu per baris)\n_Atau reply pesan berisi daftar._`, frekuensi: `${prefix}frekuensi teks yang ingin dianalisis` }[c]}`)
    if (c === 'palindrom') {
      const n = raw.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, ''); if (!n) return reply('✕ Tidak ada huruf/angka untuk diperiksa.')
      const ok = n === [...n].reverse().join('')
      return reply(`🔁 ${B('PALINDROM')}\n"${short(raw)}"\n${ok ? '✅ *Palindrom!*' : '❌ *Bukan palindrom.*'}\n_Dibaca: ${short(n, 50)} ↔ ${short([...n].reverse().join(''), 50)}_`)
    }
    const items = split(raw); if (items.length < 2 && c !== 'frekuensi') return reply('✕ Minimal 2 item. Pisahkan dengan koma, spasi, atau baris baru.')
    if (c === 'urutkan') {
      const nums = items.every(x => /^-?\d+([.,]\d+)?$/.test(x)), cmp = nums ? (a, b) => parseFloat(a.replace(',', '.')) - parseFloat(b.replace(',', '.')) : (a, b) => a.localeCompare(b, 'id', { sensitivity: 'base' })
      const out = [...items].sort(cmp); if (desc) out.reverse()
      return reply(`🔢 ${B('URUTKAN')} (${nums ? 'angka' : 'abjad'}, ${desc ? 'turun' : 'naik'})\n${out.slice(0, 80).map((x, i) => `${i + 1}. ${x}`).join('\n')}${out.length > 80 ? `\n… +${out.length - 80} item` : ''}`)
    }
    if (c === 'acakbaris') return reply(`🔀 ${B('ACAK BARIS')}\n${shuffle(items).slice(0, 80).join('\n')}`)
    const letters = {}, words = {}; for (const ch of raw.toLowerCase().replace(/[^a-z]/g, '')) letters[ch] = (letters[ch] || 0) + 1
    for (const w of raw.toLowerCase().match(/[a-zà-ÿ0-9']{2,}/g) || []) words[w] = (words[w] || 0) + 1
    const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n), tl = top(letters, 8), tw = top(words, 5), tot = Object.values(letters).reduce((a, b) => a + b, 0)
    return reply(`📊 ${B('FREKUENSI TEKS')}\n┣ Karakter : ${raw.length}\n┣ Huruf    : ${tot}\n┣ Kata     : ${(raw.match(/\S+/g) || []).length}\n┗ Baris    : ${raw.split('\n').length}\n\n${B('Huruf terbanyak')}\n${tl.map(([k, v]) => `${k.toUpperCase()} ${K.bar(v / tl[0][1], 8)} ${v}`).join('\n') || '-'}\n\n${B('Kata terbanyak')}\n${tw.map(([k, v]) => `• ${k} ×${v}`).join('\n') || '-'}`)
  },
}

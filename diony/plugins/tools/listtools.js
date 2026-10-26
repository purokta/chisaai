/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Alat daftar/teks multi-baris: sortir, unik, nomori, acaklist, gabung, bersih, hitungbaris. Pakai Enter untuk memisah baris, atau reply pesan berisi daftar.
const ST = require('../../lib/style')
const pick = (a) => a[Math.floor(Math.random() * a.length)]
module.exports = {
  name: 'listtools', alias: ['sortir', 'unik', 'dedupe', 'nomori', 'acaklist', 'gabung', 'bersih', 'hitungbaris', 'balikbaris'],
  category: 'tools', cmds: ['sortir', 'unik', 'nomori', 'acaklist', 'gabung', 'bersih', 'balikbaris'], noLimit: true,
  desc: 'Olah daftar: sortir [z], unik, nomori, acaklist, gabung <pemisah>, bersih, balikbaris',
  run: async ({ m, text, command, prefix, reply }) => {
    let body = text
    if (['gabung'].includes(command)) { const first = body.split(/\r?\n/)[0].trim(); body = body.slice(body.indexOf('\n') + 1); var sep = first || ', ' }
    if (!body.trim() && m.quoted) body = m.quoted.text || m.quoted.caption || ''
    if (command === 'sortir') { const rev = /^z\s/i.test(body); if (rev) body = body.replace(/^z\s/i, '') }
    const lines = body.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
    if (!lines.length) return reply(`${ST.B('OLAH DAFTAR')}\nTulis daftar dengan Enter, atau reply pesan berisi daftar.\nContoh:\n${prefix}sortir\napel\njeruk\nbuah naga\n\nPerintah: sortir (awali "z " untuk Z-A), unik, nomori, acaklist, gabung (baris 1 = pemisah), bersih, balikbaris`)
    const cmp = (a, b) => a.localeCompare(b, 'id', { numeric: true, sensitivity: 'base' })
    let out
    switch (command) {
      case 'sortir': out = lines.sort(cmp); if (/^z\s/i.test(text)) out.reverse(); break
      case 'unik': case 'dedupe': { const s = new Set(); out = lines.filter(l => { const k = l.toLowerCase(); if (s.has(k)) return false; s.add(k); return true }); break }
      case 'nomori': out = lines.map((l, i) => `${i + 1}. ${l.replace(/^\d+[.)]\s*/, '')}`); break
      case 'acaklist': out = lines.slice().sort(() => Math.random() - 0.5).map((l, i) => `${i + 1}. ${l}`); break
      case 'gabung': return reply(lines.join(sep))
      case 'bersih': out = lines.map(l => l.replace(/\s+/g, ' ')); break
      case 'balikbaris': out = lines.reverse(); break
      case 'hitungbaris': return reply(`${lines.length} baris, ${new Set(lines.map(l => l.toLowerCase())).size} unik.`)
    }
    return reply(`${out.join('\n')}\n\n_${lines.length} baris${command === 'unik' ? ` → ${out.length} unik` : ''}_`)
  },
}

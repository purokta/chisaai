/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// MADAM ZORA — weton Jawa, zodiak, shio (hiburan)
const D = require('../../lib/daily'), NU = require('../../lib/npcutil'), P = require('../../lib/profiledb')
module.exports = {
  name: 'weton',
  alias: ['zodiak', 'bintang', 'shio'],
  category: 'dunia',
  cmds: ['weton', 'zodiak', 'shio'],
  desc: 'Weton, zodiak, dan shio dari tanggal lahir (Madam Zora)',
  run: async ({ m, command, text, prefix, reply }) => {
    const jid = m.sender, head = NU.head('zora', jid), now = D.now()
    if (command === 'shio' && /^\d{4}$/.test(text.trim())) { const s = D.shio({ y: +text.trim(), m: 6, d: 1 }); return reply(`${head}\n\n*SHIO TAHUN ${text.trim()}*\n🐾 *${s.name}*\n${s.name} itu ${s.sifat}.\n\n_Tahun shio mengikuti Imlek (sekitar akhir Jan–pertengahan Feb). Hiburan semata._`) }
    let b = D.takeDate(text, now).date; const saved = P.get(jid).bday
    if (!b && saved) b = D.parseDate(saved)
    if (!b) return reply(`${head}\n\nMasukkan tanggal lahirmu.\nContoh: ${prefix}${command} 31-01-2000\nSimpan permanen: ${prefix}setlahir 31-01-2000`)
    const w = D.weton(b), z = D.zodiak(b), s = D.shio(b)
    const show = command === 'weton' ? `*WETON JAWA*\n📅 ${D.fmtDate({ ...b, dow: D.dowOf(b.y, b.m, b.d) })}\n\n🌓 *${w.hari} ${w.pasaran}*\nNeptu: ${w.nh} (${w.hari}) + ${w.np} (${w.pasaran}) = *${w.neptu}*\n\nPasaran ${w.pasaran} cenderung ${D.PASARAN_SIFAT[w.pasaran]}.\nNeptu ${w.neptu}: ${D.NEPTU_ARTI(w.neptu)}.`
      : command === 'shio' ? `*SHIO*\n📅 ${D.fmtDate({ ...b, dow: D.dowOf(b.y, b.m, b.d) })}\n\n🐾 *${s.name}*\nShio ${s.name} itu ${s.sifat}.${s.edge ? '\n\n_Kamu lahir Jan–Feb: shio mengikuti tanggal Imlek, bisa jadi ' + D.shio({ y: b.y, m: 6, d: 1 }).name + ' atau ' + D.shio({ y: b.y - 1, m: 6, d: 1 }).name + '._' : ''}`
      : `*ZODIAK*\n📅 ${D.fmtDate({ ...b, dow: D.dowOf(b.y, b.m, b.d) })}\n\n⭐ *${z.name}*\n${z.name} itu ${z.sifat}.`
    return reply(`${head}\n\n${show}\n\n_Ramalan & karakter hanya hiburan, jangan dijadikan dasar keputusan penting._${NU.bump(jid, 'zora', 2)}`)
  },
}

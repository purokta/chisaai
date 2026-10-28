/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Alat acak untuk grup: .acakmember [n], .kelompok <n>, .pasangan, .giliran, .arisan
const { tag } = require('../../lib/grouputil'), { B } = require('../../lib/style')
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }
const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) } return h >>> 0 }
const seeded = (arr, seed) => arr.slice().sort((a, b) => hash(seed + a) - hash(seed + b))

module.exports = {
  name: 'acakmember', alias: ['kelompok', 'pasangan', 'giliran', 'arisan', 'couple'], category: 'group', group: true, noLimit: true,
  cmds: ['acakmember', 'kelompok', 'pasangan', 'giliran', 'arisan'],
  desc: 'Acak anggota grup: acakmember [n], kelompok <n>, pasangan (hari ini), giliran, arisan',
  run: async ({ sock, m, args, command, prefix, reply, groupMetadata }) => {
    const bot = (sock.user && sock.user.id || '').split(':')[0].split('@')[0]
    const ids = groupMetadata.participants.map(p => p.id).filter(j => j.split('@')[0] !== bot)
    if (ids.length < 2) return reply('Anggota grup terlalu sedikit.')
    const send = (t, mentions) => sock.sendMessage(m.chat, { text: t, mentions }, { quoted: m })
    const L = (arr) => arr.map(tag).join(', ')
    if (command === 'acakmember') {
      const n = Math.min(Math.max(parseInt(args[0], 10) || 1, 1), 20), pick = shuffle(ids).slice(0, n)
      return send(`${B('ACAK MEMBER')}\nTerpilih ${pick.length} orang:\n` + pick.map((j, i) => `${i + 1}. ${tag(j)}`).join('\n'), pick)
    }
    if (command === 'kelompok') {
      const k = parseInt(args[0], 10)
      if (!(k >= 2 && k <= 20) || k > ids.length) return reply(`Format: ${prefix}kelompok <jumlah kelompok 2-20>\nAnggota: ${ids.length}`)
      const g = Array.from({ length: k }, () => []); shuffle(ids).forEach((j, i) => g[i % k].push(j))
      return send(`${B('PEMBAGIAN KELOMPOK')} (${k} kelompok)\n` + g.map((x, i) => `\n*Kelompok ${i + 1}* (${x.length})\n` + x.map(j => '• ' + tag(j)).join('\n')).join('\n'), ids)
    }
    if (command === 'pasangan' || command === 'couple') {
      const day = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10), s = seeded(ids, m.chat + day)
      return send(`${B('PASANGAN HARI INI')} (${day})\n━━━━━━━━━━━━━━━━━━━━\n${tag(s[0])} 💞 ${tag(s[1])}\n\n_Berganti tiap hari, hanya hiburan._`, [s[0], s[1]])
    }
    if (command === 'giliran') { const s = shuffle(ids); return send(`${B('URUTAN GILIRAN')}\n` + s.slice(0, 40).map((j, i) => `${i + 1}. ${tag(j)}`).join('\n'), s.slice(0, 40)) }
    const w = shuffle(ids)[0]   // arisan
    return send(`${B('ARISAN')}\n✦ Kocokan dimulai...\n✦ Pemenang: ${tag(w)}\n\nSelamat!`, [w])
  },
}

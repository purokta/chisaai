/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .giveaway <menit> <jumlah pemenang> <hadiah> (admin) • .ikut • .giveaway status|selesai|batal. Berjalan di memori (hilang jika bot restart).
const { B } = require('../../lib/style'), E = require('../../lib/ekstra')
const games = new Map()
const tag = (j) => '@' + j.split('@')[0]
function draw(sock, chat, why) {
  const g = games.get(chat); if (!g) return; clearTimeout(g.tm); games.delete(chat)
  const pool = E.shuffle([...g.users]), win = pool.slice(0, g.win)
  const text = win.length ? `✦ ${B('GIVEAWAY SELESAI')} (${why})\nHadiah: *${g.prize}*\nPeserta: ${g.users.size}\n\n✦ Pemenang:\n${win.map((j, i) => `${i + 1}. ${tag(j)}`).join('\n')}\n\nSelamat! Hubungi admin untuk klaim.` : `✦ ${B('GIVEAWAY SELESAI')}\nHadiah: *${g.prize}*\nTidak ada peserta. Giveaway dibatalkan.`
  return sock.sendMessage(chat, { text, mentions: win }).catch(() => {})
}
module.exports = {
  name: 'giveaway', alias: ['ikut', 'undian'], category: 'ekstra', noLimit: true, group: true, cmds: ['giveaway', 'ikut'],
  desc: 'Giveaway grup: admin .giveaway <menit> <pemenang> <hadiah>; anggota .ikut',
  run: async function (c) {
    const { sock, m, args, command, prefix, reply } = c, g = games.get(m.chat), p = prefix + 'giveaway', sub = (args[0] || '').toLowerCase()
    if (command === 'ikut') {
      if (!g) return reply('Tidak ada giveaway yang berjalan.')
      if (Date.now() >= g.end) { draw(sock, m.chat, 'waktu habis'); return }
      if (g.users.has(m.sender)) return reply('Kamu sudah terdaftar.'); g.users.add(m.sender)
      return reply(`✦ ${tag(m.sender)} ikut giveaway *${g.prize}*\nPeserta: ${g.users.size}`)
    }
    if (['status', 'info'].includes(sub) || (g && !['selesai', 'batal'].includes(sub))) {
      if (!g) return reply(`${B('GIVEAWAY')}\nTidak ada yang berjalan.\nAdmin: ${p} <menit> <pemenang> <hadiah>`)
      const sisa = Math.max(0, Math.ceil((g.end - Date.now()) / 60000)); return reply(`✦ ${B('GIVEAWAY')}\nHadiah: *${g.prize}*\nPemenang: ${g.win} • Peserta: ${g.users.size}\nSisa waktu: ${sisa} menit\n\nIkut: *${prefix}ikut*`)
    }
    if (!E.isAdmin(c)) return reply(global.mess?.admin || 'Khusus admin grup.')
    if (sub === 'selesai') { if (!g) return reply('Tidak ada giveaway.'); draw(sock, m.chat, 'dihentikan admin'); return }
    if (sub === 'batal') { if (!g) return reply('Tidak ada giveaway.'); clearTimeout(g.tm); games.delete(m.chat); return reply('Giveaway dibatalkan.') }
    const min = parseInt(args[0], 10), win = parseInt(args[1], 10), prize = args.slice(2).join(' ').trim().slice(0, 80)
    if (!(min >= 1 && min <= 1440) || !(win >= 1 && win <= 10) || !prize) return reply(`${B('GIVEAWAY')}\nFormat: ${p} <menit> <jumlah pemenang> <hadiah>\nContoh: ${p} 10 2 Pulsa 50rb\n_Menit 1-1440, pemenang 1-10._`)
    const ng = { prize, win, users: new Set(), end: Date.now() + min * 60000 }; ng.tm = setTimeout(() => { if (games.get(m.chat) === ng) draw(sock, m.chat, 'waktu habis') }, min * 60000); games.set(m.chat, ng)
    return reply(`✦ ${B('GIVEAWAY DIMULAI')}\nHadiah: *${prize}*\nPemenang: ${win} orang\nDurasi: ${min} menit\n\nIkut dengan mengetik *${prefix}ikut*`)
  },
}

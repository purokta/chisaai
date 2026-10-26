/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .roulette — roulette peluru kosplay (aman, hanya permainan): 6 ruang, 1 peluru; yang kena tersingkir. Penyintas terakhir menang.
//   .roulette           buka lobi / ikut     .roulette mulai   mulai (min. 2 pemain, oleh pembuka lobi atau admin)
//   .tembak             tarik pelatuk saat gilanmu (45 detik, lewat waktu = tersingkir)     .roulette batal   bubarkan
const E = require('../../lib/ekstra'), { B } = require('../../lib/style')
const games = new Map()
const tag = (j) => '@' + j.split('@')[0]
const say = (sock, chat, g, text) => sock.sendMessage(chat, { text, mentions: g.players }).catch(() => {})
function end(chat) { const g = games.get(chat); if (g) clearTimeout(g.tm); games.delete(chat) }
function turn(sock, chat) {
  const g = games.get(chat); if (!g) return
  if (g.alive.length === 1) { const w = g.alive[0], sc = E.addScore(w, g.names[w], 10 + 2 * g.players.length, 'roulette'); say(sock, chat, g, `✦ ${tag(w)} penyintas terakhir! +${10 + 2 * g.players.length} poin (total ${sc.pts})`); return end(chat) }
  clearTimeout(g.tm); g.cur = g.cur % g.alive.length
  say(sock, chat, g, `Giliran ${tag(g.alive[g.cur])} — ketik *.tembak* (45 detik)\nSisa: ${g.alive.map(tag).join(', ')}`)
  g.tm = setTimeout(() => { const x = games.get(chat); if (x !== g) return; const p = g.alive[g.cur]; say(sock, chat, g, `${tag(p)} membeku kehabisan waktu dan tersingkir.`); g.alive.splice(g.cur, 1); g.pos = Math.floor(Math.random() * 6); g.n = 0; turn(sock, chat) }, 45000)
}
module.exports = {
  name: 'roulette', alias: ['tembak', 'rr'], category: 'fun', group: true, noLimit: true, cmds: ['roulette', 'tembak'],
  desc: 'Roulette peluru (permainan grup): .roulette • .roulette mulai • .tembak',
  run: async ({ sock, m, command, args, prefix, reply, isAdmins, isOwner }) => {
    const g = games.get(m.chat), sub = (args[0] || '').toLowerCase()
    if (command === 'tembak') {
      if (!g || !g.started) return reply(`Tidak ada permainan berjalan. Buka lobi: ${prefix}roulette`)
      if (g.alive[g.cur] !== m.sender) return reply(g.alive.includes(m.sender) ? `Bukan gilamu. Sekarang giliran ${tag(g.alive[g.cur])}.` : 'Kamu sudah tersingkir / tidak ikut.')
      clearTimeout(g.tm)
      if (g.n === g.pos) { say(sock, m.chat, g, `💥 DOR! ${tag(m.sender)} tersingkir.`); g.alive.splice(g.cur, 1); g.pos = Math.floor(Math.random() * 6); g.n = 0 }
      else { g.n++; say(sock, m.chat, g, `*klik.* ${tag(m.sender)} selamat. (ruang ${g.n}/6)`); g.cur++ }
      return turn(sock, m.chat)
    }
    if (sub === 'batal') { if (!g) return reply('Tidak ada lobi.'); if (g.owner !== m.sender && !isAdmins && !isOwner) return reply('Hanya pembuka lobi / admin.'); end(m.chat); return reply('Permainan dibubarkan.') }
    if (sub === 'mulai') {
      if (!g || g.started) return reply(g ? 'Permainan sudah berjalan.' : `Belum ada lobi. Buka dengan ${prefix}roulette`)
      if (g.owner !== m.sender && !isAdmins && !isOwner) return reply('Hanya pembuka lobi / admin yang bisa memulai.')
      if (g.players.length < 2) return reply('Minimal 2 pemain.')
      g.started = true; g.alive = [...g.players].sort(() => Math.random() - 0.5); g.cur = 0; g.pos = Math.floor(Math.random() * 6); g.n = 0
      await say(sock, m.chat, g, `${B('ROULETTE')}\nPermainan dimulai! ${g.players.length} pemain.\nGiliran acak. Hanya permainan, tidak ada konsekuensi nyata.`)
      return turn(sock, m.chat)
    }
    if (g && g.started) return reply('Permainan sedang berjalan.')
    if (!g) {
      const ng = { owner: m.sender, players: [m.sender], names: { [m.sender]: m.pushName }, started: false }
      ng.tm = setTimeout(() => { if (games.get(m.chat) === ng && !ng.started) { games.delete(m.chat); sock.sendMessage(m.chat, { text: 'Lobi roulette kedaluwarsa.' }).catch(() => {}) } }, 180000)
      games.set(m.chat, ng); return say(sock, m.chat, ng, `${B('ROULETTE')}\nLobi dibuka oleh ${tag(m.sender)}.\nIkut: *${prefix}roulette* • Mulai: *${prefix}roulette mulai* (min. 2 pemain, lobi 3 menit)`)
    }
    if (g.players.includes(m.sender)) return reply('Kamu sudah di lobi.')
    if (g.players.length >= 8) return reply('Lobi penuh (maks 8).')
    g.players.push(m.sender); g.names[m.sender] = m.pushName
    return say(sock, m.chat, g, `${tag(m.sender)} bergabung. Pemain: ${g.players.length}`)
  },
}

/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .mastermind — tebak 4 angka rahasia (angka tidak ada yang kembar). Bot memberi petunjuk tepat / salah tempat.
// Semua orang di chat boleh menebak: kirim 4 angka saja (contoh 4271). 10 kesempatan, 5 menit. Menang = gold RPG.
const R = require('../../lib/rpg')
const ST = require('../../lib/style')
const games = new Map() // chat -> { secret, tries[], timer }
const rnd = (n) => Math.floor(Math.random() * n)
const secret = () => { const d = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; for (let i = 9; i > 0; i--) { const j = rnd(i + 1);[d[i], d[j]] = [d[j], d[i]] } return d.slice(0, 4).join('') }
const score = (s, g) => { let hit = 0, near = 0; for (let i = 0; i < 4; i++) { if (g[i] === s[i]) hit++; else if (s.includes(g[i])) near++ } return { hit, near } }
const MAX = 10
const board = (g) => g.tries.map((t, i) => `${String(i + 1).padStart(2)}. ${t.g}  →  ${t.hit} tepat, ${t.near} salah tempat`).join('\n')
const stop = (chat) => { const g = games.get(chat); if (g) clearTimeout(g.timer); games.delete(chat) }

module.exports = {
  name: 'mastermind', alias: ['bullcow', 'tebakangka4'], category: 'fun', cmds: ['mastermind'],
  desc: 'Tebak 4 angka rahasia dengan petunjuk tepat/salah tempat (menang dapat gold RPG)',
  run: async ({ sock, m, reply, args, prefix }) => {
    const sub = String(args[0] || '').toLowerCase(), g = games.get(m.chat)
    if (sub === 'nyerah' || sub === 'stop') { if (!g) return reply('Tidak ada permainan yang berjalan.'); stop(m.chat); return reply(`Menyerah? Angkanya adalah *${g.secret}*`) }
    if (sub === 'papan' && g) return reply(`${ST.B('MASTERMIND')}\n━━━━━━━━━━━━━━━━━━━━\n${g.tries.length ? board(g) : 'Belum ada tebakan.'}\n\nSisa kesempatan: ${MAX - g.tries.length}`)
    if (g) return reply(`Permainan masih berjalan (${MAX - g.tries.length} kesempatan lagi). Kirim 4 angka untuk menebak, atau ${prefix}mastermind nyerah`)
    const ng = { secret: secret(), tries: [] }
    ng.timer = setTimeout(() => { if (games.get(m.chat) === ng) { games.delete(m.chat); sock.sendMessage(m.chat, { text: `Waktu habis! Angkanya adalah *${ng.secret}*` }).catch(() => {}) } }, 300000)
    games.set(m.chat, ng)
    reply(`${ST.B('MASTERMIND')}\n━━━━━━━━━━━━━━━━━━━━\nAku menyimpan *4 angka berbeda* (0-9).\n\n• *tepat* = angka benar di tempat benar\n• *salah tempat* = angka ada, posisinya keliru\n\nKirim 4 angka untuk menebak, contoh: *4271*\n${MAX} kesempatan • 5 menit • ${prefix}mastermind papan / nyerah`)
  },
  before: async ({ sock, m, budy }) => {
    const g = games.get(m.chat); if (!g || !budy) return false
    const t = String(budy).trim()
    if (!/^\d{4}$/.test(t) || new Set(t).size !== 4) return false
    if (g.tries.some(x => x.g === t)) { await sock.sendMessage(m.chat, { text: `Angka *${t}* sudah pernah ditebak.` }, { quoted: m }); return true }
    const { hit, near } = score(g.secret, t); g.tries.push({ g: t, hit, near })
    if (hit === 4) {
      stop(m.chat)
      const reward = 60 * (MAX - g.tries.length + 1) + 100, u = R.get(m.sender)
      let bonus = '\n_(Buat karakter dengan .rpgstart untuk mendapat hadiah gold)_'
      if (u) { const got = R.addGold(u, reward); R.save(); bonus = `\n+${R.fmt(got)} gold RPG` }
      await sock.sendMessage(m.chat, { text: `Benar! @${m.sender.split('@')[0]} menebak *${g.secret}* dalam ${g.tries.length} kali.${bonus}\n\n${board(g)}`, mentions: [m.sender] }, { quoted: m })
      return true
    }
    if (g.tries.length >= MAX) { stop(m.chat); await sock.sendMessage(m.chat, { text: `Kesempatan habis! Angkanya adalah *${g.secret}*\n\n${board(g)}` }, { quoted: m }); return true }
    await sock.sendMessage(m.chat, { text: `${board(g)}\n\nSisa kesempatan: ${MAX - g.tries.length}` }, { quoted: m })
    return true
  },
}

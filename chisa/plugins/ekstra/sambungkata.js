/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .sambungkata — permainan grup: sambung kata dari huruf terakhir kata sebelumnya. Kata tak boleh diulang.
const { B } = require('../../lib/style'), E = require('../../lib/ekstra')
const START = ['kucing', 'matahari', 'sekolah', 'bunga', 'rumah', 'jendela', 'pelangi', 'sungai', 'gunung', 'pantai', 'kelapa', 'cermin', 'angin', 'bintang', 'kursi']
const games = new Map(), IDLE = 60e3
const nextLetter = (w) => { let i = w.length - 1; while (i > 0 && 'xqz'.includes(w[i])) i--; return w[i] }
const end = (chat) => { const g = games.get(chat); if (g) clearTimeout(g.tm); games.delete(chat) }
const board = (g) => Object.entries(g.pts).sort((a, b) => b[1] - a[1]).map(([j, n], i) => `${E.medal(i)} ${g.names[j]} — ${n} kata`).join('\n')
function finish(sock, chat, why) {
  const g = games.get(chat); if (!g) return null; end(chat)
  const tot = Object.keys(g.pts).length
  let t = `${B('SAMBUNG KATA SELESAI')} (${why})\n━━━━━━━━━━━━━━━━━━━━\nTotal ${g.used.size} kata • ${tot} pemain\n\n${tot ? board(g) : 'Tidak ada pemain.'}`
  const ranked = Object.entries(g.pts).sort((a, b) => b[1] - a[1])
  if (ranked.length) { const [j, n] = ranked[0], bonus = Math.min(20, n * 2); E.addScore(j, g.names[j], bonus, 'sambung'); t += `\n\n✦ Pemenang: *${g.names[j]}* (+${bonus} poin ke .topgame)` }
  return t
}
function arm(sock, chat, g) { clearTimeout(g.tm); g.tm = setTimeout(() => { const t = finish(sock, chat, 'tidak ada aktivitas'); if (t) sock.sendMessage(chat, { text: t }).catch(() => {}) }, IDLE) }
module.exports = {
  name: 'sambungkata', alias: ['sambung', 'sambungstop', 'wordchain'], category: 'ekstra', noLimit: true, group: true, cmds: ['sambungkata', 'sambungstop'],
  desc: 'Sambung kata di grup: huruf awal = huruf akhir kata sebelumnya (.sambungkata, .sambungstop)',
  run: async ({ sock, m, command, reply }) => {
    const g = games.get(m.chat)
    if (command === 'sambungstop') { if (!g) return reply('Tidak ada permainan sambung kata.'); return reply(finish(sock, m.chat, 'dihentikan')) }
    if (g) return reply(`${B('SAMBUNG KATA')} sedang berjalan\nKata terakhir: *${g.last.toUpperCase()}*\nSambung dengan huruf *${g.need.toUpperCase()}*`)
    const w = E.rnd(START), ng = { last: w, need: nextLetter(w), used: new Set([w]), pts: {}, names: {}, lastBy: null }
    games.set(m.chat, ng); arm(sock, m.chat, ng)
    return reply(`${B('SAMBUNG KATA')}\n━━━━━━━━━━━━━━━━━━━━\nKata pertama: *${w.toUpperCase()}*\nSambung dengan kata berawalan *${ng.need.toUpperCase()}*\n\n◇ Minimal 3 huruf, hanya huruf\n◇ Kata tidak boleh diulang\n◇ Tidak boleh dua kali berturut-turut oleh orang yang sama\n◇ Permainan berakhir jika sepi 60 detik\n_Stop: .sambungstop_`)
  },
  before: async ({ sock, m, budy, reply }) => {
    const g = games.get(m.chat); if (!g || !budy) return false
    const w = budy.trim().toLowerCase(); if (!/^[a-z]{3,20}$/.test(w) || !/[aiueo]/.test(w) || /(.)\1\1/.test(w) || w[0] !== g.need || g.lastBy === m.sender) return false
    if (g.used.has(w)) { await reply(`✕ *${w.toUpperCase()}* sudah dipakai.`); return true }
    g.used.add(w); g.last = w; g.need = nextLetter(w); g.lastBy = m.sender
    g.pts[m.sender] = (g.pts[m.sender] || 0) + 1; g.names[m.sender] = m.pushName || m.sender.split('@')[0]; arm(sock, m.chat, g)
    await reply(`◆ *${w.toUpperCase()}* (${g.names[m.sender]}: ${g.pts[m.sender]})\nBerikutnya huruf *${g.need.toUpperCase()}*`)
    return true
  },
}

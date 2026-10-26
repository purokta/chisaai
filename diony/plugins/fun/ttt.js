/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .ttt — tic-tac-toe lawan bot (minimax). Kamu = X, bot = O. Hiburan murni.
//   .ttt [mudah|sedang|sulit]  -> mulai   |   .ttt <1-9>  -> taruh X   |   .ttt stop
const ST = require('../../lib/style')
const { buildTttHtml } = require('../../lib/cards/ttt')
const HC = require('../../lib/htmlcard')
const games = new Map()   // chat|sender -> { b:[9], lv }
const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
const win = (b) => { for (const [x, y, z] of LINES) if (b[x] && b[x] === b[y] && b[y] === b[z]) return b[x]; return b.every(Boolean) ? 'draw' : null }
function minimax(b, turn, depth) {
  const w = win(b)
  if (w === 'O') return 10 - depth
  if (w === 'X') return depth - 10
  if (w === 'draw') return 0
  let best = turn === 'O' ? -99 : 99
  for (let i = 0; i < 9; i++) if (!b[i]) {
    b[i] = turn; const s = minimax(b, turn === 'O' ? 'X' : 'O', depth + 1); b[i] = null
    best = turn === 'O' ? Math.max(best, s) : Math.min(best, s)
  }
  return best
}
function botMove(b, lv) {
  const free = b.map((v, i) => v ? -1 : i).filter(i => i >= 0)
  if (lv === 'mudah' || (lv === 'sedang' && Math.random() < 0.45)) return free[Math.floor(Math.random() * free.length)]
  let best = -99, mv = free[0]
  for (const i of free) { b[i] = 'O'; const s = minimax(b, 'X', 1); b[i] = null; if (s > best) { best = s; mv = i } }
  return mv
}
const draw = (b) => { const c = (i) => b[i] === 'X' ? '❌' : b[i] === 'O' ? '⭕' : ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'][i]; return [0, 3, 6].map(r => c(r) + c(r + 1) + c(r + 2)).join('\n') }

module.exports = {
  name: 'ttt', alias: ['tictactoe', 'xo', 'oxo'], category: 'fun', cmds: ['ttt'], noLimit: true,
  desc: 'Tic-tac-toe lawan bot: .ttt [mudah|sedang|sulit], lalu .ttt <1-9>',
  run: async ({ sock, m, args, prefix, reply, pushname }) => {
    // tanpa argumen: kirim kartu interaktif (tombol "Lihat perincian"), membalas pesan pengirim. Gagal -> mode teks lama.
    if (!args[0]) {
      try { await sock.relayMessage(m.chat, HC.buildRichHtmlPayload(buildTttHtml({ botName: global.botname || 'Chisa AI' }), 'Click Me', { quoted: m }), {}); return } catch (e) { console.log('[ttt] kartu gagal:', e.message) }
    }
    const key = m.chat + '|' + m.sender, a = (args[0] || '').toLowerCase()
    if (['stop', 'nyerah', 'selesai'].includes(a)) return reply(games.delete(key) ? 'Permainan dihentikan.' : 'Tidak ada permainan berjalan.')
    let g = games.get(key)
    if (!g || ['mudah', 'sedang', 'sulit'].includes(a)) {
      g = { b: Array(9).fill(null), lv: ['mudah', 'sedang', 'sulit'].includes(a) ? a : 'sedang' }; games.set(key, g)
      return reply(`${ST.B('TIC TAC TOE')} (${g.lv})\n━━━━━━━━━━━━━━━━━━━━\n${draw(g.b)}\n\nKamu ❌. Pilih kotak: ${prefix}ttt <1-9>`)
    }
    const n = parseInt(a, 10)
    if (!(n >= 1 && n <= 9)) return reply(`Pilih kotak 1-9: ${prefix}ttt <1-9>\nBerhenti: ${prefix}ttt stop`)
    if (g.b[n - 1]) return reply('Kotak itu sudah terisi, pilih yang lain.')
    g.b[n - 1] = 'X'
    let w = win(g.b)
    if (!w) { g.b[botMove(g.b, g.lv)] = 'O'; w = win(g.b) }
    const out = `${ST.B('TIC TAC TOE')} (${g.lv})\n━━━━━━━━━━━━━━━━━━━━\n${draw(g.b)}\n\n`
    if (w) { games.delete(key); return reply(out + (w === 'X' ? '*Kamu menang!* Selamat.' : w === 'O' ? '*Bot menang.* Coba lagi?' : '*Seri.*') + `\n_Main lagi: ${prefix}ttt_`) }
    return reply(out + `Giliranmu: ${prefix}ttt <1-9>`)
  },
}

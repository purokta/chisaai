/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .c4 — Connect Four melawan bot. .c4 [mudah|sedang|sulit] untuk mulai, .c4 <1-7> untuk menjatuhkan keping
const { B } = require('../../lib/style')
const R = 6, C = 7, games = new Map(), TTL = 30 * 60 * 1000, LV = { mudah: 1, sedang: 3, sulit: 5 }
const empty = () => Array.from({ length: R }, () => Array(C).fill(0))
const drop = (b, c, who) => { for (let r = R - 1; r >= 0; r--) if (!b[r][c]) { b[r][c] = who; return r } return -1 }
const valid = (b) => [3, 2, 4, 1, 5, 0, 6].filter(c => !b[0][c])
function winner(b) {
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) { const v = b[r][c]; if (!v) continue
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) { let k = 1; while (k < 4) { const rr = r + dr * k, cc = c + dc * k; if (rr < 0 || rr >= R || cc < 0 || cc >= C || b[rr][cc] !== v) break; k++ } if (k === 4) return v } }
  return b[0].every(Boolean) ? 3 : 0
}
function score(b, who) {
  let s = 0; const opp = 3 - who
  for (let r = 0; r < R; r++) b[r][3] === who && (s += 3)
  const win = (cells) => { const a = cells.filter(x => x === who).length, o = cells.filter(x => x === opp).length, e = cells.filter(x => !x).length; if (a === 4) return 1000; if (a === 3 && e === 1) return 6; if (a === 2 && e === 2) return 2; if (o === 3 && e === 1) return -8; return 0 }
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) { const cells = []; for (let k = 0; k < 4; k++) { const rr = r + dr * k, cc = c + dc * k; if (rr < 0 || rr >= R || cc < 0 || cc >= C) break; cells.push(b[rr][cc]) } if (cells.length === 4) s += win(cells) }
  return s
}
function minimax(b, depth, a, be, max, bot) {
  const w = winner(b); if (w === bot) return 1e5 + depth; if (w === 3 - bot) return -1e5 - depth; if (w === 3 || !depth) return score(b, bot)
  let best = max ? -Infinity : Infinity
  for (const c of valid(b)) { const r = drop(b, c, max ? bot : 3 - bot), v = minimax(b, depth - 1, a, be, !max, bot); b[r][c] = 0
    if (max) { best = Math.max(best, v); a = Math.max(a, v) } else { best = Math.min(best, v); be = Math.min(be, v) } if (be <= a) break }
  return best
}
function botMove(b, depth) {
  let best = -Infinity, pick = valid(b)[0]; const cand = []
  for (const c of valid(b)) { const r = drop(b, c, 2), v = minimax(b, depth - 1, -Infinity, Infinity, false, 2); b[r][c] = 0; if (v > best) { best = v; cand.length = 0 } if (v === best) cand.push(c) }
  pick = cand[0]; if (depth <= 1 && cand.length > 1) pick = cand[Math.floor(Math.random() * cand.length)]
  return pick
}
const draw = (b) => '```\n 1  2  3  4  5  6  7\n' + b.map(r => r.map(v => (v === 1 ? ' ●' : v === 2 ? ' ○' : ' ·')).join(' ')).join('\n') + '\n```'
module.exports = {
  name: 'c4', alias: ['connect4', 'connectfour', 'empatsejajar'], category: 'fun', noLimit: true, cmds: ['c4'],
  desc: 'Connect Four (4 sejajar) melawan bot: level mudah, sedang, sulit',
  run: async ({ m, args, prefix, reply }) => {
    const key = m.chat + '|' + m.sender, a = String(args[0] || '').toLowerCase(), g = games.get(key)
    if (g && Date.now() - g.t > TTL) games.delete(key)
    const cur = games.get(key)
    if (a === 'stop' || a === 'menyerah') { if (!cur) return reply('Tidak ada permainan C4 yang aktif.'); games.delete(key); return reply('Permainan dihentikan. Bot menang secara teknis.') }
    if (!cur || LV[a]) {
      if (cur && !LV[a]) return reply(`Pakai ${prefix}c4 <1-7> untuk menjatuhkan keping.`)
      if (!cur && /^[1-7]$/.test(a)) { /* mulai otomatis dengan level sedang */ }
      if (!LV[a] && a && !/^[1-7]$/.test(a)) return reply(`✦ ${B('CONNECT FOUR')}\n${prefix}c4 mudah|sedang|sulit  — mulai\n${prefix}c4 <1-7>  — jatuhkan keping ke kolom\n${prefix}c4 stop  — berhenti\n\n● kamu, ○ bot. Susun 4 sejajar (mendatar, menurun, atau diagonal).`)
      const lvl = LV[a] ? a : 'sedang', ng = { b: empty(), lvl, t: Date.now() }; games.set(key, ng)
      if (!/^[1-7]$/.test(a)) return reply(`✦ ${B('CONNECT FOUR')} — level ${lvl}\n${draw(ng.b)}\nGiliranmu: ${prefix}c4 <1-7>`)
      args[0] = a; return module.exports.run({ m, args, prefix, reply })
    }
    const c = parseInt(a, 10) - 1; if (!(c >= 0 && c < C)) return reply(`✕ Pilih kolom 1–7.\n${draw(cur.b)}`)
    if (drop(cur.b, c, 1) < 0) return reply(`✕ Kolom ${c + 1} penuh.\n${draw(cur.b)}`)
    cur.t = Date.now(); let w = winner(cur.b)
    if (!w) { const bc = botMove(cur.b, LV[cur.lvl]); drop(cur.b, bc, 2); w = winner(cur.b); if (!w) return reply(`${draw(cur.b)}Bot menjatuhkan di kolom *${bc + 1}*. Giliranmu.`) }
    games.delete(key)
    return reply(`${draw(cur.b)}${w === 1 ? `✦ ${B('KAMU MENANG!')}` : w === 2 ? `✦ ${B('BOT MENANG.')}` : `${B('SERI.')}`} Main lagi: ${prefix}c4 ${cur.lvl}`)
  },
}

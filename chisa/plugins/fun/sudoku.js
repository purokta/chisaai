/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .sudoku [mudah|sedang|sulit]  Sudoku 9x9 dengan solusi unik. Isi: .sudoku <baris> <kolom> <angka>
const { B } = require('../../lib/style')
const games = new Map(), TTL = 60 * 60 * 1000
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] } return b }
const ok = (g, i, v) => { const r = (i / 9) | 0, c = i % 9, br = r - r % 3, bc = c - c % 3; for (let k = 0; k < 9; k++) { if (g[r * 9 + k] === v || g[k * 9 + c] === v || g[(br + ((k / 3) | 0)) * 9 + bc + k % 3] === v) return false } return true }
// hitung solusi (berhenti di `limit`); bila fill=true, grid diisi solusi pertama (urutan angka acak)
function solve(g, limit, fill) {
  let n = 0
  const go = () => {
    let best = -1, opts = null
    for (let i = 0; i < 81; i++) if (!g[i]) { const o = []; for (let v = 1; v <= 9; v++) if (ok(g, i, v)) o.push(v); if (!o.length) return; if (!opts || o.length < opts.length) { best = i; opts = o; if (o.length === 1) break } }
    if (best < 0) { n++; return n >= limit ? 'stop' : undefined }
    for (const v of fill ? shuffle(opts) : opts) { g[best] = v; const r = go(); if (r === 'stop') { if (!fill) g[best] = 0; return 'stop' } g[best] = 0 }
  }
  if (fill) { const keep = g.slice(); const r = go(); if (n === 0) g.splice(0, 81, ...keep); return n }
  go(); return n
}
const CLUES = { mudah: 40, sedang: 33, sulit: 27 }
function generate(level) {
  const sol = Array(81).fill(0); solve(sol, 1, true)
  const puz = sol.slice(); let clues = 81
  for (const i of shuffle([...Array(81).keys()])) {
    if (clues <= CLUES[level]) break
    const keep = puz[i]; puz[i] = 0; if (solve(puz.slice(), 2, false) !== 1) puz[i] = keep; else clues--
  }
  return { sol, puz }
}
function conflicts(g) { const bad = new Set(); for (let i = 0; i < 81; i++) if (g[i]) { const v = g[i]; g[i] = 0; if (!ok(g, i, v)) bad.add(i); g[i] = v } return bad }
function render(gm) {
  const g = gm.cur, L = ['    1 2 3   4 5 6   7 8 9', '  +-------+-------+-------+']
  for (let r = 0; r < 9; r++) {
    let row = `${r + 1} |`; for (let c = 0; c < 9; c++) { row += ' ' + (g[r * 9 + c] || '.'); if (c % 3 === 2) row += ' |' }
    L.push(row); if (r % 3 === 2) L.push('  +-------+-------+-------+')
  }
  return '```\n' + L.join('\n') + '\n```'
}
module.exports = {
  name: 'sudoku', alias: ['sdk'], category: 'fun', noLimit: true, cmds: ['sudoku'],
  desc: 'Sudoku 9x9 solusi unik (mudah / sedang / sulit) dengan cek, petunjuk, dan menyerah',
  generate, solve, conflicts, render, games,
  run: async ({ m, args, prefix, reply }) => {
    const key = m.chat + '|' + m.sender, a = String(args[0] || '').toLowerCase(), p = prefix + 'sudoku'; let g = games.get(key); if (g && Date.now() - g.t > TTL) { games.delete(key); g = null }
    if (CLUES[a] || (!g && !a) || a === 'baru') {
      if (g && !CLUES[a] && a !== 'baru') return reply(render(g))
      const lv = CLUES[a] ? a : 'sedang', { sol, puz } = generate(lv); g = { sol, given: puz.map(Boolean), cur: puz.slice(), lv, hint: 0, t: Date.now() }; games.set(key, g)
      return reply(`✦ ${B('SUDOKU')}  ${lv}\n${render(g)}Isi: ${p} <baris> <kolom> <angka>   contoh ${p} 3 5 7\nHapus: ${p} hapus <baris> <kolom> • ${p} cek • ${p} petunjuk • ${p} nyerah`)
    }
    if (!g) return reply(`Belum ada permainan. Mulai: ${p} mudah|sedang|sulit`)
    if (a === 'nyerah') { games.delete(key); const s = { cur: g.sol }; return reply(`Solusi:\n${render(s)}`) }
    if (a === 'cek') { const bad = conflicts(g.cur), wrong = g.cur.filter((v, i) => v && !g.given[i] && v !== g.sol[i]).length, empty = g.cur.filter(v => !v).length
      return reply(`${bad.size ? `Ada ${bad.size} angka yang bentrok di baris/kolom/kotak.` : 'Tidak ada bentrokan.'}\n${wrong ? `${wrong} angka isianmu tidak sesuai solusi.` : 'Semua isianmu sejauh ini benar.'}\nKosong: ${empty}`) }
    if (a === 'petunjuk') { const e = g.cur.map((v, i) => (v ? -1 : i)).filter(i => i >= 0), w = g.cur.map((v, i) => (v && !g.given[i] && v !== g.sol[i] ? i : -1)).filter(i => i >= 0), i = (w.length ? w : e)[0]
      if (i === undefined) return reply('Tidak ada yang perlu dipetunjuki.'); g.cur[i] = g.sol[i]; g.hint++; return reply(`Petunjuk: baris ${((i / 9) | 0) + 1} kolom ${i % 9 + 1} = ${g.sol[i]}\n${render(g)}`) }
    const del = a === 'hapus', n = del ? args.slice(1) : args, r = parseInt(n[0], 10), c = parseInt(n[1], 10), v = del ? 0 : parseInt(n[2], 10)
    if (!(r >= 1 && r <= 9 && c >= 1 && c <= 9) || (!del && !(v >= 1 && v <= 9))) return reply(`Format: ${p} <baris 1-9> <kolom 1-9> <angka 1-9>\n${render(g)}`)
    const i = (r - 1) * 9 + c - 1; if (g.given[i]) return reply('Kotak itu angka bawaan soal dan tidak bisa diubah.')
    g.cur[i] = v; g.t = Date.now()
    if (g.cur.every(Boolean) && !conflicts(g.cur).size) { games.delete(key); return reply(`✦ ${B('SUDOKU SELESAI')}\n${render(g)}Selesai tanpa kesalahan${g.hint ? ` dengan ${g.hint} petunjuk` : ' dan tanpa petunjuk'}.`) }
    return reply(render(g))
  },
}

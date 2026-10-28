/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .matriks det|inv|transpos|kali|solve — kalkulator matriks. Baris dipisah ; atau |, matriks dipisah *
const { B } = require('../../lib/style')
const fmt = (x) => { const r = Math.abs(x) < 1e-10 ? 0 : x; return String(+r.toFixed(6)) }
function parse(s) {
  const rows = String(s).split(/[;|\n]/).map(r => r.trim()).filter(Boolean).map(r => r.split(/[\s,]+/).filter(Boolean).map(x => Number(x.replace(',', '.'))))
  if (!rows.length || rows.some(r => r.some(x => !Number.isFinite(x)) || r.length !== rows[0].length)) return null
  if (rows.length > 6 || rows[0].length > 7) return null
  return rows
}
const show = (M) => '```\n' + M.map(r => r.map(fmt).join('  ')).join('\n') + '\n```'
function det(M) {
  const n = M.length, A = M.map(r => [...r]); let d = 1
  for (let i = 0; i < n; i++) {
    let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r
    if (Math.abs(A[p][i]) < 1e-12) return 0
    if (p !== i) { [A[p], A[i]] = [A[i], A[p]]; d = -d }
    d *= A[i][i]
    for (let r = i + 1; r < n; r++) { const k = A[r][i] / A[i][i]; for (let c = i; c < n; c++) A[r][c] -= k * A[i][c] }
  }
  return d
}
function gaussJordan(A) {   // kembalikan {M, rank, pivots}
  const R = A.length, C = A[0].length; let row = 0; const piv = []
  for (let c = 0; c < C && row < R; c++) {
    let p = row; for (let r = row + 1; r < R; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r
    if (Math.abs(A[p][c]) < 1e-10) continue
    [A[p], A[row]] = [A[row], A[p]]
    const v = A[row][c]; A[row] = A[row].map(x => x / v)
    for (let r = 0; r < R; r++) if (r !== row) { const k = A[r][c]; if (k) A[r] = A[r].map((x, i) => x - k * A[row][i]) }
    piv.push(c); row++
  }
  return { M: A, rank: row, piv }
}
module.exports = {
  name: 'matriks', alias: ['matrix', 'determinan', 'invers'], category: 'praktis', noLimit: true, cmds: ['matriks'],
  desc: 'Kalkulator matriks: determinan, invers, transpos, perkalian, dan sistem persamaan linear',
  run: async ({ args, text, prefix, reply }) => {
    const sub = (args[0] || '').toLowerCase(), body = text.slice(args[0] ? text.toLowerCase().indexOf(sub) + sub.length : 0).trim()
    const help = `✦ ${B('MATRIKS')}\n${prefix}matriks det 1 2; 3 4\n${prefix}matriks inv 2 1; 5 3\n${prefix}matriks transpos 1 2 3; 4 5 6\n${prefix}matriks kali 1 2; 3 4 * 5 6; 7 8\n${prefix}matriks solve 2 1 5; 1 -1 1\n_Baris dipisah ; — matriks kedua setelah *. solve = matriks augmented [A|b]._`
    if (!['det', 'inv', 'transpos', 'kali', 'solve'].includes(sub)) return reply(help)
    if (sub === 'kali') {
      const [a, b] = body.split('*').map(parse); if (!a || !b) return reply(`✕ Format salah. Contoh: ${prefix}matriks kali 1 2; 3 4 * 5 6; 7 8`)
      if (a[0].length !== b.length) return reply(`✕ Kolom matriks pertama (${a[0].length}) harus sama dengan baris matriks kedua (${b.length}).`)
      return reply(`✦ ${B('HASIL KALI')}\n${show(a.map(r => b[0].map((_, j) => r.reduce((s, x, k) => s + x * b[k][j], 0))))}`)
    }
    const M = parse(body); if (!M) return reply(`✕ Matriks tidak valid (maks 6×7, tiap baris sama panjang).\n\n${help}`)
    if (sub === 'transpos') return reply(`✦ ${B('TRANSPOS')}\n${show(M[0].map((_, j) => M.map(r => r[j])))}`)
    if (sub === 'solve') {
      const R = M.length, C = M[0].length; if (C !== R + 1) return reply(`✕ Matriks augmented harus ${R} baris × ${R + 1} kolom (koefisien + hasil).`)
      const { M: G, rank, piv } = gaussJordan(M.map(r => [...r]))
      if (piv.includes(R)) return reply('✕ Sistem *tidak punya solusi* (persamaan saling bertentangan).')
      if (rank < R) return reply('✕ Sistem punya *tak hingga solusi* (persamaan tidak independen).')
      return reply(`✦ ${B('SOLUSI SISTEM')}\n` + G.map((r, i) => `${'xyzuvw'[i] || 'x' + (i + 1)} = *${fmt(r[R])}*`).join('\n'))
    }
    if (M.length !== M[0].length) return reply('✕ Determinan dan invers hanya untuk matriks persegi.')
    const d = det(M)
    if (sub === 'det') return reply(`✦ ${B('DETERMINAN')}\n${show(M)}\ndet = *${fmt(d)}*`)
    if (Math.abs(d) < 1e-10) return reply('✕ Matriks singular (determinan 0), tidak punya invers.')
    const n = M.length, G = gaussJordan(M.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))])).M
    return reply(`✦ ${B('INVERS')}\n${show(G.map(r => r.slice(n)))}det = ${fmt(d)}`)
  },
}

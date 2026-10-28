/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// TAKESHI — kalkulator aman (tanpa eval): + - * / ^ % mod, akar, persen, fungsi dasar
const NU = require('../../lib/npcutil')
const FN = { sqrt: Math.sqrt, akar: Math.sqrt, sin: (x) => Math.sin(x * Math.PI / 180), cos: (x) => Math.cos(x * Math.PI / 180), tan: (x) => Math.tan(x * Math.PI / 180), log: Math.log10, ln: Math.log, abs: Math.abs, round: Math.round, floor: Math.floor, ceil: Math.ceil, fact: (n) => { if (n < 0 || n > 170 || n % 1) throw new Error('faktorial hanya 0-170 bulat'); let r = 1; for (let i = 2; i <= n; i++) r *= i; return r } }
const CONST = { pi: Math.PI, e: Math.E }
function num(tok) { let s = tok; if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.'); else if (s.includes(',')) s = s.replace(',', '.'); else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ''); return parseFloat(s) }
function evaluate(src) {
  let s = String(src).toLowerCase().replace(/(\d[\d.,]*)\s*%\s*dari\s*(\d[\d.,]*)/g, '($1%)*($2)').replace(/×/g, '*').replace(/÷/g, '/').replace(/(?<=[\d)])\s*x\s*(?=[\d(])/g, '*').replace(/\*\*/g, '^').replace(/(?<=[\d)])\s*:\s*(?=[\d(])/g, '/')
  const tk = []; const re = /\s*(?:(\d[\d.,]*|[.,]\d+)|([a-z]+)|(\^|\*|\/|\+|-|\(|\)|%))/y; let m
  while (re.lastIndex < s.length && (m = re.exec(s))) tk.push(m[1] ? { n: num(m[1]) } : m[2] ? { w: m[2] } : { o: m[3] }); if (re.lastIndex < s.trim().length && s.slice(re.lastIndex).trim()) throw new Error('karakter tidak dikenali')
  let i = 0, depth = 0; const peek = () => tk[i], isO = (o) => tk[i] && tk[i].o === o
  function expr() { let [v] = term(); for (;;) { if (isO('+') || isO('-')) { const op = tk[i++].o, [r, p] = term(); const rv = p ? v * r : r; v = op === '+' ? v + rv : v - rv } else return [v, false] } }
  function term() { let [v, p] = unary(); for (;;) { if (isO('*') || isO('/') || (peek() && peek().w === 'mod')) { const op = tk[i++].o || 'mod', [r] = unary(); if (op === '/' && r === 0) throw new Error('dibagi nol'); v = op === '*' ? v * r : op === '/' ? v / r : v % r; p = false } else return [v, p] } }
  function unary() { if (isO('-')) { i++; const [v] = unary(); return [-v, false] } if (isO('+')) { i++; return unary() } return power() }
  function power() { let [v, p] = post(); if (isO('^')) { i++; const [e] = unary(); return [Math.pow(v, e), false] } return [v, p] }
  function post() { let [v] = prim(), p = false; while (isO('%')) { i++; v /= 100; p = true } return [v, p] }
  function prim() {
    if (++depth > 40) throw new Error('terlalu bersarang'); const t = tk[i++]; let r
    if (!t) throw new Error('ekspresi belum lengkap')
    if (t.n !== undefined) r = t.n
    else if (t.o === '(') { r = expr()[0]; if (!isO(')')) throw new Error('kurung belum ditutup'); i++ }
    else if (t.w && CONST[t.w] !== undefined) r = CONST[t.w]
    else if (t.w && FN[t.w]) { if (!isO('(')) throw new Error(`pakai kurung: ${t.w}(...)`); i++; const a = expr()[0]; if (!isO(')')) throw new Error('kurung belum ditutup'); i++; r = FN[t.w](a) }
    else throw new Error(`tidak dimengerti: ${t.w || t.o}`)
    depth--; return [r, false]
  }
  const [v] = expr(); if (i < tk.length) throw new Error('ekspresi tidak lengkap/aneh'); if (!Number.isFinite(v)) throw new Error('hasil tidak terdefinisi'); return v
}
const fmt = (v) => { const r = Math.abs(v) >= 1e15 || (Math.abs(v) < 1e-7 && v !== 0) ? v.toExponential(6) : (+v.toPrecision(12)).toLocaleString('id-ID', { maximumFractionDigits: 10 }); return r }

module.exports = {
  name: 'hit',
  alias: ['hit', 'math'],
  category: 'dunia',
  cmds: [],
  desc: 'Kalkulator: + - × ÷ ^ % akar, persen, fungsi (Takeshi)',
  run: async ({ m, text, prefix, reply }) => {
    const jid = m.sender, head = NU.head('takeshi', jid)
    if (!text) return reply(`${head}\n\n*KALKULATOR*\nContoh:\n${prefix}hitung 12*(3+4)\n${prefix}hitung 15% dari 200000\n${prefix}hitung 1.500.000 + 10%   (= tambah 10%)\n${prefix}hitung akar(144) + 2^10\n${prefix}hitung sin(30) + fact(5)\n\nOperator: + - * x / : ^ mod %\nFungsi: akar sqrt sin cos tan (derajat) log ln abs round floor ceil fact\nKonstanta: pi, e`)
    if (text.length > 200) return reply('Ekspresi terlalu panjang (maks 200 karakter).')
    try { const v = evaluate(text); return reply(`${head}\n\n🧮 ${text.trim()}\n= *${fmt(v)}*${NU.bump(jid, 'takeshi', 1)}`) }
    catch (e) { return reply(`${head}\n\nHmm, ada yang salah: _${e.message}_\nCoba: ${prefix}hitung (5+3)*2`) }
  },
}
module.exports.evaluate = evaluate

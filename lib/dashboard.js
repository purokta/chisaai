// Dashboard ala server di layar Termux: status, waktu, RAM, statistik, dan aktivitas terakhir.
// Aktif otomatis setelah bot terhubung (supaya kode pairing tetap terbaca). Matikan: settings.js -> dashboard: false
const os = require('os')
const config = require('../config')
const quiet = require('./quiet')

const S = { wa: config.whatsapp?.enabled === false ? 'off' : 'wait', tg: config.telegram?.token ? 'wait' : 'off', msgs: 0, cmds: 0, errs: 0 }
const ring = []
const MAX = 60
let timer = null
let active = false
const real = { log: console.log, info: console.info, warn: console.warn, error: console.error }

const useColor = !process.env.NO_COLOR
const c = (n, s) => (useColor ? `\x1b[${n}m${s}\x1b[0m` : String(s))
const BLOOD = /256|truecolor|24bit/i.test(String(process.env.TERM) + String(process.env.COLORTERM || '')) ? '1;38;5;124' : '1;31'
const strip = s => String(s).replace(/\x1b\[[0-9;]*m/g, '')
const vlen = s => Array.from(strip(s)).length
const fit = (s, w) => {
  // potong berdasarkan lebar tampak (abaikan kode warna)
  let out = '', n = 0
  for (let i = 0; i < s.length;) {
    const m = /^\x1b\[[0-9;]*m/.exec(s.slice(i))
    if (m) { out += m[0]; i += m[0].length; continue }
    const ch = String.fromCodePoint(s.codePointAt(i))
    if (n >= w) break
    out += ch; n++; i += ch.length
  }
  return out + (useColor ? '\x1b[0m' : '')
}

function set(key, val) { if (key in S) S[key] = val }
function count(kind) { if (kind in S) S[kind]++ }

const dot = v => v === 'on' ? c(92, '● online') : v === 'wait' ? c(93, '◌ menunggu') : v === 'down' ? c(91, '● putus') : c(90, '○ nonaktif')

function bar(pct, w = 10) {
  const f = Math.max(0, Math.min(w, Math.round((pct / 100) * w)))
  const col = pct < 60 ? 92 : pct < 85 ? 93 : 91
  return c(col, '█'.repeat(f)) + c(90, '░'.repeat(w - f))
}

function render() {
  const status = require('./status')
  const cols = Math.max(30, Math.min(process.stdout.columns || 60, 80))
  const rows = process.stdout.rows || 30
  const t = status.now(), sv = status.server()
  const lineH = (title) => {
    const left = `━━ ${title} `
    return c(90, left + '━'.repeat(Math.max(0, cols - 1 - vlen(left))))
  }
  const out = []
  out.push(c(BLOOD, ' KUCHIBA CHISA') + c(90, '  v' + require('../package.json').version + '  by ') + c(95, 'sipur'))
  out.push(lineH('STATUS'))
  out.push(` WhatsApp  ${dot(S.wa)}`)
  out.push(` Telegram  ${dot(S.tg)}`)
  out.push(lineH('SERVER'))
  out.push(` Waktu   ${t.pendek} • ${t.jam}`)
  out.push(` Aktif   ${status.botUptime ? status.botUptime() : ''} (bot) • ${sv.up} (HP)`)
  out.push(` RAM     ${bar(sv.ramPct)} ${sv.ramPct}%  ${sv.ram}`)
  out.push(` Bot     ${sv.botRam} • ${sv.cpu} • ${sv.platform}`)
  out.push(lineH('STATISTIK'))
  out.push(` Pesan ${c(96, S.msgs)}  •  Perintah ${c(95, S.cmds)}  •  Error ${S.errs ? c(91, S.errs) : c(90, 0)}`)
  out.push(lineH('AKTIVITAS'))
  const room = Math.max(3, rows - out.length - 2)
  const tail = ring.slice(-room)
  for (const l of tail) out.push(' ' + l)
  while (out.length < rows - 1 && tail.length < room) out.push('')
  return out.slice(0, rows - 1).map(l => fit(l, cols - 1))
}

function draw() {
  try {
    const lines = render()
    process.stdout.write('\x1b[H' + lines.map(l => l + '\x1b[K').join('\n') + '\x1b[J')
  } catch {}
}

function push(args) {
  const s = args.map(a => (typeof a === 'string' ? a : require('util').inspect(a, { depth: 1 }))).join(' ')
  for (const l of s.split('\n')) if (l.trim()) ring.push(l)
  while (ring.length > MAX) ring.shift()
}

function start() {
  if (active) return
  if (config.dashboard === false || process.env.NO_DASH || !process.stdout.isTTY) return
  active = true
  console.log = (...a) => { if (!quiet.argNoise(a)) push(a) }
  console.info = console.log
  console.warn = console.log
  console.error = console.log
  process.stdout.write('\x1b[2J\x1b[H\x1b[?25l')
  draw()
  timer = setInterval(draw, 1000)
  timer.unref?.()
  const restore = () => { try { process.stdout.write('\x1b[?25h') } catch {} }
  process.on('exit', restore)
  process.stdout.on('resize', () => { try { process.stdout.write('\x1b[2J') } catch {} })
}

function stop() {
  if (!active) return
  active = false
  clearInterval(timer)
  Object.assign(console, real)
  try { process.stdout.write('\x1b[?25h\x1b[2J\x1b[H') } catch {}
}

module.exports = { start, stop, set, count, S, _render: render, _push: push }

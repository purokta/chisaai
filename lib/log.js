// Log singkat berwarna + banner awal. Tanpa dependensi.
const useColor = !process.env.NO_COLOR && (process.stdout.isTTY || process.env.FORCE_COLOR)
const c = (n, s) => (useColor ? `\x1b[${n}m${s}\x1b[0m` : String(s))
const col = {
  dim: s => c(90, s), red: s => c(91, s), green: s => c(92, s), yellow: s => c(93, s),
  blue: s => c(94, s), magenta: s => c(95, s), cyan: s => c(96, s), bold: s => c(1, s)
}
const hhmm = () => new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }).replace(/\./g, ':')
const line = (tag, color, msg) => console.log(`${col.dim(hhmm())} ${color(tag)} ${msg}`)

const dash = () => { try { return require('./dashboard') } catch { return null } }
const log = {
  info: m => line('•', col.cyan, m),
  ok: m => line('✓', col.green, m),
  warn: m => line('!', col.yellow, m),
  err: m => { dash()?.count('errs'); line('✗', col.red, m) },
  // satu baris per perintah: waktu ▸ .cmd  pengirim  durasi
  cmd(name, who, ms, group) {
    dash()?.count('cmds')
    const speed = ms < 800 ? col.green : ms < 2500 ? col.yellow : col.red
    console.log(`${col.dim(hhmm())} ${col.magenta('▸')} ${col.bold(col.cyan('.' + name))} ${col.dim(group ? 'grup' : 'pribadi')} ${col.dim(who)} ${speed(ms + 'ms')}`)
  }
}

// huruf blok 5x5
const F = {
  K: ['█  █ ', '█ █  ', '██   ', '█ █  ', '█  █ '],
  U: ['█   █', '█   █', '█   █', '█   █', ' ███ '],
  C: [' ████', '█    ', '█    ', '█    ', ' ████'],
  H: ['█   █', '█   █', '█████', '█   █', '█   █'],
  I: ['█████', '  █  ', '  █  ', '  █  ', '█████'],
  B: ['████ ', '█   █', '████ ', '█   █', '████ '],
  A: [' ███ ', '█   █', '█████', '█   █', '█   █'],
  S: [' ████', '█    ', ' ███ ', '    █', '████ ']
}
const big = word => {
  const rows = ['', '', '', '', '']
  for (const ch of word) for (let i = 0; i < 5; i++) rows[i] += (F[ch][i] || '     ') + ' '
  return rows.map(r => r.replace(/\s+$/, ''))
}
// merah darah (256 warna; ada cadangan merah biasa)
const BLOOD = useColor && /256|truecolor|24bit/i.test(process.env.TERM + (process.env.COLORTERM || '')) ? '1;38;5;124' : '1;31'

function banner(version) {
  const out = ['']
  for (const w of ['KUCHIBA', 'CHISA']) {
    big(w).forEach(r => out.push(c(BLOOD, r)))
    out.push('')
  }
  out.push(col.dim('   by ') + col.magenta('sipur') + col.dim(version ? `  •  v${version}` : ''))
  out.push('')
  console.log(out.join('\n'))
}

module.exports = { log, col, banner }

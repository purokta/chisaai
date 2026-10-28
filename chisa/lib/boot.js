/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Tampilan konsol Chisa — banner gradasi, panel status, tanpa dependensi (ANSI murni).
// Otomatis polos kalau terminal tidak mendukung warna (NO_COLOR / bukan TTY penuh).
const os = require('os')
const COLOR = !process.env.NO_COLOR && process.env.TERM !== 'dumb'
const rgb = (r, g, b, t) => COLOR ? `\x1b[38;2;${r};${g};${b}m${t}\x1b[0m` : t
const dim = (t) => COLOR ? `\x1b[2m${t}\x1b[0m` : t
const bold = (t) => COLOR ? `\x1b[1m${t}\x1b[0m` : t
const ok = (t) => COLOR ? `\x1b[32m${t}\x1b[0m` : t
const warn = (t) => COLOR ? `\x1b[33m${t}\x1b[0m` : t
// gradasi emas → ungu anggur (nuansa Chisa)
const grad = (text, from = [255, 200, 87], to = [150, 70, 200]) => {
  const chars = Array.from(text), n = Math.max(1, chars.length - 1)
  return chars.map((ch, i) => ch === ' ' ? ch : rgb(...from.map((v, k) => Math.round(v + (to[k] - v) * i / n)), ch)).join('')
}
const ART = [
  '██████╗ ██╗ ██████╗ ███╗   ██╗██╗   ██╗███████╗██╗   ██╗███████╗',
  '██╔══██╗██║██╔═══██╗████╗  ██║╚██╗ ██╔╝██╔════╝██║   ██║██╔════╝',
  '██║  ██║██║██║   ██║██╔██╗ ██║ ╚████╔╝ ███████╗██║   ██║███████╗',
  '██║  ██║██║██║   ██║██║╚██╗██║  ╚██╔╝  ╚════██║██║   ██║╚════██║',
  '██████╔╝██║╚██████╔╝██║ ╚████║   ██║   ███████║╚██████╔╝███████║',
  '╚═════╝ ╚═╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚══════╝ ╚═════╝ ╚══════╝',
]
const pad = (s, n) => String(s).padEnd(n)
const row = (k, v) => `  ${dim('│')} ${rgb(255, 200, 87, pad(k, 11))} ${v}`

function banner({ version = '4.3', plugins = 0, vault = null } = {}) {
  const w = process.stdout.columns || 80
  const lines = []
  if (w >= 70) { lines.push(''); for (let i = 0; i < ART.length; i++) lines.push('  ' + grad(ART[i], [255, 200, 87 - i * 8], [150 - i * 4, 70, 200])) }
  else lines.push('', '  ' + bold(grad('✦ D I O N Y S U S')))
  lines.push('  ' + dim(`v${version} • WhatsApp bot • Vault + Shield`), '')
  lines.push(`  ${dim('┌─ sistem ' + '─'.repeat(30))}`)
  lines.push(row('Node', `${process.version} • ${os.platform()} ${os.arch()} • ${os.cpus().length} core`))
  lines.push(row('Memori', `${(process.memoryUsage().rss / 1048576).toFixed(0)} MB dipakai • ${(os.totalmem() / 1073741824).toFixed(1)} GB total`))
  lines.push(row('Plugin', ok(`${plugins} dimuat`)))
  if (vault) {
    lines.push(row('Vault', vault.enabled ? ok(`aktif • ${vault.count} snapshot • ${vault.dbFiles} database dijaga`) : warn('nonaktif')))
    if (vault.unclean) lines.push(row('Pemulihan', warn('proses sebelumnya mati mendadak — data diperiksa')))
    if (vault.healed && vault.healed.length) lines.push(row('Self-heal', warn(`${vault.healed.length} item dipulihkan otomatis`)))
  }
  lines.push(`  ${dim('└' + '─'.repeat(40))}`, '')
  console.log(lines.join('\n'))
}

function online(name) {
  const t = new Date().toLocaleTimeString('id-ID', { hour12: false, timeZone: (global.settingsDefault && global.settingsDefault.timezone) || 'Asia/Jakarta' })
  console.log(`\n  ${grad('◆ ' + String(name).replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '').trim() + ' ONLINE')}  ${dim(t)}\n`)
}

module.exports = { banner, online, grad }

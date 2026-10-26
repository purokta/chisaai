/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Dionysus Owner UI — kartu logo bergaya terminal hacker (SVG -> PNG), bilah ASCII, dan format teks konsol.
const sharp = require('./sharp.js')
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const MONO = "'DejaVu Sans Mono', 'Liberation Mono', 'Courier New', monospace"
const G = '#00ff9c', G2 = '#00c97a', DIM = '#0a6b45', CY = '#00e5ff', MG = '#ff2e88', AMB = '#ffd166'

const ART = [
  '██████╗ ██╗ ██████╗ ███╗   ██╗██╗   ██╗███████╗██╗   ██╗███████╗',
  '██╔══██╗██║██╔═══██╗████╗  ██║╚██╗ ██╔╝██╔════╝██║   ██║██╔════╝',
  '██║  ██║██║██║   ██║██╔██╗ ██║ ╚████╔╝ ███████╗██║   ██║███████╗',
  '██║  ██║██║██║   ██║██║╚██╗██║  ╚██╔╝  ╚════██║██║   ██║╚════██║',
  '██████╔╝██║╚██████╔╝██║ ╚████║   ██║   ███████║╚██████╔╝███████║',
  '╚═════╝ ╚═╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚══════╝ ╚═════╝ ╚══════╝',
]

// hujan kode deterministik (seed tetap supaya tidak berkedip antar render)
function rain(w, h) {
  let seed = 1337; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296
  const chars = '01ABCDEF0123456789<>/\\{}[]#$%&*+=', cols = Math.floor(w / 18), out = []
  for (let c = 0; c < cols; c++) {
    const len = 4 + Math.floor(rnd() * 11), y0 = Math.floor(rnd() * (h / 16))
    for (let i = 0; i < len; i++) {
      const ch = chars[Math.floor(rnd() * chars.length)], y = (y0 + i) * 17 + 14
      if (y > h) break
      out.push(`<text x="${c * 18 + 4}" y="${y}" font-size="14" fill="${G}" opacity="${(0.05 + 0.32 * (i / len) ** 2).toFixed(2)}">${esc(ch)}</text>`)
    }
  }
  return out.join('')
}

// mata Horus bergaya wireframe, bersinar
function eye(cx, cy, s = 1) {
  return `<g transform="translate(${cx} ${cy}) scale(${s})" fill="none" stroke="${G}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)">
    <path d="M-90 0 C-50 -52 50 -52 90 0 C50 40 -50 40 -90 0 Z"/>
    <circle cx="0" cy="-2" r="24"/><circle cx="0" cy="-2" r="9" fill="${G}"/>
    <path d="M-62 -34 C-70 -52 -52 -66 -34 -58" stroke="${CY}"/>
    <path d="M-20 38 C-18 62 -2 76 14 70 C24 66 26 56 20 50" stroke="${MG}"/>
    <path d="M60 28 L108 42 L96 70" stroke="${CY}"/>
    <path d="M-90 0 L-118 0" stroke="${G2}"/>
  </g>`
}

// kartu logo + status. opts: { name, role, line }
async function logoCard({ name = 'OWNER', role = 'OWNER', stats = {} } = {}) {
  const W = 1000, H = 640
  const art = ART.map((l, i) => `<text x="${(W - 64 * 9.6) / 2}" y="${186 + i * 18}" font-size="16" xml:space="preserve">${esc(l)}</text>`).join('')
  const rows = [
    ['ACCESS', 'GRANTED', G], ['USER', String(name).slice(0, 22).toUpperCase(), CY], ['ROLE', String(role).toUpperCase(), AMB],
    ['USERS', String(stats.users ?? '-'), G], ['CMD', String(stats.commands ?? '-'), G], ['HEALTH', stats.health != null ? stats.health + '/100' : '-', G],
  ]
  const info = rows.map((r, i) => `<text x="${150 + (i % 3) * 270}" y="${520 + Math.floor(i / 3) * 34}" font-size="18" xml:space="preserve"><tspan fill="${DIM}">${esc(r[0].padEnd(8, ' '))}</tspan><tspan fill="${r[2]}" font-weight="bold">${esc(r[1])}</tspan></text>`).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${MONO}">
  <defs>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <radialGradient id="vg" cx="50%" cy="46%" r="75%"><stop offset="0" stop-color="#03150e"/><stop offset="1" stop-color="#000"/></radialGradient>
    <pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1.4" fill="#000" opacity="0.38"/></pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#vg)"/>
  ${rain(W, H)}
  <rect x="14" y="14" width="${W - 28}" height="${H - 28}" fill="none" stroke="${DIM}" stroke-width="1.5"/>
  <path d="M14 56V14h42M${W - 56} 14h42v42M${W - 14} ${H - 56}v42h-42M56 ${H - 14}H14v-42" fill="none" stroke="${G}" stroke-width="3" filter="url(#glow)"/>
  <text x="34" y="44" font-size="14" fill="${G2}">root@chisa:~# ./report --owner --secure</text>
  <text x="${W - 34}" y="44" font-size="14" fill="${G2}" text-anchor="end">[ TLS 1.3 • AES-256 • SHIELD:ON ]</text>
  ${eye(W / 2, 86, 0.78)}
  <g fill="${MG}" opacity="0.55" transform="translate(-3 0)">${art}</g>
  <g fill="${CY}" opacity="0.55" transform="translate(3 0)">${art}</g>
  <g fill="${G}" filter="url(#glow)">${art}</g>
  <text x="${W / 2}" y="${186 + 6 * 18 + 40}" font-size="26" fill="${G}" text-anchor="middle" font-weight="bold" filter="url(#glow)" letter-spacing="6">OWNER REPORT CONSOLE</text>
  <text x="${W / 2}" y="${186 + 6 * 18 + 72}" font-size="15" fill="${G2}" text-anchor="middle" letter-spacing="3">// activity &amp; insight terminal //</text>
  <line x1="120" y1="478" x2="${W - 120}" y2="478" stroke="${DIM}" stroke-dasharray="6 6"/>
  ${info}
  <text x="34" y="${H - 28}" font-size="13" fill="${DIM}">session ${esc(Date.now().toString(16).toUpperCase())}</text>
  <text x="${W - 34}" y="${H - 28}" font-size="13" fill="${G2}" text-anchor="end">${esc(new Date().toLocaleString('id-ID', { timeZone: (global.settingsDefault || {}).timezone || 'Asia/Jakarta', hour12: false }))}<tspan fill="${G}"> █</tspan></text>
  <rect width="${W}" height="${H}" fill="url(#scan)"/>
</svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

// ── bantu teks konsol ──
const bar = (v, max, len = 12) => { const f = Math.max(0, Math.min(len, Math.round((v / Math.max(1e-9, max)) * len))); return '█'.repeat(f) + '░'.repeat(len - f) }
const spark = (arr) => { const c = '▁▂▃▄▅▆▇█', mx = Math.max(1, ...arr); return arr.map(v => c[Math.min(7, Math.floor(v / mx * 7.999))]).join('') }
const fmt = (n) => Number(n || 0).toLocaleString('id-ID')
const HR = '━━━━━━━━━━━━━━━━━━━━'
const box = (title, rows) => `✦ ${title}\n${HR}\n${rows.join('\n')}`
const ago = (ts) => {
  if (!ts) return 'belum ada'
  const min = Math.floor(Math.max(0, Date.now() - ts) / 60000)
  if (min < 1) return 'baru saja'; if (min < 60) return `${min} mnt lalu`
  const h = Math.floor(min / 60); if (h < 24) return `${h} jam lalu`
  return `${Math.floor(h / 24)} hari lalu`
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
module.exports = { logoCard, bar, spark, fmt, HR, box, ago, sleep, G, CY, MG, AMB }

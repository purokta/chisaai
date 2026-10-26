/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// KARTU PING (canvas SVG -> PNG lewat sharp) — gaya terminal "hacker-profesional" berbingkai emas Dionysus
const sharp = require('./sharp.js')
const AN = require('./ancientsvg'), ST = require('./style')

const MONO = "'JetBrains Mono','DejaVu Sans Mono','Liberation Mono','Courier New',monospace"
const COL = { ok: '#34d399', warn: '#fbbf24', bad: '#f87171', cy: '#22d3ee', dim: '#6b7aa8', txt: '#dbe4ff', panel: '#050a18' }
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const cut = (s, n) => { s = String(s ?? ''); return s.length > n ? s.slice(0, n - 1) + '…' : s }

// riwayat latensi (memori proses) untuk grafik sparkline
const HIST = []
const pushHist = (v) => { HIST.push(v); while (HIST.length > 24) HIST.shift() }

// status warna: rendah = bagus. t = [batas ok, batas warn]
const level = (v, t) => v <= t[0] ? COL.ok : v <= t[1] ? COL.warn : COL.bad
const tag = (c) => c === COL.ok ? 'OK' : c === COL.warn ? 'WARN' : 'CRIT'

// bar bersegmen 20 blok
function segBar(x, y, w, ratio, color) {
  const n = 20, gap = 3, bw = (w - gap * (n - 1)) / n, f = Math.max(0, Math.min(n, Math.round(ratio * n)))
  let o = ''
  for (let i = 0; i < n; i++) o += `<rect x="${(x + i * (bw + gap)).toFixed(1)}" y="${y}" width="${bw.toFixed(1)}" height="14" rx="2" fill="${i < f ? color : '#ffffff10'}" ${i < f ? `opacity="${(0.55 + 0.45 * i / n).toFixed(2)}"` : ''}/>`
  return o
}

// opt: { net, lag, load, cores, rss, lim, uptime, vault, shield, node, plat, botname, ts }
async function pingCard(o) {
  const botname = ST.plain(o.botname) || 'CHISA AI'
  pushHist(o.net || o.lag)
  const netC = level(o.net, [150, 500]), lagC = level(o.lag, [20, 60])
  const loadR = Math.min(1, o.load / Math.max(1, o.cores)), loadC = level(loadR, [0.6, 0.85])
  const memR = Math.min(1, o.rss / Math.max(1, o.lim)), memC = level(memR, [0.7, 0.9])
  const worst = [netC, lagC, loadC, memC].includes(COL.bad) ? COL.bad : [netC, lagC, loadC, memC].includes(COL.warn) ? COL.warn : COL.ok
  const verdict = worst === COL.ok ? 'SYSTEM NOMINAL' : worst === COL.warn ? 'SYSTEM DEGRADED' : 'SYSTEM CRITICAL'
  const kb = (b) => b >= 1073741824 ? (b / 1073741824).toFixed(1) + ' GB' : (b / 1048576).toFixed(0) + ' MB'

  // baris metrik (kiri)
  const rows = [
    { k: 'NET.LATENCY', v: o.net ? `${o.net} ms` : 'n/a', r: Math.min(1, (o.net || 0) / 2000), c: o.net ? netC : COL.dim, st: o.net ? tag(netC) : '—' },
    { k: 'ENGINE.LAG', v: `${o.lag.toFixed(1)} ms`, r: Math.min(1, o.lag / 100), c: lagC, st: tag(lagC) },
    { k: 'CPU.LOAD', v: `${o.load.toFixed(2)}/${o.cores}c`, r: loadR, c: loadC, st: tag(loadC) },
    { k: 'MEM.RSS', v: `${kb(o.rss)}/${kb(o.lim)}`, r: memR, c: memC, st: tag(memC) },
  ]
  const RX = 52, RY = 200, RH = 64
  const metrics = rows.map((r, i) => {
    const y = RY + i * RH
    return `<g>
      <text x="${RX}" y="${y}" font-family="${MONO}" font-size="15" font-weight="700" fill="${COL.cy}" letter-spacing="1">${r.k}</text>
      <text x="${RX + 560}" y="${y}" text-anchor="end" font-family="${MONO}" font-size="16" font-weight="700" fill="${COL.txt}">${esc(r.v)}</text>
      <rect x="${RX + 580}" y="${y - 15}" width="58" height="22" rx="4" fill="${r.c}22" stroke="${r.c}" stroke-opacity="0.8"/>
      <text x="${RX + 609}" y="${y + 1}" text-anchor="middle" font-family="${MONO}" font-size="12" font-weight="800" fill="${r.c}">${r.st}</text>
      ${segBar(RX, y + 14, 638, r.r, r.c)}
    </g>`
  }).join('')

  // sparkline (kanan atas)
  const SX = 744, SY = 192, SW = 212, SH = 84
  const mx = Math.max(100, ...HIST), pts = HIST.map((v, i) => [SX + (HIST.length < 2 ? SW : i * SW / (HIST.length - 1)), SY + SH - (v / mx) * SH])
  const line = pts.length > 1 ? pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') : ''
  const area = pts.length > 1 ? `${line} L${SX + SW} ${SY + SH} L${SX} ${SY + SH} Z` : ''
  const last = pts[pts.length - 1]
  const spark = `<g>
    <text x="${SX}" y="${SY - 14}" font-family="${MONO}" font-size="12" font-weight="800" fill="${COL.dim}" letter-spacing="2">LATENCY TRACE</text>
    <rect x="${SX - 8}" y="${SY - 4}" width="${SW + 16}" height="${SH + 16}" rx="8" fill="${COL.panel}" stroke="#ffffff14"/>
    ${[0.25, 0.5, 0.75].map(f => `<line x1="${SX}" x2="${SX + SW}" y1="${SY + SH * f}" y2="${SY + SH * f}" stroke="#ffffff0d" stroke-dasharray="3 4"/>`).join('')}
    ${area ? `<path d="${area}" fill="url(#sparkfill)"/><path d="${line}" fill="none" stroke="${COL.cy}" stroke-width="2" stroke-linejoin="round"/>` : `<text x="${SX + SW / 2}" y="${SY + SH / 2 + 4}" text-anchor="middle" font-family="${MONO}" font-size="12" fill="${COL.dim}">menunggu sampel…</text>`}
    ${last ? `<circle cx="${last[0]}" cy="${last[1]}" r="4" fill="${COL.cy}"/><circle cx="${last[0]}" cy="${last[1]}" r="8" fill="${COL.cy}" opacity="0.25"/>` : ''}
    <text x="${SX}" y="${SY + SH + 28}" font-family="${MONO}" font-size="11" fill="${COL.dim}">n=${HIST.length} • max ${mx.toFixed(0)}ms</text>
  </g>`

  // panel info bawah
  const info = [
    ['UPTIME', o.uptime], ['VAULT', cut(o.vault, 34)], ['SHIELD', cut(o.shield, 34)], ['RUNTIME', `Node ${String(o.node).replace(/^v/, '')} • ${o.plat}`],
  ]
  const infoSvg = info.map(([k, v], i) => {
    const col = i % 2, row = Math.floor(i / 2), x = 56 + col * 450, y = 476 + row * 38
    return `<text x="${x}" y="${y}" font-family="${MONO}" font-size="12" font-weight="800" fill="${COL.dim}" letter-spacing="2">${k}</text><text x="${x + 100}" y="${y}" font-family="${MONO}" font-size="14" font-weight="600" fill="${COL.txt}">${esc(v)}</text>`
  }).join('')

  const W = 1000, H = 620
  // scanline halus untuk nuansa terminal
  let scan = ''; for (let y = 24; y < H - 24; y += 4) scan += `<rect x="24" y="${y}" width="${W - 48}" height="1" fill="#ffffff" opacity="0.018"/>`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${AN.defs(COL.cy)}
    <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${COL.cy}" stop-opacity="0.35"/><stop offset="1" stop-color="${COL.cy}" stop-opacity="0"/></linearGradient>
  </defs>
  ${AN.frame(W, H, COL.cy, 26)}
  ${scan}
  ${AN.brand(60, 78, botname, 24, 'SYSTEM PULSE • DIAGNOSTICS')}
  <g transform="translate(940,58)"><rect x="-190" y="-22" width="190" height="34" rx="6" fill="${worst}1f" stroke="${worst}"/><circle cx="-172" cy="-5" r="5" fill="${worst}"/><text x="-12" y="0" text-anchor="end" font-family="${MONO}" font-size="14" font-weight="800" fill="${worst}" letter-spacing="1">${verdict}</text></g>
  <text x="940" y="96" text-anchor="end" font-family="${MONO}" font-size="12" fill="${COL.dim}">${esc(o.ts)}</text>

  <rect x="40" y="118" width="920" height="30" rx="6" fill="${COL.panel}" stroke="#ffffff14"/>
  <text x="56" y="138" font-family="${MONO}" font-size="14" xml:space="preserve"><tspan fill="${COL.ok}" font-weight="700">root@chisa</tspan><tspan fill="${COL.dim}">:</tspan><tspan fill="${COL.cy}">~</tspan><tspan fill="${COL.txt}"># ping --pulse --verbose</tspan></text><rect x="398" y="126" width="9" height="16" fill="${COL.ok}" opacity="0.85"/>

  ${metrics}
  ${spark}

  <line x1="56" y1="430" x2="944" y2="430" stroke="url(#agold)" stroke-opacity="0.45"/>
  <text x="56" y="452" font-family="${MONO}" font-size="12" font-weight="800" fill="${AN.C.gold}" letter-spacing="3">▍SERVICES &amp; ENVIRONMENT</text>
  ${infoSvg}
  <text x="500" y="${H - 34}" text-anchor="middle" font-family="${MONO}" font-size="11" fill="${COL.dim}" letter-spacing="2">CHISA AI // PULSE MONITOR</text>
  </svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}
module.exports = { pingCard }

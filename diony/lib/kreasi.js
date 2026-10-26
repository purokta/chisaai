/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Pembantu fitur Kreasi Dionysus: gambar dibuat lokal (sharp + SVG), tanpa API dan tanpa dependensi baru.
// Dipakai plugin: .carbon .kutipan .sertifikat (kreasi), .ttp .attp (sticker), .namagen (kreasi)
const sharp = require('./sharp.js')
const crypto = require('crypto')

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const hash = (s) => parseInt(crypto.createHash('md5').update(String(s)).digest('hex').slice(0, 8), 16)
const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }

// teks otomatis pas di kotak w x h (ukuran huruf dicari sendiri, baris dibungkus otomatis) → PNG transparan
async function textBox(text, w, h, { color = '#ffffff', font = 'Sans Bold', align = 'centre', justify = false } = {}) {
  return sharp({ text: { text: `<span foreground="${color}">${esc(text)}</span>`, font, width: w, height: h, align, justify, rgba: true } }).png().toBuffer()
}
// tempel layer di tengah kotak (x, y, w, h) pada kanvas
async function centered(layer, x, y, w, h) {
  const { width, height } = await sharp(layer).metadata()
  return { input: layer, left: Math.round(x + (w - width) / 2), top: Math.round(y + (h - height) / 2) }
}

// palet latar kartu (gradasi 2 warna + warna aksen)
const PALET = [
  ['#1a1a2e', '#16213e', '#e94560'], ['#0f2027', '#2c5364', '#f9d423'], ['#2b1055', '#7597de', '#ffd1ff'],
  ['#141e30', '#243b55', '#ff9a8b'], ['#232526', '#414345', '#a8ff78'], ['#42275a', '#734b6d', '#ffe29f'],
  ['#0b486b', '#f56217', '#ffffff'], ['#1d4350', '#a43931', '#ffe6a7'], ['#000046', '#1cb5e0', '#ffffff'], ['#3a1c71', '#d76d77', '#ffaf7b'],
]
const gradient = (id, a, b) => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`

// ── .kutipan ──
async function quoteCard(text, author, seed) {
  const [c1, c2, ac] = PALET[hash(seed || text) % PALET.length], S = 1080
  const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}"><defs>${gradient('g', c1, c2)}</defs>
    <rect width="${S}" height="${S}" fill="url(#g)"/>
    <circle cx="930" cy="150" r="260" fill="${ac}" opacity="0.07"/><circle cx="130" cy="960" r="320" fill="${ac}" opacity="0.06"/>
    <rect x="48" y="48" width="${S - 96}" height="${S - 96}" rx="28" fill="none" stroke="${ac}" stroke-opacity="0.55" stroke-width="3"/>
    <text x="110" y="270" font-family="Serif" font-size="260" fill="${ac}" opacity="0.9">“</text>
    <rect x="${(S - 180) / 2}" y="${S - 235}" width="180" height="5" rx="2.5" fill="${ac}"/></svg>`
  const body = await textBox(text, 800, 460, { font: 'Serif Bold Italic' })
  const parts = [await centered(body, 140, 300, 800, 460)]
  if (author) parts.push(await centered(await textBox('— ' + author, 700, 64, { color: ac, font: 'Sans Bold' }), 190, S - 210, 700, 64))
  return sharp(Buffer.from(bg)).composite(parts).png().toBuffer()
}

// ── .sertifikat ──
async function certificate(name, title, issuer, dateStr) {
  const W = 1600, H = 1130, gold = '#b8892b'
  const corner = (x, y, sx, sy) => `<g transform="translate(${x} ${y}) scale(${sx} ${sy})" fill="none" stroke="${gold}" stroke-width="4"><path d="M0 0 H120 M0 0 V120 M24 24 H96 M24 24 V96 M48 48 H72 M48 48 V72"/><circle cx="12" cy="12" r="6" fill="${gold}"/></g>`
  const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><radialGradient id="p" cx="0.5" cy="0.45" r="0.8"><stop offset="0" stop-color="#fffdf5"/><stop offset="1" stop-color="#f1e6c8"/></radialGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#p)"/>
    <rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="none" stroke="${gold}" stroke-width="10"/>
    <rect x="62" y="62" width="${W - 124}" height="${H - 124}" fill="none" stroke="${gold}" stroke-width="2.5"/>
    ${corner(78, 78, 1, 1)}${corner(W - 78, 78, -1, 1)}${corner(78, H - 78, 1, -1)}${corner(W - 78, H - 78, -1, -1)}
    <text x="${W / 2}" y="270" text-anchor="middle" font-family="Serif" font-weight="bold" font-size="104" letter-spacing="14" fill="#5b3a0a">SERTIFIKAT</text>
    <text x="${W / 2}" y="330" text-anchor="middle" font-family="Serif" font-size="34" letter-spacing="8" fill="${gold}">PENGHARGAAN RESMI</text>
    <line x1="520" y1="360" x2="1080" y2="360" stroke="${gold}" stroke-width="3"/>
    <text x="${W / 2}" y="440" text-anchor="middle" font-family="Serif" font-style="italic" font-size="38" fill="#4a4a4a">diberikan dengan bangga kepada</text>
    <line x1="330" y1="660" x2="1270" y2="660" stroke="${gold}" stroke-width="2.5"/>
    <text x="${W / 2}" y="${H - 380}" text-anchor="middle" font-family="Serif" font-style="italic" font-size="34" fill="#4a4a4a">atas pencapaian sebagai</text>
    <text x="300" y="${H - 150}" text-anchor="middle" font-family="Serif" font-size="30" fill="#4a4a4a">${esc(dateStr)}</text>
    <line x1="150" y1="${H - 190}" x2="450" y2="${H - 190}" stroke="#4a4a4a" stroke-width="2"/>
    <text x="300" y="${H - 115}" text-anchor="middle" font-family="Serif" font-size="24" fill="${gold}">TANGGAL</text>
    <text x="1300" y="${H - 150}" text-anchor="middle" font-family="Serif" font-style="italic" font-size="42" fill="#5b3a0a">${esc(issuer)}</text>
    <line x1="1150" y1="${H - 190}" x2="1450" y2="${H - 190}" stroke="#4a4a4a" stroke-width="2"/>
    <text x="1300" y="${H - 115}" text-anchor="middle" font-family="Serif" font-size="24" fill="${gold}">PENANDATANGAN</text>
    <circle cx="${W / 2}" cy="${H - 175}" r="62" fill="${gold}" opacity="0.9"/><circle cx="${W / 2}" cy="${H - 175}" r="50" fill="none" stroke="#fffdf5" stroke-width="3"/>
    <text x="${W / 2}" y="${H - 162}" text-anchor="middle" font-family="Serif" font-weight="bold" font-size="44" fill="#fffdf5">★</text></svg>`
  const n = await textBox(name, 1100, 150, { color: '#2b1a05', font: 'Serif Bold Italic' })
  const t = await textBox(title, 1000, 105, { color: '#5b3a0a', font: 'Serif Bold' })
  return sharp(Buffer.from(bg)).composite([await centered(n, 250, 480, 1100, 170), await centered(t, 300, 772, 1000, 105)]).png().toBuffer()
}

// ── .carbon: cuplikan kode bergaya jendela editor ──
const KW = new Set('const let var function return if else for while do switch case break continue new class extends import from export default async await try catch finally throw typeof instanceof in of this null undefined true false def lambda pass elif print self None True False int str void public private static string bool float double echo fn use mod pub impl struct enum match SELECT FROM WHERE INSERT UPDATE DELETE JOIN'.split(' '))
function highlight(line) {
  const out = []; let i = 0
  const span = (t, c) => out.push(`<tspan fill="${c}">${esc(t)}</tspan>`)
  while (i < line.length) {
    const rest = line.slice(i)
    let m
    if ((m = /^(\/\/|#).*/.exec(rest))) { span(m[0], '#6a7a8c'); break }
    if ((m = /^("(?:\\.|[^"\\])*"?|'(?:\\.|[^'\\])*'?|`(?:\\.|[^`\\])*`?)/.exec(rest))) { span(m[0], '#a5d6a7'); i += m[0].length; continue }
    if ((m = /^\d[\d._]*/.exec(rest))) { span(m[0], '#ffb86c'); i += m[0].length; continue }
    if ((m = /^[A-Za-z_$][\w$]*/.exec(rest))) {
      const w = m[0], next = line[i + w.length]
      span(w, KW.has(w) ? '#ff79c6' : next === '(' ? '#8be9fd' : /^[A-Z]/.test(w) ? '#f1fa8c' : '#e6e6e6'); i += w.length; continue
    }
    span(rest[0], /[{}()[\];,.:=<>+\-*/%!&|?]/.test(rest[0]) ? '#bd93f9' : '#e6e6e6'); i++
  }
  return out.join('')
}
async function carbon(code, lang) {
  const lines = String(code).replace(/\t/g, '  ').replace(/\r/g, '').split('\n').slice(0, 45).map(l => l.length > 90 ? l.slice(0, 89) + '…' : l)
  const cw = 13.4, lh = 34, padX = 44, top = 96, maxLen = Math.max(24, ...lines.map(l => l.length))
  const W = Math.round(maxLen * cw + padX * 2 + 90), H = top + lines.length * lh + 60
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>${gradient('bg', '#6a11cb', '#2575fc')}</defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect x="40" y="40" width="${W - 80}" height="${H - 80}" rx="16" fill="#1e1f29"/>
    <circle cx="76" cy="76" r="9" fill="#ff5f56"/><circle cx="104" cy="76" r="9" fill="#ffbd2e"/><circle cx="132" cy="76" r="9" fill="#27c93f"/>
    ${lang ? `<text x="${W - 70}" y="82" text-anchor="end" font-family="DejaVu Sans Mono, monospace" font-size="18" fill="#6a7a8c">${esc(lang)}</text>` : ''}
    ${lines.map((l, k) => `<text xml:space="preserve" x="${40 + padX}" y="${top + 24 + k * lh}" font-family="DejaVu Sans Mono, Consolas, monospace" font-size="22">${highlight(l)}</text>`).join('')}</svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

// ── .ttp: teks jadi gambar transparan berwarna (untuk stiker) ──
const WARNA = ['#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#00c7be', '#0a84ff', '#5e5ce6', '#bf5af2', '#ff2d92']
async function textSticker(text, color, size = 512) {
  const c = color || WARNA[hash(text) % WARNA.length], pad = 26, box = size - pad * 2
  const fg = await textBox(text, box, box, { color: c, font: 'Sans Bold' })
  const shadow = await sharp(await textBox(text, box, box, { color: '#000000', font: 'Sans Bold' })).blur(2.5).png().toBuffer()
  const { width, height } = await sharp(fg).metadata()
  const left = Math.round((size - width) / 2), top = Math.round((size - height) / 2)
  return sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: shadow, left: left + 3, top: top + 4 }, { input: fg, left, top }]).png().toBuffer()
}

module.exports = { esc, hash, rng, textBox, centered, quoteCard, certificate, carbon, textSticker, WARNA, PALET }

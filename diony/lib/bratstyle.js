/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Gaya stiker BRAT khas Dionysus: bukan hijau-blur seperti brat bawaan orang lain, tapi plakat gotik:
// latar gradasi gelap/hangat, teks serif tegas dengan cahaya lembut, bingkai ganda dan ornamen sudut.
// Dipakai .bratimg .brathd .bratgreen .bratwhite .bratvid .bratvid2 .bratwarna (lokal, tanpa API).
const sharp = require('./sharp.js')

const THEMES = {
  obsidian: { bg1: '#23242b', bg2: '#050506', fg: '#ECEEF4', glow: '#8E9BC4', line: '#AEB4C6' },   // hitam, perak
  emerald: { bg1: '#14543F', bg2: '#04150F', fg: '#F6DC8B', glow: '#C9A23A', line: '#D9B95A' },    // hijau zamrud, emas
  ivory: { bg1: '#FBF6E8', bg2: '#E4D8BA', fg: '#1D1A16', glow: null, line: '#4A3F2E' },           // perkamen, tinta
}
const FONT = 'Playfair Display, Cinzel, DejaVu Serif, Serif Bold'
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const clean = (t) => String(t || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
const hex = (h) => { h = String(h).replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) || 0) }
const lum = (h) => { const [r, g, b] = hex(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255 }
const mix = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('')

function frameSvg(s, T) {
  const k = s / 512, L = T.line, d = (n) => (n * k).toFixed(1)
  const corner = (x, y, sx, sy) => `<g transform="translate(${d(x)} ${d(y)}) scale(${sx * k} ${sy * k})"><path d="M0 52 Q0 0 52 0" fill="none" stroke="${L}" stroke-width="2.4"/><path d="M0 34 Q0 8 26 8" fill="none" stroke="${L}" stroke-opacity=".55" stroke-width="1.2"/><rect x="-4" y="-4" width="8" height="8" transform="rotate(45)" fill="${L}"/></g>`
  const mid = (y, f) => `<g transform="translate(${d(256)} ${d(y)}) scale(${k} ${f * k})"><path d="M-84 0 H-12 M12 0 H84" stroke="${L}" stroke-width="1.6"/><rect x="-5" y="-5" width="10" height="10" transform="rotate(45)" fill="${L}"/><circle cx="-92" r="2.4" fill="${L}"/><circle cx="92" r="2.4" fill="${L}"/></g>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><defs><radialGradient id="g" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="${T.bg1}"/><stop offset="1" stop-color="${T.bg2}"/></radialGradient></defs>
<rect width="${s}" height="${s}" fill="url(#g)"/>
<rect x="${d(11)}" y="${d(11)}" width="${d(490)}" height="${d(490)}" rx="${d(6)}" fill="none" stroke="${L}" stroke-opacity=".6" stroke-width="${d(1.6)}"/>
<rect x="${d(19)}" y="${d(19)}" width="${d(474)}" height="${d(474)}" rx="${d(3)}" fill="none" stroke="${L}" stroke-opacity=".28" stroke-width="${d(1)}"/>
${corner(11, 11, 1, 1)}${corner(501, 11, -1, 1)}${corner(11, 501, 1, -1)}${corner(501, 501, -1, -1)}${mid(36, 1)}${mid(476, 1)}</svg>`
}

async function textPng(text, w, h, color) {
  return sharp({ text: { text: `<span foreground="${color}">${esc(text)}</span>`, font: FONT, width: w, height: h, align: 'centre', rgba: true } }).png().toBuffer()
}

// theme: nama tema di THEMES, atau objek { bg, fg } untuk warna bebas
async function render(text, theme = 'obsidian', size = 512) {
  const t = clean(text)
  let T
  if (typeof theme === 'string') T = THEMES[theme] || THEMES.obsidian
  else {
    const bg = theme.bg || '#111111', dark = lum(bg) < 0.55, fg = theme.fg || (dark ? '#F4F4F6' : '#16161A')
    T = { bg1: mix(bg, dark ? '#ffffff' : '#ffffff', dark ? 0.1 : 0.35), bg2: mix(bg, '#000000', dark ? 0.55 : 0.12), fg, glow: dark ? mix(fg, bg, 0.45) : null, line: mix(fg, bg, 0.2) }
  }
  if (!sharp.available()) return renderJimp(t, T, size)   // tanpa sharp (mis. Termux): pakai Jimp
  try { return await renderSharp(t, T, size) } catch (e) {
    // sharp ada tapi tidak bisa merender teks (mis. build wasm tanpa pango/font): pakai Jimp
    console.log('[brat] sharp gagal, pakai Jimp:', String(e.message).split('\n')[0].slice(0, 100))
    return renderJimp(t, T, size)
  }
}

async function renderSharp(t, T, size) {
  const px = Math.round(size * 0.115), py = Math.round(size * 0.165), bw = size - px * 2, bh = size - py * 2
  const layer = await textPng(t, bw, bh, T.fg), { width: lw, height: lh } = await sharp(layer).metadata()
  const left = Math.round((size - lw) / 2), top = Math.round((size - lh) / 2), comp = []
  if (T.glow) {
    const tint = await textPng(t, bw, bh, T.glow)
    comp.push({ input: await sharp(tint).blur(Math.max(2, 7 * size / 512)).png().toBuffer(), left, top })
  } else comp.push({ input: await sharp(layer).blur(0.5).png().toBuffer(), left: left + Math.round(size / 512), top: top + Math.round(size / 512) })   // bayangan tipis
  comp.push({ input: layer, left, top })
  return sharp(Buffer.from(frameSvg(size, T))).composite(comp).png().toBuffer()
}

// ── Cadangan tanpa sharp: Jimp (sudah terpasang bersama bot). Font bitmap, jadi tampilannya lebih polos. ──
async function renderJimp(text, T, size) {
  const Jimp = require('jimp')
  const txt = String(text).replace(/[^\x20-\x7E\u00A0-\u00FF\n]/g, '').trim() || '?'
  const px = Math.round(size * 0.115), py = Math.round(size * 0.165), bw = size - px * 2, bh = size - py * 2
  const col = (h) => Jimp.rgbaToInt(...hex(h), 255)
  const base = new Jimp(size, size, col(T.bg1))
  // gradasi sederhana bg1 -> bg2 (vertikal)
  const a = hex(T.bg1), b = hex(T.bg2)
  for (let y = 0; y < size; y++) {
    const f = y / size, c = Jimp.rgbaToInt(...a.map((v, i) => Math.round(v + (b[i] - v) * f)), 255)
    for (let x = 0; x < size; x++) base.setPixelColor(c, x, y)
  }
  // bingkai tipis
  const line = col(T.line), m = Math.round(size * 0.022)
  for (let i = m; i < size - m; i++) for (const w of [0, 1]) { base.setPixelColor(line, i, m + w); base.setPixelColor(line, i, size - m - 1 - w); base.setPixelColor(line, m + w, i); base.setPixelColor(line, size - m - 1 - w, i) }
  // pilih font terbesar yang muat
  const longest = txt.split(/\s+/).reduce((x, y) => (y.length > x.length ? y : x), '')
  let font
  for (const f of ['FONT_SANS_128_WHITE', 'FONT_SANS_64_WHITE', 'FONT_SANS_32_WHITE', 'FONT_SANS_16_WHITE']) {
    font = await Jimp.loadFont(Jimp[f])
    if (Jimp.measureText(font, longest) <= bw && Jimp.measureTextHeight(font, txt, bw) <= bh) break
  }
  const mask = new Jimp(bw, bh, 0x000000ff)
  mask.print(font, 0, 0, { text: txt, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, bw, bh)
  const layer = new Jimp(bw, bh, col(T.fg))
  layer.mask(mask, 0, 0)
  base.composite(layer, px, py)
  return base.getBufferAsync(Jimp.MIME_PNG)
}
module.exports = { render, THEMES }

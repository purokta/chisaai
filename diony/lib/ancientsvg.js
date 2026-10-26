/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// DEKORASI SVG GAYA KUNO (Mesir/Yunani): bingkai emas + pola meander, Mata Horus vektor, huruf serif
const sharp = require('./sharp.js')
const ST = require('./style')

const SERIF = "'Cinzel','Cormorant Garamond','Trajan Pro','Palatino Linotype','Book Antiqua',Georgia,'DejaVu Serif',serif"
const SANS = "Poppins,'DejaVu Sans',Arial,sans-serif"
const C = { gold: '#d4af37', goldL: '#f6e4a0', goldD: '#8a6d1d', night: '#080d1f', lapis: '#14224f', sand: '#efe3bf', stone: '#c9b98c' }

// definisi bersama: gradasi emas, pola meander
const defs = (accent = C.gold, id = 'a') => `
  <linearGradient id="${id}gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.goldL}"/><stop offset="0.5" stop-color="${C.gold}"/><stop offset="1" stop-color="${C.goldD}"/></linearGradient>
  <linearGradient id="${id}bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.night}"/><stop offset="0.55" stop-color="${C.lapis}"/><stop offset="1" stop-color="#1b1233"/></linearGradient>
  <radialGradient id="${id}glow" cx="0.15" cy="0.3" r="0.75"><stop offset="0" stop-color="${accent}" stop-opacity="0.30"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
  <pattern id="${id}key" width="18" height="14" patternUnits="userSpaceOnUse"><path d="M0 12.5H18M2 12.5V1.5H15.5V9H5.5V4.5H12.5V6.5" fill="none" stroke="url(#${id}gold)" stroke-width="1.5" stroke-linejoin="miter"/></pattern>`

// Mata Horus (Wedjat). (x,y) = pojok kiri-atas, w = lebar
function eye(x, y, w, fill = 'url(#agold)') {
  const s = w / 120
  return `<g transform="translate(${x},${y}) scale(${s})" fill="none" stroke="${fill}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10 20 C36 3 74 2 104 17" stroke-width="6"/>
    <path d="M8 42 C30 22 64 22 90 38 C72 52 30 54 8 42 Z" stroke-width="4.5"/>
    <circle cx="49" cy="38" r="11" fill="${fill}" stroke="none"/><circle cx="49" cy="38" r="4.5" fill="#080d1f" stroke="none"/>
    <path d="M90 38 L112 44 C118 56 108 66 97 60 C90 56 93 48 100 50" stroke-width="4.5"/>
    <path d="M46 51 C47 64 44 72 36 76 L18 78" stroke-width="4.5"/>
    <path d="M30 76 C24 70 26 62 33 62" stroke-width="3.5"/>
  </g>`
}
// latar + bingkai emas + sudut. return string elemen (taruh setelah <defs>)
function frame(w, h, accent = C.gold, r = 24, id = 'a') {
  let st = '', x = 7919; const rn = () => (x = (x * 9301 + 49297) % 233280) / 233280
  for (let i = 0; i < 38; i++) st += `<circle cx="${(rn() * w) | 0}" cy="${(rn() * h) | 0}" r="${(rn() * 1.5 + 0.4).toFixed(1)}" fill="${C.goldL}" opacity="${(rn() * 0.35 + 0.08).toFixed(2)}"/>`
  const corner = (cx, cy, sx, sy) => `<g transform="translate(${cx},${cy}) scale(${sx},${sy})"><path d="M0 0H34V6H6V34H0Z" fill="url(#${id}gold)"/><rect x="11" y="11" width="9" height="9" fill="none" stroke="url(#${id}gold)" stroke-width="2" transform="rotate(45 15.5 15.5)"/></g>`
  return `<rect width="${w}" height="${h}" rx="${r}" fill="url(#${id}bg)"/><rect width="${w}" height="${h}" rx="${r}" fill="url(#${id}glow)"/>${st}
  <rect x="5" y="5" width="${w - 10}" height="${h - 10}" rx="${r - 3}" fill="none" stroke="url(#${id}gold)" stroke-width="3.5"/>
  <rect x="14" y="14" width="${w - 28}" height="${h - 28}" rx="${r - 10}" fill="none" stroke="${C.gold}" stroke-opacity="0.35" stroke-width="1.2"/>
  <rect x="${r + 8}" y="3" width="${w - 2 * r - 16}" height="9" fill="url(#${id}key)" opacity="0.9" transform="translate(0,2)"/>
  <rect x="${r + 8}" y="${h - 14}" width="${w - 2 * r - 16}" height="9" fill="url(#${id}key)" opacity="0.9"/>
  ${corner(16, 16, 1, 1)}${corner(w - 16, 16, -1, 1)}${corner(16, h - 16, 1, -1)}${corner(w - 16, h - 16, -1, -1)}`
}
// judul bot: mata Horus + nama (ASCII) huruf serif emas
function brand(x, y, botname, size = 26, sub = '') {
  const name = ST.plain(botname).toUpperCase() || 'CHISA AI'
  return `${eye(x, y - size * 0.9, size * 1.9)}
  <text x="${x + size * 2.2}" y="${y}" font-family="${SERIF}" font-size="${size}" font-weight="700" fill="url(#agold)" letter-spacing="${Math.round(size / 6)}">${name}</text>
  ${sub ? `<text x="${x + size * 2.2}" y="${y + size * 0.85}" font-family="${SERIF}" font-size="${Math.round(size * 0.5)}" fill="${C.stone}" letter-spacing="2">${sub}</text>` : ''}`
}
const render = (svg) => sharp(Buffer.from(svg)).png().toBuffer()
module.exports = { C, SERIF, SANS, defs, eye, frame, brand, render }

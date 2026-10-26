/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kartu info warna (SVG -> PNG lewat sharp): HEX/RGB/HSL, gradasi, palet harmoni, kontras WCAG
const sharp = require('../../lib/sharp.js'), { B } = require('../../lib/style')
const NAMED = { merah: '#e53935', biru: '#1e88e5', hijau: '#43a047', kuning: '#fdd835', oranye: '#fb8c00', ungu: '#8e24aa', pink: '#ec407a', hitam: '#000000', putih: '#ffffff', abu: '#9e9e9e', coklat: '#6d4c41', cyan: '#00bcd4', tosca: '#009688', emas: '#ffd700', navy: '#001f3f', maroon: '#800000', red: '#f44336', blue: '#2196f3', green: '#4caf50', yellow: '#ffeb3b', orange: '#ff9800', purple: '#9c27b0', black: '#000000', white: '#ffffff', gray: '#9e9e9e', brown: '#795548' }
const hexToRgb = (h) => { let x = h.replace('#', ''); if (x.length === 3) x = [...x].map(c => c + c).join(''); return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)] }
const rgbToHex = (c) => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase()
function rgbToHsl([r, g, b]) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2; if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60 } return [Math.round(h), Math.round(s * 100), Math.round(l * 100)] }
function hslToRgb(h, s, l) { s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)] }
function parse(args) {
  const s = args.join(' ').trim().toLowerCase(); if (!s) return null
  if (NAMED[s]) return hexToRgb(NAMED[s])
  let m = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/); if (m) return hexToRgb('#' + m[1])
  m = s.match(/^hsl\D*(\d{1,3})\D+(\d{1,3})\D+(\d{1,3})/); if (m) return hslToRgb(+m[1] % 360, Math.min(100, +m[2]), Math.min(100, +m[3]))
  m = s.match(/^(?:rgb)?\D*(\d{1,3})\D+(\d{1,3})\D+(\d{1,3})\D*$/); if (m && [m[1], m[2], m[3]].every(v => +v <= 255)) return [+m[1], +m[2], +m[3]]
  return null
}
const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
const wcag = (c) => c >= 7 ? 'AAA lulus' : c >= 4.5 ? 'AA lulus' : c >= 3 ? 'AA teks besar' : 'tidak lulus'
const FONT = "Poppins, 'DejaVu Sans', Arial, sans-serif"

module.exports = {
  name: 'warna', alias: ['color', 'colorpicker', 'palet', 'palette'], category: 'praktis', noLimit: true, cmds: ['warna'],
  desc: 'Kartu info warna: HEX/RGB/HSL, palet harmoni, dan cek kontras teks (WCAG)',
  run: async ({ sock, m, args, prefix, reply }) => {
    const rgb = parse(args)
    if (!rgb) return reply(`✦ ${B('INFO WARNA')}\n${prefix}warna #ff6b35\n${prefix}warna 255 107 53\n${prefix}warna hsl 18 100 60\n${prefix}warna merah`)
    const [h, s, l] = rgbToHsl(rgb), hex = rgbToHex(rgb), hs = (hh, ss = s, ll = l) => hslToRgb(((hh % 360) + 360) % 360, ss, ll)
    const harmony = [['KOMPLEMENTER', [hs(h + 180)]], ['ANALOG', [hs(h - 30), hs(h + 30)]], ['TRIADIK', [hs(h + 120), hs(h + 240)]], ['TETRADIK', [hs(h + 90), hs(h + 180), hs(h + 270)]]]
    const shades = [92, 78, 64, 50, 36, 22].map(ll => hs(h, s, ll)), cw = contrast(rgb, [255, 255, 255]), cb = contrast(rgb, [0, 0, 0]), on = cw >= cb ? '#ffffff' : '#000000'
    const W = 640, H = 560; let y = 206
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#0f172a"/><rect x="24" y="24" width="${W - 48}" height="150" rx="18" fill="${hex}"/>` +
      `<text x="48" y="92" font-family="${FONT}" font-size="44" font-weight="800" fill="${on}">${hex}</text><text x="48" y="124" font-family="${FONT}" font-size="20" fill="${on}">rgb(${rgb.join(', ')})</text><text x="48" y="152" font-family="${FONT}" font-size="20" fill="${on}">hsl(${h}, ${s}%, ${l}%)</text>` +
      `<text x="28" y="${y - 12}" font-family="${FONT}" font-size="14" fill="#94a3b8">GRADASI</text>`
    shades.forEach((c, i) => { svg += `<rect x="${24 + i * 99}" y="${y}" width="91" height="50" rx="10" fill="${rgbToHex(c)}"/>` })
    y += 96
    for (const [name, cols] of harmony) {
      svg += `<text x="28" y="${y - 10}" font-family="${FONT}" font-size="14" fill="#94a3b8">${name}</text>`
      ;[rgb, ...cols].forEach((c, i) => { svg += `<rect x="${24 + i * 99}" y="${y}" width="91" height="36" rx="9" fill="${rgbToHex(c)}"/><text x="${24 + i * 99 + 45}" y="${y + 23}" text-anchor="middle" font-family="${FONT}" font-size="12" fill="${lum(c) > 0.45 ? '#000' : '#fff'}">${rgbToHex(c)}</text>` })
      y += 66
    }
    const image = await sharp(Buffer.from(svg + '</svg>')).png().toBuffer()
    return sock.sendMessage(m.chat, { image, caption: `✦ *${hex}*\nrgb(${rgb.join(', ')}) • hsl(${h}, ${s}%, ${l}%)\n\n${B('Kontras teks (WCAG)')}\n┣ Putih : ${cw.toFixed(2)}:1 → ${wcag(cw)}\n┗ Hitam : ${cb.toFixed(2)}:1 → ${wcag(cb)}` }, { quoted: m })
  },
}

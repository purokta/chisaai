/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// CANVAS KOTA — kartu dengan latar siluet kota + foto profil bulat.
// Dipakai: welcome, goodbye (out), berhasil register, promote, demote. SVG dirender jadi PNG lewat sharp.
const sharp = require('./sharp.js')
const ST = require('./style')

const FONT = "Poppins, 'DejaVu Sans', Arial, sans-serif"
const SERIF = "'Cinzel','Cormorant Garamond','Palatino Linotype',Georgia,'DejaVu Serif',serif"
const W = 1200, H = 630

// tema tiap jenis kartu: langit (atas → horizon), warna aksen, jenis benda langit
const THEMES = {
  welcome:  { sky: ['#140f3a', '#4b2a7a', '#c9548a', '#ffb46b'], accent: '#ffd27a', bld: ['#150f2e', '#0f0a22', '#080517'], orb: 'sun',  label: 'WELCOME' },
  goodbye:  { sky: ['#04060f', '#0c1a3d', '#1f3a6e', '#56789f'], accent: '#9cc4ff', bld: ['#0b1428', '#08101f', '#050a15'], orb: 'moon', label: 'GOODBYE' },
  register: { sky: ['#06121c', '#0b3340', '#12606a', '#d4af37'], accent: '#f6e4a0', bld: ['#0a1d28', '#071620', '#040d14'], orb: 'moon', label: 'REGISTERED' },
  promote:  { sky: ['#04140f', '#0b3a2a', '#1b7a52', '#a6f0b8'], accent: '#7dffb4', bld: ['#082218', '#061a12', '#03100a'], orb: 'moon', label: 'PROMOTED' },
  demote:   { sky: ['#190707', '#4a1414', '#923030', '#ff9a7a'], accent: '#ff8f8f', bld: ['#220a0a', '#190606', '#0f0303'], orb: 'sun',  label: 'DEMOTED' },
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
// buang emoji / hieroglif (font gambar belum tentu punya), rapikan spasi
const clean = (s) => String(s ?? '').normalize('NFKC').replace(/\p{Extended_Pictographic}|[\u{13000}-\u{1342F}\uFE0F\u200D]/gu, '').replace(/\s+/g, ' ').trim()
const cut = (s, n) => { s = clean(s); return s.length > n ? s.slice(0, n - 1) + '…' : s }
const seedOf = (str) => { let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) } return (h >>> 0) % 233280 || 7919 }
const rng = (seed) => { let x = seed; return () => (x = (x * 9301 + 49297) % 233280) / 233280 }

// satu lapis gedung. base = garis tanah, hMin/hMax = tinggi, lit = peluang jendela menyala
function skyline(r, fill, base, hMin, hMax, winOn, lit, wMin, wMax) {
  let x = -20, out = ''
  while (x < W + 20) {
    const w = wMin + r() * (wMax - wMin), h = hMin + r() * (hMax - hMin), top = base - h
    out += `<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${w.toFixed(1)}" height="${(h + 4).toFixed(1)}" fill="${fill}"/>`
    if (r() > 0.72) out += `<rect x="${(x + w / 2 - 1).toFixed(1)}" y="${(top - 26).toFixed(1)}" width="2" height="26" fill="${fill}"/>`   // antena
    else if (r() > 0.8) out += `<rect x="${(x + 6).toFixed(1)}" y="${(top - 10).toFixed(1)}" width="${(w - 12).toFixed(1)}" height="10" fill="${fill}"/>`  // atap bertingkat
    if (winOn) {
      const cols = Math.max(1, Math.floor((w - 8) / 11)), rows = Math.floor((h - 14) / 14)
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        if (r() > lit) continue
        out += `<rect x="${(x + 5 + i * 11).toFixed(1)}" y="${(top + 8 + j * 14).toFixed(1)}" width="5" height="7" fill="${r() > 0.82 ? '#9fe2ff' : '#ffd98a'}" opacity="${(0.45 + r() * 0.5).toFixed(2)}"/>`
      }
    }
    x += w + 1 + r() * 4
  }
  return out
}

function orb(kind, accent) {
  if (kind === 'sun') return `<circle cx="930" cy="330" r="150" fill="url(#orbglow)"/><circle cx="930" cy="330" r="62" fill="${accent}" opacity="0.95"/>`
  return `<circle cx="960" cy="120" r="120" fill="url(#orbglow)"/><circle cx="960" cy="120" r="44" fill="#f4f1de"/><circle cx="974" cy="110" r="40" fill="#0b1428" opacity="0.0"/>`
}

async function avatarUri(buf, size) {
  if (!Buffer.isBuffer(buf)) return null
  try { return 'data:image/jpeg;base64,' + (await sharp(buf).resize(size, size, { fit: 'cover' }).jpeg({ quality: 88 }).toBuffer()).toString('base64') } catch { return null }
}
const silhouette = (cx, cy, r, initial, color) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#1b2140"/>
  <circle cx="${cx}" cy="${cy - r * 0.2}" r="${r * 0.36}" fill="${color}" opacity="0.6"/>
  <path d="M${cx - r * 0.78} ${cy + r} C${cx - r * 0.7} ${cy + r * 0.35} ${cx - r * 0.3} ${cy + r * 0.28} ${cx} ${cy + r * 0.28} C${cx + r * 0.3} ${cy + r * 0.28} ${cx + r * 0.7} ${cy + r * 0.35} ${cx + r * 0.78} ${cy + r}Z" fill="${color}" opacity="0.45"/>
  <text x="${cx}" y="${cy + r * 0.12}" text-anchor="middle" font-family="${FONT}" font-size="${r * 0.9}" font-weight="800" fill="#fff" opacity="0.9">${esc(initial)}</text>`

/**
 * opsi: { kind: welcome|goodbye|register|promote|demote, name, avatar(Buffer|null),
 *         line1, line2, line3 (teks bebas), footer }
 */
async function render(o) {
  const T = THEMES[o.kind] || THEMES.welcome, A = T.accent
  const name = cut(o.name || 'Pengguna', 24) || 'Pengguna'
  const r = rng(seedOf(o.kind + name + (o.line2 || '')))
  const uri = await avatarUri(o.avatar, 400)
  const cx = 600, cy = 188, R = 98

  // bintang
  let stars = ''
  for (let i = 0; i < 70; i++) stars += `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * 330).toFixed(0)}" r="${(r() * 1.6 + 0.3).toFixed(1)}" fill="#fff" opacity="${(r() * 0.6 + 0.15).toFixed(2)}"/>`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${T.sky[0]}"/><stop offset="0.45" stop-color="${T.sky[1]}"/><stop offset="0.75" stop-color="${T.sky[2]}"/><stop offset="1" stop-color="${T.sky[3]}"/>
    </linearGradient>
    <radialGradient id="orbglow"><stop offset="0" stop-color="${A}" stop-opacity="0.55"/><stop offset="1" stop-color="${A}" stop-opacity="0"/></radialGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.72"/></linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e4a0"/><stop offset="0.5" stop-color="#d4af37"/><stop offset="1" stop-color="#8a6d1d"/></linearGradient>
    <clipPath id="av"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath>
    <clipPath id="card"><rect width="${W}" height="${H}" rx="34"/></clipPath>
    <filter id="blur"><feGaussianBlur stdDeviation="14"/></filter>
    <filter id="soft"><feGaussianBlur stdDeviation="1.2"/></filter>
  </defs>

  <g clip-path="url(#card)">
    <rect width="${W}" height="${H}" fill="url(#sky)"/>
    ${stars}
    ${orb(T.orb, A)}
    <!-- kabut tipis di horizon -->
    <ellipse cx="300" cy="470" rx="420" ry="46" fill="#fff" opacity="0.06" filter="url(#blur)"/>
    <ellipse cx="900" cy="500" rx="380" ry="40" fill="#fff" opacity="0.05" filter="url(#blur)"/>

    <!-- tiga lapis kota: jauh (samar) → dekat (gelap, jendela menyala) -->
    <g opacity="0.55" filter="url(#soft)">${skyline(r, T.bld[0], 520, 70, 190, false, 0, 34, 70)}</g>
    <g opacity="0.85">${skyline(r, T.bld[1], 580, 90, 250, true, 0.28, 40, 86)}</g>
    <g>${skyline(r, T.bld[2], 640, 70, 190, true, 0.2, 50, 110)}</g>

    <!-- peredam supaya teks terbaca -->
    <rect x="0" y="300" width="${W}" height="${H - 300}" fill="url(#fade)"/>

    <!-- avatar -->
    <circle cx="${cx}" cy="${cy}" r="${R + 30}" fill="${A}" opacity="0.30" filter="url(#blur)"/>
    <circle cx="${cx}" cy="${cy}" r="${R + 11}" fill="#0a0e1c" opacity="0.65"/>
    <circle cx="${cx}" cy="${cy}" r="${R + 8}" fill="none" stroke="url(#gold)" stroke-width="5"/>
    ${uri ? `<image href="${uri}" x="${cx - R}" y="${cy - R}" width="${R * 2}" height="${R * 2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#av)"/>` : `<g clip-path="url(#av)">${silhouette(cx, cy, R, name.charAt(0).toUpperCase(), A)}</g>`}
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="1.5"/>

    <!-- teks -->
    <text x="${cx}" y="${cy + R + 74}" text-anchor="middle" font-family="${SERIF}" font-size="62" font-weight="700" letter-spacing="14" fill="url(#gold)" stroke="#000" stroke-opacity="0.35" stroke-width="1">${T.label}</text>
    <text x="${cx}" y="${cy + R + 128}" text-anchor="middle" font-family="${FONT}" font-size="42" font-weight="800" fill="#ffffff">${esc(name)}</text>
    ${o.line1 ? `<text x="${cx}" y="${cy + R + 166}" text-anchor="middle" font-family="${FONT}" font-size="23" font-weight="600" fill="${A}">${esc(cut(o.line1, 52))}</text>` : ''}
    ${o.line2 ? `<text x="${cx}" y="${cy + R + 198}" text-anchor="middle" font-family="${FONT}" font-size="20" fill="#e6e9f5" opacity="0.92">${esc(cut(o.line2, 64))}</text>` : ''}
    ${o.line3 ? `<text x="${cx}" y="${cy + R + 226}" text-anchor="middle" font-family="${FONT}" font-size="17" fill="#c5cbe4" opacity="0.85">${esc(cut(o.line3, 72))}</text>` : ''}
    <text x="${W - 46}" y="${H - 26}" text-anchor="end" font-family="${SERIF}" font-size="15" letter-spacing="3" fill="#f6e4a0" opacity="0.8">${esc(cut(ST.plain(o.footer || global.settingsDefault?.botname || 'CHISA AI').toUpperCase(), 30))}</text>
  </g>
  <!-- bingkai emas -->
  <rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="30" fill="none" stroke="url(#gold)" stroke-width="4"/>
  <rect x="16" y="16" width="${W - 32}" height="${H - 32}" rx="22" fill="none" stroke="#d4af37" stroke-opacity="0.35" stroke-width="1.2"/>
</svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

// ambil foto profil WhatsApp (Buffer) atau null bila disembunyikan / tidak ada
async function getAvatar(sock, jid) {
  try {
    const url = await sock.profilePictureUrl(jid, 'image')
    const b = await require('./functions').getBuffer(url)
    return Buffer.isBuffer(b) ? b : null
  } catch { return null }
}

module.exports = { render, getAvatar, THEMES }

/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Mesin gambar Kreasi 2 Dionysus: semua dibuat lokal (sharp + SVG), tanpa API dan tanpa dependensi baru.
// Dipakai plugin: .qc .logo .tulis .ucapan .wallpaper .kartunama .bratwarna .hitungbenda .tebakwarna
const sharp = require('./sharp.js')
const K = require('./kreasi')
const { esc, hash, rng, PALET } = K

const px = (w, h, bg) => sharp({ create: { width: w, height: h, channels: 4, background: bg || { r: 0, g: 0, b: 0, alpha: 0 } } })
const svgBuf = (s) => Buffer.from(s)
const pick = (r, a) => a[Math.floor(r() * a.length)]

// ── warna: nama Indonesia / Inggris / hex → '#rrggbb' ──
const WARNA = {
  merah: '#e53935', biru: '#1e66f5', hijau: '#2e9e4f', kuning: '#ffd600', oranye: '#fb8c00', jingga: '#fb8c00', ungu: '#8e24aa', pink: '#ff5fa2', merahmuda: '#ff8fb8', jambu: '#ff8fb8',
  coklat: '#6d4c41', cokelat: '#6d4c41', abu: '#9e9e9e', abuabu: '#9e9e9e', hitam: '#111111', putih: '#ffffff', tosca: '#1abc9c', emas: '#d4af37', perak: '#c0c0c0', krem: '#f5e6c8',
  marun: '#7b1f2b', nila: '#3f3d9c', magenta: '#d81b84', lavender: '#b8a1e3', lila: '#c8a2e8', birulangit: '#7fc8f8', birulaut: '#14377d', navy: '#14377d', hijaumuda: '#a5e887', hijautua: '#1b5e20',
  salmon: '#fa8072', peach: '#ffcba4', mint: '#a8ecc8', lime: '#b6f500', limau: '#b6f500', zaitun: '#808000', biruaqua: '#00bcd4', aqua: '#00bcd4', cyan: '#00bcd4',
  red: '#e53935', blue: '#1e66f5', green: '#2e9e4f', yellow: '#ffd600', orange: '#fb8c00', purple: '#8e24aa', brown: '#6d4c41', gray: '#9e9e9e', grey: '#9e9e9e', black: '#111111', white: '#ffffff', gold: '#d4af37', silver: '#c0c0c0',
}
const key = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '')
function parseColor(s) {
  s = String(s || '').trim().toLowerCase()
  const hx = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/.exec(s)
  if (hx && (s.startsWith('#') || /^[0-9a-f]{6}$/.test(s))) { let h = hx[1]; if (h.length === 3) h = [...h].map(c => c + c).join(''); return '#' + h }
  return WARNA[key(s)] || null
}
// kontras: teks hitam atau putih di atas warna latar
function contrast(hex) { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111111' : '#ffffff' }

// ── teks → layer penuh kanvas (putih, di tengah, dipas otomatis) ──
async function fullText(text, W, H, boxW, boxH, { font = 'Sans Bold', color = '#ffffff', dx = 0, dy = 0 } = {}) {
  const t = await K.textBox(text, boxW, boxH, { color, font })
  const { width, height } = await sharp(t).metadata()
  return px(W, H).composite([{ input: t, left: Math.round((W - width) / 2 + dx), top: Math.round((H - height) / 2 + dy) }]).png().toBuffer()
}
// isi layer teks dengan warna/gradien (svg) atau warna polos
async function fillWith(mask, W, H, fill) {
  const base = fill.startsWith('<') ? svgBuf(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${fill}</svg>`) : { create: { width: W, height: H, channels: 4, background: fill } }
  return sharp(base).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer()
}
const blur = (b, s) => sharp(b).blur(s).png().toBuffer()
const vgrad = (id, stops) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient></defs><rect width="100%" height="100%" fill="url(#${id})"/>`

// ══════════ .qc — gelembung chat jadi stiker ══════════
const NAMA_WARNA = ['#ff7a8a', '#ffb347', '#7bd88f', '#5ec8ff', '#b79bff', '#ff8fd8', '#4fd1c5', '#f6e05e']
async function chatBubble(name, text, { bg = '#202c33', avatar = null, time = '' } = {}) {
  const W = 700, ava = 84, gap = 16, bw = W - ava - gap - 20, inner = bw - 44
  const nameCol = NAMA_WARNA[hash(name) % NAMA_WARNA.length]
  const msg = await sharp({ text: { text: `<span foreground="#e9edef">${esc(text)}</span>`, font: 'Sans 34', width: inner, rgba: true } }).png().toBuffer()
  const nm = await sharp({ text: { text: `<span foreground="${nameCol}"><b>${esc(String(name).slice(0, 26))}</b></span>`, font: 'Sans 30', width: inner, rgba: true } }).png().toBuffer()
  const mm = await sharp(msg).metadata(), nn = await sharp(nm).metadata()
  const w = Math.max(mm.width, nn.width, 120) + 44, h = nn.height + mm.height + 24 + 38 + 14
  const H = h + 20
  const tail = `<path d="M${ava + gap + 6} 20 L${ava + gap - 14} 20 Q${ava + gap + 2} 26 ${ava + gap + 6} 44 Z" fill="${bg}"/>`
  const bubble = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect x="${ava + gap}" y="10" width="${w}" height="${h}" rx="26" fill="${bg}"/>${tail}${time ? `<text x="${ava + gap + w - 22}" y="${h - 4}" text-anchor="end" font-family="Sans" font-size="22" fill="#8696a0">${esc(time)}</text>` : ''}</svg>`
  const parts = [{ input: nm, left: ava + gap + 22, top: 24 }, { input: msg, left: ava + gap + 22, top: 24 + nn.height + 8 }]
  let av
  if (avatar) { try { av = await sharp(avatar).resize(ava, ava, { fit: 'cover' }).composite([{ input: svgBuf(`<svg width="${ava}" height="${ava}"><circle cx="${ava / 2}" cy="${ava / 2}" r="${ava / 2}"/></svg>`), blend: 'dest-in' }]).png().toBuffer() } catch {} }
  if (!av) {
    const ini = esc(([...String(name).trim()][0] || '?').toUpperCase())
    av = await sharp(svgBuf(`<svg xmlns="http://www.w3.org/2000/svg" width="${ava}" height="${ava}"><circle cx="${ava / 2}" cy="${ava / 2}" r="${ava / 2}" fill="${nameCol}"/><text x="${ava / 2}" y="${ava / 2 + 15}" text-anchor="middle" font-family="Sans" font-weight="bold" font-size="42" fill="#ffffff">${ini}</text></svg>`)).png().toBuffer()
  }
  return sharp(svgBuf(bubble)).composite([{ input: av, left: 0, top: 10 }, ...parts]).png().toBuffer()
}

// ══════════ .logo — teks bergaya (neon, emas, api, es, kromium, retro, 3d, glitch) ══════════
const LOGO_STYLES = {
  neon: 'garis cahaya neon biru-merah muda di latar gelap',
  emas: 'huruf emas mengilap',
  api: 'huruf menyala kuning-merah',
  es: 'huruf es membeku',
  kromium: 'logam perak mengilap',
  retro: 'synthwave 80-an dengan matahari dan grid',
  '3d': 'huruf tebal bertumpuk 3 dimensi',
  glitch: 'rusak digital RGB',
  hijau: 'terminal hacker hijau',
}
async function logoText(text, style = 'neon') {
  const W = 1280, H = 640, bw = 1080, bh = 360, t = String(text).slice(0, 40)
  const mask = await fullText(t, W, H, bw, bh, { font: 'Sans Bold' })
  const bgSvg = (inner) => svgBuf(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${inner}</svg>`)
  let base, layers = []
  if (style === 'neon') {
    base = bgSvg('<rect width="100%" height="100%" fill="#07070f"/>')
    const pink = await fillWith(mask, W, H, '#ff2bd6'), cyan = await fillWith(mask, W, H, '#25d9ff')
    layers = [{ input: await blur(pink, 28) }, { input: await blur(pink, 28) }, { input: await blur(cyan, 10), left: 0, top: 0 }, { input: await fillWith(mask, W, H, '#ffe9ff') }]
    // garis tepi berwarna: geser sedikit
    layers.splice(3, 0, { input: await fillWith(await fullText(t, W, H, bw, bh, { dx: 3, dy: 3 }), W, H, '#25d9ff') })
  } else if (style === 'emas') {
    base = bgSvg('<rect width="100%" height="100%" fill="#14100a"/><radialGradient id="r" cx="0.5" cy="0.5" r="0.7"><stop offset="0" stop-color="#2a2012"/><stop offset="1" stop-color="#0b0905"/></radialGradient><rect width="100%" height="100%" fill="url(#r)"/>')
    const shadow = await blur(await fillWith(await fullText(t, W, H, bw, bh, { dy: 12 }), W, H, '#000000'), 10)
    const gold = await fillWith(mask, W, H, vgrad('g', [[0, '#fff3b0'], [0.35, '#e8b923'], [0.55, '#8a5a07'], [0.75, '#f5d76e'], [1, '#b8860b']]))
    layers = [{ input: shadow }, { input: gold }]
  } else if (style === 'api') {
    base = bgSvg('<rect width="100%" height="100%" fill="#0d0402"/>')
    const fire = await fillWith(mask, W, H, vgrad('f', [[0, '#fff7a8'], [0.4, '#ffb300'], [0.75, '#ff4d00'], [1, '#b00000']]))
    layers = [{ input: await blur(await fillWith(mask, W, H, '#ff5a00'), 30) }, { input: await blur(await fillWith(mask, W, H, '#ff9900'), 12) }, { input: fire }]
  } else if (style === 'es') {
    base = bgSvg(vgrad('b', [[0, '#05182e'], [1, '#0b3a66']]))
    const ice = await fillWith(mask, W, H, vgrad('i', [[0, '#ffffff'], [0.5, '#9fe8ff'], [1, '#3a9ce0']]))
    layers = [{ input: await blur(await fillWith(mask, W, H, '#6fdcff'), 22) }, { input: ice }]
  } else if (style === 'kromium') {
    base = bgSvg(vgrad('b', [[0, '#2b2f36'], [1, '#0e1014']]))
    const chrome = await fillWith(mask, W, H, vgrad('c', [[0, '#ffffff'], [0.45, '#8f98a6'], [0.5, '#2a2f38'], [0.55, '#c9d1dc'], [1, '#ffffff']]))
    layers = [{ input: await blur(await fillWith(await fullText(t, W, H, bw, bh, { dy: 14 }), W, H, '#000000'), 12) }, { input: chrome }]
  } else if (style === 'retro') {
    const g = []; for (let i = 0; i < 12; i++) g.push(`<line x1="0" y1="${400 + i * i * 2.2}" x2="${W}" y2="${400 + i * i * 2.2}" stroke="#ff2bd6" stroke-opacity="0.55" stroke-width="2"/>`)
    for (let i = -12; i <= 12; i++) g.push(`<line x1="${W / 2 + i * 22}" y1="400" x2="${W / 2 + i * 120}" y2="${H}" stroke="#ff2bd6" stroke-opacity="0.55" stroke-width="2"/>`)
    base = bgSvg(`<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a0b3d"/><stop offset="1" stop-color="#5b1a6e"/></linearGradient><linearGradient id="su" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe14d"/><stop offset="1" stop-color="#ff2b9e"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#s)"/><circle cx="${W / 2}" cy="360" r="190" fill="url(#su)"/><rect y="400" width="100%" height="${H - 400}" fill="#12052e"/>${g.join('')}`)
    const pink = await fillWith(mask, W, H, vgrad('p', [[0, '#ffffff'], [0.5, '#ff9de2'], [1, '#ff2bd6']]))
    layers = [{ input: await fillWith(await fullText(t, W, H, bw, bh, { dx: 7, dy: 7 }), W, H, '#25d9ff') }, { input: pink }]
  } else if (style === '3d') {
    base = bgSvg('<rect width="100%" height="100%" fill="#f2f2f2"/>')
    for (let i = 18; i >= 1; i--) layers.push({ input: await fillWith(await fullText(t, W, H, bw, bh, { dx: i, dy: i }), W, H, `rgb(${30 + i * 3},${60 + i * 4},${180 - i * 3})`) })
    layers.push({ input: await fillWith(mask, W, H, '#5aa0ff') })
  } else if (style === 'glitch') {
    base = bgSvg('<rect width="100%" height="100%" fill="#0a0a0a"/>')
    layers = [{ input: await fillWith(await fullText(t, W, H, bw, bh, { dx: -9 }), W, H, '#ff0040'), blend: 'screen' }, { input: await fillWith(await fullText(t, W, H, bw, bh, { dx: 9 }), W, H, '#00e5ff'), blend: 'screen' }, { input: await fillWith(mask, W, H, '#ffffff') }]
    const r = rng(hash(t)), bars = []
    for (let i = 0; i < 5; i++) bars.push(`<rect x="0" y="${Math.floor(r() * H)}" width="${W}" height="${3 + Math.floor(r() * 5)}" fill="#0a0a0a"/>`)
    layers.push({ input: bgSvg(bars.join('')) })
  } else { // hijau
    base = bgSvg('<rect width="100%" height="100%" fill="#020a04"/>')
    layers = [{ input: await blur(await fillWith(mask, W, H, '#00ff55'), 18) }, { input: await fillWith(mask, W, H, '#7dff9b') }]
  }
  return sharp(base).composite(layers).png().toBuffer()
}

// ══════════ .tulis — tulisan tangan di kertas buku ══════════
function wrapLines(text, max) {
  const out = []
  for (const para of String(text).replace(/\r/g, '').split('\n')) {
    let cur = ''
    for (const w of para.split(/\s+/).filter(Boolean)) {
      if ((cur + ' ' + w).trim().length > max) { if (cur) out.push(cur); cur = w.length > max ? (out.push(w.slice(0, max)), w.slice(max)) : w } else cur = (cur + ' ' + w).trim()
    }
    out.push(cur)
  }
  return out
}
async function handwriting(text, { nama = '', tanggal = '', ink = '#1b3a9a' } = {}) {
  const W = 1080, left = 150, pitch = 62, topY = 250, maxLines = 19
  const lines = wrapLines(text, 40).slice(0, maxLines), n = Math.max(lines.length, 12), H = topY + n * pitch + 130
  const r = rng(hash(text))
  const rule = Array.from({ length: n + 1 }, (_, i) => `<line x1="0" y1="${topY + i * pitch}" x2="${W}" y2="${topY + i * pitch}" stroke="#9ec5e8" stroke-width="2"/>`).join('')
  const holes = Array.from({ length: Math.max(3, Math.floor(H / 380)) }, (_, i) => `<circle cx="46" cy="${150 + i * 380}" r="17" fill="#d7d2c4" stroke="#bdb7a4" stroke-width="2"/>`).join('')
  const head = (nama || tanggal) ? `<text x="${left}" y="130" font-family="Serif" font-style="italic" font-size="38" fill="${ink}">${esc(nama)}</text><text x="${W - 70}" y="130" text-anchor="end" font-family="Serif" font-style="italic" font-size="34" fill="${ink}">${esc(tanggal)}</text>` : ''
  const body = lines.map((l, i) => {
    const rot = (r() - 0.5) * 1.6, dx = (r() - 0.5) * 8, dy = (r() - 0.5) * 4
    return `<text xml:space="preserve" transform="translate(${left + dx} ${topY + i * pitch - 14 + dy}) rotate(${rot.toFixed(2)})" font-family="Serif" font-style="italic" font-size="${40 + Math.round(r() * 2)}" fill="${ink}" opacity="0.93" letter-spacing="${(0.4 + r() * 0.5).toFixed(2)}">${esc(l)}</text>`
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#fdfcf6"/>${rule}<line x1="${left - 34}" y1="0" x2="${left - 34}" y2="${H}" stroke="#e8888e" stroke-width="3"/><line x1="${left - 42}" y1="0" x2="${left - 42}" y2="${H}" stroke="#e8888e" stroke-width="1.5"/>${holes}${head}${body}</svg>`
  return sharp(svgBuf(svg)).png().toBuffer()
}

// ══════════ .ucapan — kartu ucapan bertema ══════════
const UCAPAN = {
  ultah: { judul: 'SELAMAT ULANG TAHUN', pesan: 'Semoga panjang umur, sehat selalu, dan semua impianmu terwujud.', c: ['#ff9a9e', '#fad0c4', '#ff4d6d'], motif: 'balon' },
  lebaran: { judul: 'SELAMAT IDULFITRI', pesan: 'Taqabbalallahu minna wa minkum. Mohon maaf lahir dan batin.', c: ['#0f5132', '#1b8a5a', '#ffd166'], motif: 'bulan' },
  natal: { judul: 'SELAMAT NATAL', pesan: 'Semoga damai dan sukacita Natal memenuhi hati dan rumahmu.', c: ['#7a0c1e', '#c0392b', '#ffffff'], motif: 'salju' },
  tahunbaru: { judul: 'SELAMAT TAHUN BARU', pesan: 'Lembaran baru, semangat baru. Semoga tahun ini lebih baik dari yang kemarin.', c: ['#0b1026', '#2b1b5e', '#ffd166'], motif: 'kembangapi' },
  nikah: { judul: 'SELAMAT MENEMPUH HIDUP BARU', pesan: 'Semoga menjadi keluarga yang sakinah, mawaddah, dan warahmah.', c: ['#fdf0e6', '#f7d6c8', '#b5651d'], motif: 'cincin' },
  wisuda: { judul: 'SELAMAT WISUDA', pesan: 'Kerja kerasmu terbayar. Selamat memulai babak baru kehidupan.', c: ['#1d2b64', '#3a6ea5', '#ffd166'], motif: 'topi' },
  semangat: { fg: '#3b1a0a', judul: 'TETAP SEMANGAT', pesan: 'Hari ini mungkin berat, tapi kamu lebih kuat dari yang kamu kira.', c: ['#f12711', '#f5af19', '#ffffff'], motif: 'fajar' },
  terimakasih: { judul: 'TERIMA KASIH', pesan: 'Terima kasih atas bantuan dan kebaikanmu. Sangat berarti untukku.', c: ['#134e5e', '#71b280', '#ffffff'], motif: 'bunga' },
  jumat: { judul: 'JUMAT BERKAH', pesan: 'Semoga hari Jumat ini penuh berkah, ampunan, dan kemudahan.', c: ['#064e3b', '#10b981', '#fde68a'], motif: 'bulan' },
  sembuh: { judul: 'CEPAT SEMBUH', pesan: 'Istirahat yang cukup ya. Semoga lekas pulih dan sehat kembali.', c: ['#3a7bd5', '#8ec5fc', '#ffffff'], motif: 'bunga' },
}
const UCAPAN_ALIAS = { ulangtahun: 'ultah', birthday: 'ultah', idulfitri: 'lebaran', idulfitri2: 'lebaran', lebaran: 'lebaran', christmas: 'natal', newyear: 'tahunbaru', tahunbaru: 'tahunbaru', pernikahan: 'nikah', wedding: 'nikah', graduation: 'wisuda', kelulusan: 'wisuda', motivasi: 'semangat', makasih: 'terimakasih', thanks: 'terimakasih', jumatberkah: 'jumat', getwell: 'sembuh' }
function motif(kind, W, H, c, r) {
  const o = []
  if (kind === 'balon') {
    for (let i = 0; i < 9; i++) { const x = 80 + r() * (W - 160), y = 60 + r() * 330, rr = 46 + r() * 28, col = pick(r, ['#ff4d6d', '#ffd166', '#06d6a0', '#4cc9f0', '#b185db', '#ff9f1c']); o.push(`<line x1="${x}" y1="${y + rr}" x2="${x + (r() - 0.5) * 40}" y2="${y + rr + 150}" stroke="#ffffff" stroke-opacity="0.6" stroke-width="3"/><ellipse cx="${x}" cy="${y}" rx="${rr * 0.85}" ry="${rr}" fill="${col}"/><ellipse cx="${x - rr * 0.3}" cy="${y - rr * 0.35}" rx="${rr * 0.18}" ry="${rr * 0.3}" fill="#ffffff" opacity="0.45"/>`) }
    for (let i = 0; i < 60; i++) o.push(`<rect x="${r() * W}" y="${r() * H}" width="12" height="${5 + r() * 10}" fill="${pick(r, ['#ffffff', '#ffd166', '#ef476f', '#06d6a0'])}" opacity="0.7" transform="rotate(${r() * 360} ${W / 2} ${H / 2})"/>`)
  } else if (kind === 'bulan') {
    o.push(`<circle cx="${W - 250}" cy="250" r="130" fill="${c[2]}"/><circle cx="${W - 205}" cy="225" r="118" fill="${c[0]}"/>`)
    for (let i = 0; i < 40; i++) o.push(`<circle cx="${r() * W}" cy="${r() * 600}" r="${1.5 + r() * 3.5}" fill="#ffffff" opacity="${0.4 + r() * 0.6}"/>`)
    o.push(`<g fill="#06241a" opacity="0.85" transform="translate(0 ${H}) scale(1 0.55) translate(0 ${-H})"><rect x="0" y="${H - 190}" width="${W}" height="190"/><path d="M120 ${H - 190} v-150 a70 70 0 0 1 140 0 v150 z"/><rect x="95" y="${H - 420}" width="14" height="230"/><path d="M420 ${H - 190} v-110 a110 110 0 0 1 220 0 v110 z"/><rect x="700" y="${H - 440}" width="16" height="250"/><path d="M820 ${H - 190} v-120 a60 60 0 0 1 120 0 v120 z"/></g>`)
  } else if (kind === 'salju') {
    for (let i = 0; i < 70; i++) o.push(`<circle cx="${r() * W}" cy="${r() * H}" r="${2 + r() * 7}" fill="#ffffff" opacity="${0.35 + r() * 0.6}"/>`)
    for (const [x, s] of [[100, 0.8], [980, 0.9]]) o.push(`<g transform="translate(${x} ${H - 150}) scale(${s})" fill="#14532d"><polygon points="0,-260 80,-130 40,-130 110,-30 50,-30 130,70 -130,70 -50,-30 -110,-30 -40,-130 -80,-130"/><rect x="-18" y="70" width="36" height="46" fill="#5b3a1a"/><circle cx="0" cy="-268" r="14" fill="#ffd166"/></g>`)
  } else if (kind === 'kembangapi') {
    for (let k = 0; k < 4; k++) { const cx = 180 + r() * (W - 360), cy = 150 + r() * 380, col = pick(r, ['#ffd166', '#ef476f', '#4cc9f0', '#06d6a0']); for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, r1 = 30, r2 = 90 + r() * 50; o.push(`<line x1="${cx + Math.cos(a) * r1}" y1="${cy + Math.sin(a) * r1}" x2="${cx + Math.cos(a) * r2}" y2="${cy + Math.sin(a) * r2}" stroke="${col}" stroke-width="5" stroke-linecap="round"/><circle cx="${cx + Math.cos(a) * (r2 + 14)}" cy="${cy + Math.sin(a) * (r2 + 14)}" r="5" fill="${col}"/>`) } }
    for (let i = 0; i < 50; i++) o.push(`<circle cx="${r() * W}" cy="${r() * H}" r="${1 + r() * 3}" fill="#fff" opacity="${0.3 + r() * 0.6}"/>`)
  } else if (kind === 'cincin') {
    o.push(`<g fill="none" stroke="${c[2]}" stroke-width="16"><circle cx="${W / 2 - 52}" cy="300" r="82"/><circle cx="${W / 2 + 52}" cy="300" r="82"/></g><polygon points="${W / 2 - 52},205 ${W / 2 - 34},225 ${W / 2 - 70},225" fill="#e6f7ff" stroke="${c[2]}" stroke-width="4"/>`)
    for (let i = 0; i < 14; i++) o.push(`<circle cx="${80 + i * 70}" cy="${H - 60}" r="${16 + (i % 3) * 6}" fill="${pick(r, ['#f4a6a6', '#f7c6c6', '#e08a8a', '#fff'])}" opacity="0.8"/>`)
  } else if (kind === 'topi') {
    o.push(`<g transform="translate(${W / 2} 290)"><polygon points="0,-90 240,0 0,90 -240,0" fill="#111827"/><path d="M-130 40 v90 q130 70 260 0 v-90 l-130 55 z" fill="#1f2937"/><line x1="200" y1="14" x2="200" y2="150" stroke="${c[2]}" stroke-width="8"/><circle cx="200" cy="158" r="14" fill="${c[2]}"/></g>`)
    for (let i = 0; i < 30; i++) o.push(`<polygon points="0,-9 3,-3 9,-3 4,1 6,8 0,4 -6,8 -4,1 -9,-3 -3,-3" transform="translate(${r() * W} ${r() * 700}) scale(${0.8 + r()})" fill="${c[2]}" opacity="0.7"/>`)
  } else if (kind === 'fajar') {
    for (let i = 0; i < 18; i++) { const a = Math.PI + i / 17 * Math.PI; o.push(`<line x1="${W / 2}" y1="${H - 60}" x2="${W / 2 + Math.cos(a) * 1100}" y2="${H - 60 + Math.sin(a) * 1100}" stroke="#ffffff" stroke-opacity="0.13" stroke-width="26"/>`) }
    o.push(`<circle cx="${W / 2}" cy="${H - 60}" r="130" fill="#fff3b0" opacity="0.95"/><rect y="${H - 60}" width="${W}" height="60" fill="#3b1a0a" opacity="0.8"/>`)
  } else { // bunga
    for (let k = 0; k < 7; k++) { const cx = 90 + r() * (W - 180), cy = 80 + r() * 460, s = 0.7 + r() * 0.9, col = pick(r, ['#ffffff', '#ffe5ec', '#ffd6a5', '#fdffb6']); o.push(`<g transform="translate(${cx} ${cy}) scale(${s})" opacity="0.9">${Array.from({ length: 7 }, (_, i) => `<ellipse cx="0" cy="-42" rx="22" ry="44" fill="${col}" transform="rotate(${i * 360 / 7})"/>`).join('')}<circle r="20" fill="#f4b942"/></g>`) }
  }
  return o.join('')
}
async function greetingCard(kind, nama, pesan) {
  const T = UCAPAN[kind], W = 1080, H = 1350, r = rng(hash(kind + nama)), c = T.c
  const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/>${motif(T.motif, W, H, c, r)}<rect x="40" y="40" width="${W - 80}" height="${H - 80}" rx="30" fill="none" stroke="${c[2]}" stroke-opacity="0.8" stroke-width="4"/></svg>`
  const dark = contrast(c[0]) === '#ffffff', fg = T.fg || (T.motif === 'cincin' ? '#5a3418' : dark ? '#ffffff' : '#2b1b1b')
  const parts = []
  const add = async (txt, x, y, w, h, color, font) => { const t = await K.textBox(txt, w, h, { color, font }); parts.push(await K.centered(t, x, y, w, h)) }
  await add(T.judul, 110, 590, W - 220, 190, T.fg || (c[2] === '#ffffff' && !dark ? '#d62839' : (T.motif === 'cincin' ? '#b5651d' : c[2])), 'Serif Bold')
  if (nama) await add(nama, 140, 800, W - 280, 140, fg, 'Serif Bold Italic')
  await add(pesan || T.pesan, 160, 960, W - 320, 200, fg, 'Serif Italic')
  return sharp(svgBuf(bg)).composite(parts).png().toBuffer()
}

// ══════════ .wallpaper — latar generatif ══════════
const WP = ['aurora', 'mesh', 'geometri', 'gelembung', 'gelombang', 'bintang']
async function wallpaper(tema, seed, W = 1080, H = 2160) {
  const r = rng(hash(seed + tema)), pal = pick(r, PALET), c1 = pal[0], c2 = pal[1], ac = pal[2], rnd = (a, b) => a + r() * (b - a)
  const hue = () => `hsl(${Math.floor(r() * 360)} 85% 60%)`
  let inner = ''
  if (tema === 'aurora') {
    inner = `<defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050816"/><stop offset="1" stop-color="#0d1b3a"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#b)"/>`
    for (let i = 0; i < 6; i++) inner += `<ellipse cx="${rnd(0, W)}" cy="${rnd(H * 0.15, H * 0.7)}" rx="${rnd(260, 520)}" ry="${rnd(120, 260)}" fill="${pick(r, ['#2bffb0', '#4d7cff', '#b04dff', '#2be3ff'])}" opacity="0.5" transform="rotate(${rnd(-40, 40)} ${W / 2} ${H / 2})"/>`
    inner = `<g filter="url(#f)">${inner.replace(/^<defs>.*?<\/defs><rect[^>]*\/>/, '')}</g>`
    inner = `<defs><filter id="f" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="90"/></filter><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050816"/><stop offset="1" stop-color="#0d1b3a"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#b)"/>` + inner
    for (let i = 0; i < 80; i++) inner += `<circle cx="${r() * W}" cy="${r() * H}" r="${r() * 2.2 + 0.4}" fill="#fff" opacity="${0.3 + r() * 0.7}"/>`
  } else if (tema === 'mesh') {
    inner = `<defs><filter id="f" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="110"/></filter></defs><rect width="${W}" height="${H}" fill="${c1}"/><g filter="url(#f)">`
    for (let i = 0; i < 7; i++) inner += `<circle cx="${rnd(-100, W + 100)}" cy="${rnd(-100, H + 100)}" r="${rnd(260, 520)}" fill="${i % 2 ? hue() : ac}" opacity="0.8"/>`
    inner += '</g>'
  } else if (tema === 'geometri') {
    const cols = 6, rows = 12, cw = W / cols, ch = H / rows, pts = []
    for (let y = 0; y <= rows; y++) { pts[y] = []; for (let x = 0; x <= cols; x++) pts[y][x] = [x * cw + (x && x < cols ? rnd(-cw / 3, cw / 3) : 0), y * ch + (y && y < rows ? rnd(-ch / 3, ch / 3) : 0)] }
    inner = `<rect width="${W}" height="${H}" fill="${c1}"/>`
    const shade = (t) => { const mix = (a, b) => Math.round(a + (b - a) * t); const p = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(c1), B = p(ac); return `rgb(${mix(A[0], B[0])},${mix(A[1], B[1])},${mix(A[2], B[2])})` }
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const a = pts[y][x], b = pts[y][x + 1], c = pts[y + 1][x], d = pts[y + 1][x + 1], t1 = (y / rows) * 0.6 + r() * 0.35, t2 = (y / rows) * 0.6 + r() * 0.35
      inner += `<polygon points="${a} ${b} ${c}" fill="${shade(Math.min(1, t1))}"/><polygon points="${b} ${d} ${c}" fill="${shade(Math.min(1, t2))}"/>`
    }
  } else if (tema === 'gelembung') {
    inner = `<defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#b)"/>`
    for (let i = 0; i < 38; i++) { const rr = rnd(30, 190); inner += `<circle cx="${rnd(0, W)}" cy="${rnd(0, H)}" r="${rr}" fill="${ac}" opacity="${rnd(0.05, 0.22)}"/><circle cx="${rnd(0, W)}" cy="${rnd(0, H)}" r="${rnd(10, 60)}" fill="none" stroke="#fff" stroke-opacity="0.25" stroke-width="3"/>` }
  } else if (tema === 'gelombang') {
    inner = `<defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#b)"/>`
    for (let i = 0; i < 9; i++) { const y = H * 0.25 + i * (H * 0.09), a = rnd(50, 130), p = rnd(0.8, 1.6); let d = `M0 ${H} L0 ${y}`; for (let x = 0; x <= W; x += 30) d += ` L${x} ${y + Math.sin(x / W * Math.PI * 2 * p + i) * a}`; inner += `<path d="${d} L${W} ${H} Z" fill="${ac}" opacity="${0.08 + i * 0.03}"/>` }
  } else { // bintang
    inner = `<defs><radialGradient id="b" cx="0.5" cy="0.8" r="1"><stop offset="0" stop-color="${c2}"/><stop offset="1" stop-color="#03030a"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#b)"/>`
    for (let i = 0; i < 380; i++) { const s = r() ** 3 * 3.2 + 0.4; inner += `<circle cx="${r() * W}" cy="${r() * H}" r="${s}" fill="#fff" opacity="${0.25 + r() * 0.75}"/>` }
    inner += `<circle cx="${rnd(200, 880)}" cy="${rnd(300, 900)}" r="150" fill="${ac}" opacity="0.9"/><circle cx="${rnd(200, 880)}" cy="${rnd(300, 900)}" r="0" fill="none"/>`
  }
  return sharp(svgBuf(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${inner}</svg>`)).png().toBuffer()
}

// ══════════ .kartunama — kartu nama ══════════
async function businessCard(nama, jabatan, kontak, tema) {
  const W = 1050, H = 600, [c1, c2, ac] = PALET[(Number.isInteger(tema) ? tema : hash(nama)) % PALET.length]
  const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="${W}" height="${H}" rx="26" fill="url(#g)"/><circle cx="${W - 90}" cy="90" r="230" fill="${ac}" opacity="0.12"/><circle cx="${W - 20}" cy="${H - 20}" r="170" fill="${ac}" opacity="0.12"/><rect x="60" y="60" width="10" height="${H - 120}" rx="5" fill="${ac}"/></svg>`
  const parts = []
  const add = async (txt, x, y, w, h, color, font, align = 'left') => { const t = await K.textBox(txt, w, h, { color, font, align }); const m = await sharp(t).metadata(); parts.push({ input: t, left: x, top: Math.round(y + (h - m.height) / 2) }) }
  await add(nama, 110, 150, 760, 130, '#ffffff', 'Sans Bold')
  if (jabatan) await add(jabatan, 110, 295, 700, 60, ac, 'Sans')
  if (kontak) await add(kontak.split('/').map(s => s.trim()).filter(Boolean).slice(0, 3).join('\n'), 110, 400, 760, 130, '#e6e6e6', 'Sans')
  return sharp(svgBuf(bg)).composite(parts).png().toBuffer()
}

// ══════════ .bratwarna — brat dengan warna bebas ══════════
async function bratColor(text, bg = '#111111', fg = null, size = 512) {   // gaya plakat Chisa AI (lib/bratstyle.js)
  return require('./bratstyle').render(text, { bg, fg }, size)
}

// ══════════ game gambar: hitung benda, swatch warna ══════════
async function shapesImage(n, seed) {
  const W = 900, H = 600, r = rng(hash(seed)), items = [], cols = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#9b5de5', '#f78c6b']
  let guard = 0
  while (items.length < n && guard++ < 6000) {
    const s = 26 + r() * 22, x = s + 10 + r() * (W - 2 * s - 20), y = s + 10 + r() * (H - 2 * s - 20)
    if (items.every(i => Math.hypot(i.x - x, i.y - y) > i.s + s + 6)) items.push({ x, y, s, k: Math.floor(r() * 3), c: pick(r, cols), rot: r() * 360 })
  }
  const sh = items.map(i => i.k === 0 ? `<circle cx="${i.x}" cy="${i.y}" r="${i.s}" fill="${i.c}"/>` : i.k === 1 ? `<rect x="${i.x - i.s * 0.85}" y="${i.y - i.s * 0.85}" width="${i.s * 1.7}" height="${i.s * 1.7}" rx="6" fill="${i.c}" transform="rotate(${i.rot} ${i.x} ${i.y})"/>` : `<polygon points="${i.x},${i.y - i.s} ${i.x + i.s},${i.y + i.s * 0.8} ${i.x - i.s},${i.y + i.s * 0.8}" fill="${i.c}" transform="rotate(${i.rot} ${i.x} ${i.y})"/>`).join('')
  return { buf: await sharp(svgBuf(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#f7f4ea"/>${sh}<rect x="3" y="3" width="${W - 6}" height="${H - 6}" fill="none" stroke="#2b2b2b" stroke-width="6"/></svg>`)).png().toBuffer(), count: items.length }
}
const swatch = (hex) => sharp(svgBuf(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="${hex}"/><rect x="4" y="4" width="592" height="392" fill="none" stroke="#333" stroke-width="8"/></svg>`)).png().toBuffer()

module.exports = { WARNA, parseColor, contrast, chatBubble, logoText, LOGO_STYLES, handwriting, UCAPAN, UCAPAN_ALIAS, greetingCard, WP, wallpaper, businessCard, bratColor, shapesImage, swatch }

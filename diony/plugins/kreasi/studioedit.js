/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Edit Studio Sosmed (v4.19): kirim / reply foto atau video lalu pakai perintahnya. Semua lokal (sharp + ffmpeg), tanpa API.
//   Foto  : .fitpost  .filter  .teksfoto  .bingkai  .puzzle  .thumbnail  .quotepost
//   Video : .potongvideo  .kecepatan  .mundur  .bisu  .loopvid  .fitvid  .framevideo
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { execFile } = require('child_process')
const sharp = require('../../lib/sharp.js')
const L = require('../../lib/stickerlib'), K2 = require('../../lib/kreasi2')

let FFMPEG = 'ffmpeg'
try { const p = require('@ffmpeg-installer/ffmpeg').path; if (typeof p === 'string' && p) FFMPEG = p } catch {}
const TMP = path.join(__dirname, '..', '..', 'tmp')
const tmpFile = (ext) => { fs.mkdirSync(TMP, { recursive: true }); return path.join(TMP, `edt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`) }
const rm = (...f) => { for (const x of f) try { fs.unlinkSync(x) } catch {} }

const MAX_PIXELS = 40e6, MAX_IMG = 12 * 1024 * 1024, MAX_VID = 25 * 1024 * 1024, MAX_SEC = 90

const INFO = {
  fitpost: ['.fitpost <feed|potret|story|yt|thumb|x|fb|pp> [crop|blur|putih|hitam|warna]', 'ubah foto ke ukuran post platform (blur = latar blur, tanpa terpotong)'],
  filter: ['.filter <nama>', 'filter ala IG: hangat, dingin, pudar, matte, dramatis, vivid, hitamputih, sepia, teal, pastel, retro, sinema, grain, vignette'],
  teksfoto: ['.teksfoto <atas>|<bawah>', 'teks gaya meme di atas dan/atau bawah foto'],
  bingkai: ['.bingkai [warna] [tebal 1-25] [kotak]', 'beri bingkai warna; kotak = jadikan persegi 1:1'],
  puzzle: ['.puzzle [3x3|3x1|3x2|2x2 ...]', 'potong foto jadi kotak-kotak untuk feed puzzle Instagram (dikirim urut posting)'],
  thumbnail: ['.thumbnail <judul> [warna]', 'thumbnail YouTube 1280x720 (foto latar opsional)'],
  quotepost: ['.quotepost <kutipan>|<nama> [--gelap|--terang|--senja|--laut|--hutan|--ungu]', 'kartu kutipan 1080x1350 siap posting'],
  potongvideo: ['.potongvideo <mulai>-<akhir>', 'potong video (mis. 5-15 atau 0:05-0:15; 10- = dari detik 10 sampai akhir)'],
  kecepatan: ['.kecepatan <0.25-4>', 'percepat / perlambat video beserta suaranya'],
  mundur: ['.mundur', 'putar video mundur (maks 30 detik)'],
  bisu: ['.bisu', 'hapus suara dari video'],
  loopvid: ['.loopvid [2-5]', 'ulang video beberapa kali (total maks 90 detik)'],
  fitvid: ['.fitvid <story|feed|potret|yt> [crop]', 'pas-kan video ke rasio platform dengan latar blur'],
  framevideo: ['.framevideo [detik]', 'ambil satu frame dari video jadi gambar (cocok untuk cover)'],
}
const CMDS = Object.keys(INFO)
const IMG_CMDS = ['fitpost', 'filter', 'teksfoto', 'bingkai', 'puzzle', 'thumbnail', 'quotepost']
const VID_CMDS = ['potongvideo', 'kecepatan', 'mundur', 'bisu', 'loopvid', 'fitvid', 'framevideo']

// ───────────── ukuran platform ─────────────
const PRESET = {
  feed: [1080, 1080], persegi: [1080, 1080], potret: [1080, 1350], story: [1080, 1920], reel: [1080, 1920], reels: [1080, 1920], tiktok: [1080, 1920], status: [1080, 1920], short: [1080, 1920], shorts: [1080, 1920],
  yt: [1920, 1080], youtube: [1920, 1080], thumb: [1280, 720], thumbnail: [1280, 720], x: [1600, 900], twitter: [1600, 900], fb: [1200, 630], facebook: [1200, 630], linkedin: [1200, 627], pp: [640, 640], profil: [640, 640],
}
const presetOf = (k) => PRESET[String(k || '').toLowerCase()] || null

// ───────────── util teks ke SVG ─────────────
const esc = (s) => String(s).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]))
function wrap(text, maxChars) {
  const out = []
  for (const para of String(text).split(/\n/)) {
    let line = ''
    for (let w of para.split(/\s+/).filter(Boolean)) {
      while (Array.from(w).length > maxChars) { if (line) { out.push(line); line = '' } const a = Array.from(w); out.push(a.slice(0, maxChars).join('')); w = a.slice(maxChars).join('') }
      if (!line) line = w
      else if (Array.from(line + ' ' + w).length <= maxChars) line += ' ' + w
      else { out.push(line); line = w }
    }
    if (line) out.push(line)
  }
  return out
}
// cari ukuran huruf terbesar yang muat di kotak boxW x boxH
function layoutText(text, boxW, boxH, { charW = 0.62, lineH = 1.2, maxFs = 120, minFs = 16 } = {}) {
  for (let fsz = maxFs; fsz >= minFs; fsz -= 2) {
    const lines = wrap(text, Math.max(4, Math.floor(boxW / (fsz * charW))))
    if (lines.length * fsz * lineH <= boxH) return { fs: fsz, lines, lh: fsz * lineH }
  }
  const fsz = minFs, lines = wrap(text, Math.max(4, Math.floor(boxW / (fsz * charW))))
  const maxLines = Math.max(1, Math.floor(boxH / (fsz * lineH)))
  return { fs: fsz, lines: lines.slice(0, maxLines), lh: fsz * lineH }
}
// satu blok teks (anchor: middle/start) pada y0 (atas blok); stroke = garis tepi
function textEls(block, { x, y0, anchor = 'middle', fill = '#fff', stroke = null, sw = 0, family = 'DejaVu Sans, Sans', weight = 700, style = 'normal' }) {
  return block.lines.map((ln, i) => {
    const y = Math.round(y0 + block.lh * i + block.fs * 0.9)
    const base = `x="${x}" y="${y}" text-anchor="${anchor}" font-family="${family}" font-weight="${weight}" font-style="${style}" font-size="${block.fs}"`
    return (stroke ? `<text ${base} fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round">${esc(ln)}</text>` : '') + `<text ${base} fill="${fill}">${esc(ln)}</text>`
  }).join('')
}
const svgDoc = (W, H, inner) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${inner}</svg>`)

// ───────────── gambar ─────────────
const open = (buf) => sharp(buf, { failOn: 'none', limitInputPixels: MAX_PIXELS }).rotate()
const jpg = (img, q = 92) => img.jpeg({ quality: q, mozjpeg: true }).toBuffer()

async function fitPost(buf, W, H, mode = 'crop') {
  const color = K2.parseColor(mode) || (mode === 'putih' ? '#ffffff' : mode === 'hitam' ? '#000000' : null)
  if (mode === 'blur') {
    const base = await open(buf).toBuffer()
    const bg = await sharp(base).resize(W, H, { fit: 'cover' }).blur(28).modulate({ brightness: 0.75 }).toBuffer()
    const fg = await sharp(base).resize(W, H, { fit: 'inside' }).toBuffer()
    return jpg(sharp(bg).composite([{ input: fg, gravity: 'centre' }]))
  }
  if (color) return jpg(open(buf).resize(W, H, { fit: 'contain', background: color }).flatten({ background: color }))
  return jpg(open(buf).resize(W, H, { fit: 'cover', position: 'attention' }))
}

const FILTERS = {
  hangat: (s) => s.linear([1.08, 1.0, 0.9], [8, 2, -8]).modulate({ saturation: 1.12 }),
  dingin: (s) => s.linear([0.92, 1.0, 1.1], [-6, 0, 8]).modulate({ saturation: 1.05 }),
  pudar: (s) => s.linear(0.85, 38).modulate({ saturation: 0.85 }),
  matte: (s) => s.linear(0.9, 26).modulate({ saturation: 0.8 }),
  dramatis: (s) => s.linear(1.25, -36).modulate({ saturation: 1.12 }).sharpen({ sigma: 1.0 }),
  vivid: (s) => s.modulate({ saturation: 1.5, brightness: 1.03 }),
  hitamputih: (s) => s.greyscale().linear(1.15, -16),
  sepia: (s) => s.recomb([[0.393, 0.769, 0.189], [0.349, 0.686, 0.168], [0.272, 0.534, 0.131]]),
  teal: (s) => s.linear([1.12, 1.0, 0.88], [6, 0, 12]).modulate({ saturation: 1.1 }),
  pastel: (s) => s.linear(0.8, 52).modulate({ saturation: 0.9 }),
}
const FILTER_ALIAS = { warm: 'hangat', cool: 'dingin', fade: 'pudar', dramatic: 'dramatis', bw: 'hitamputih', hitam: 'hitamputih', mono: 'hitamputih', cinema: 'sinema', cinematic: 'sinema', tealorange: 'teal', film: 'retro' }
const FILTER_NAMES = [...Object.keys(FILTERS), 'retro', 'sinema', 'grain', 'vignette']

async function vignette(buf, strength = 0.55) {
  const { width: W, height: H } = await sharp(buf).metadata()
  const svg = svgDoc(W, H, `<defs><radialGradient id="v" cx="50%" cy="50%" r="75%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="${strength}"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#v)"/>`)
  return sharp(buf).composite([{ input: svg }]).png().toBuffer()
}
async function grain(buf) {
  const { width: W, height: H } = await sharp(buf).metadata()
  const noise = await sharp({ create: { width: W, height: H, channels: 3, background: { r: 128, g: 128, b: 128 }, noise: { type: 'gaussian', mean: 128, sigma: 34 } } }).png().toBuffer()
  return sharp(buf).composite([{ input: noise, blend: 'soft-light' }]).png().toBuffer()
}
async function letterbox(buf) {
  const { width: W, height: H } = await sharp(buf).metadata(), h = Math.round(W / 2.39)
  if (h >= H) return buf
  const bar = Math.floor((H - h) / 2)
  const svg = svgDoc(W, H, `<rect width="${W}" height="${bar}" fill="#000"/><rect y="${H - bar}" width="${W}" height="${bar}" fill="#000"/>`)
  return sharp(buf).composite([{ input: svg }]).png().toBuffer()
}
async function applyFilter(buf, rawName) {
  let name = String(rawName || '').toLowerCase().replace(/[^a-z]/g, ''); name = FILTER_ALIAS[name] || name
  if (!FILTER_NAMES.includes(name)) return null
  let png = await open(buf).removeAlpha().png().toBuffer()
  if (FILTERS[name]) png = await FILTERS[name](sharp(png)).png().toBuffer()
  else if (name === 'grain') png = await grain(png)
  else if (name === 'vignette') png = await vignette(png)
  else if (name === 'retro') png = await grain(await vignette(await FILTERS.sepia(sharp(png)).linear(0.9, 14).png().toBuffer(), 0.5))
  else if (name === 'sinema') png = await letterbox(await FILTERS.teal(sharp(png)).linear(1.12, -18).png().toBuffer())
  return jpg(sharp(png))
}

async function memeText(buf, top, bottom) {
  const base = await open(buf).toBuffer(), { width: W, height: H } = await sharp(base).metadata()
  const boxW = W * 0.92, boxH = H * 0.3, maxFs = Math.round(W / 9), sw = Math.max(3, Math.round(W / 130)), els = []
  const mk = (t) => layoutText(String(t).toUpperCase(), boxW, boxH, { charW: 0.7, lineH: 1.1, maxFs, minFs: 14 })
  if (top) { const b = mk(top); els.push(textEls(b, { x: W / 2, y0: H * 0.03, fill: '#fff', stroke: '#000', sw })) }
  if (bottom) { const b = mk(bottom); els.push(textEls(b, { x: W / 2, y0: H * 0.97 - b.lines.length * b.lh, fill: '#fff', stroke: '#000', sw })) }
  return jpg(sharp(base).composite([{ input: svgDoc(W, H, els.join('')) }]))
}

async function frame(buf, color, pct, square) {
  let base = await open(buf).toBuffer()
  const meta = await sharp(base).metadata()
  if (square) { const S = Math.max(meta.width, meta.height); base = await sharp(base).resize(S, S, { fit: 'contain', background: color }).flatten({ background: color }).toBuffer() }
  const w = (await sharp(base).metadata()).width, t = Math.max(2, Math.round(w * pct / 100))
  return jpg(sharp(base).flatten({ background: color }).extend({ top: t, bottom: t, left: t, right: t, background: color }))
}

function parseGrid(s) {
  const mm = /^(\d)\s*[x×*]\s*(\d)$/i.exec(String(s || '3x3').trim()); if (!mm) return null
  const c = +mm[1], r = +mm[2]
  return c >= 1 && r >= 1 && c <= 4 && r <= 4 && c * r >= 2 ? { c, r } : null
}
async function puzzle(buf, c, r, tile = 1080) {
  const W = c * tile, H = r * tile
  const big = await open(buf).resize(W, H, { fit: 'cover', position: 'attention' }).toBuffer()
  const tiles = []
  for (let row = r - 1; row >= 0; row--) for (let col = c - 1; col >= 0; col--) {     // urutan posting: kanan-bawah dulu, kiri-atas terakhir
    tiles.push({ row: row + 1, col: col + 1, buf: await jpg(sharp(big).extract({ left: col * tile, top: row * tile, width: tile, height: tile }), 90) })
  }
  return tiles
}

const GRADIENT = {
  gelap: ['#0f172a', '#1e293b', '#f8fafc', '#94a3b8'], terang: ['#fdfcf7', '#efe9dc', '#1f2937', '#6b7280'], senja: ['#ff7e5f', '#7b2ff7', '#ffffff', '#ffe4d6'],
  laut: ['#0f4c75', '#00b4d8', '#ffffff', '#d6f4ff'], hutan: ['#1b4332', '#52b788', '#ffffff', '#d8f3dc'], ungu: ['#4c1d95', '#c026d3', '#ffffff', '#f5d0fe'],
}
async function quotePost(quote, author, theme = 'gelap') {
  const W = 1080, H = 1350, [c1, c2, fg, sub] = GRADIENT[theme] || GRADIENT.gelap
  const body = layoutText(quote, W - 240, 700, { charW: 0.5, lineH: 1.35, maxFs: 76, minFs: 30 })
  const bodyH = body.lines.length * body.lh, y0 = Math.round((H - bodyH) / 2 - 20)
  const els = [`<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/>`,
    `<text x="120" y="${Math.max(170, y0 - 40)}" font-family="DejaVu Serif, Serif" font-size="190" fill="${sub}" fill-opacity="0.45">“</text>`,
    textEls(body, { x: W / 2, y0, fill: fg, family: 'DejaVu Serif, Serif', weight: 600, style: 'italic' })]
  if (author) els.push(`<rect x="${W / 2 - 40}" y="${y0 + bodyH + 36}" width="80" height="4" fill="${sub}" fill-opacity="0.7"/>`, textEls(layoutText('— ' + author, W - 260, 90, { charW: 0.55, maxFs: 38, minFs: 22 }), { x: W / 2, y0: y0 + bodyH + 60, fill: sub, weight: 700 }))
  return jpg(sharp(svgDoc(W, H, els.join(''))), 94)
}
async function thumbnail(title, bgBuf, color) {
  const W = 1280, H = 720, accent = color || '#ffd600'
  let base
  if (bgBuf) base = await open(bgBuf).resize(W, H, { fit: 'cover', position: 'attention' }).modulate({ saturation: 1.15 }).toBuffer()
  else base = await sharp(svgDoc(W, H, `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#111827"/><stop offset="1" stop-color="${accent}" stop-opacity="0.55"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/>`)).png().toBuffer()
  const b = layoutText(String(title).toUpperCase(), W * 0.86, H * 0.62, { charW: 0.68, lineH: 1.08, maxFs: 150, minFs: 36 })
  const y0 = Math.round(H * 0.5 - (b.lines.length * b.lh) / 2)
  const shade = `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0.25" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.65"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#s)"/>`
  const txt = textEls(b, { x: W / 2, y0, fill: accent, stroke: '#000', sw: 14, family: 'DejaVu Sans, Sans', weight: 800 })
  const bar = `<rect x="0" y="${H - 14}" width="${W}" height="14" fill="${accent}"/>`
  return jpg(sharp(base).composite([{ input: svgDoc(W, H, shade + txt + bar) }]), 92)
}

// ───────────── video (ffmpeg) ─────────────
const ff = (args, timeout = 150000) => new Promise((res, rej) => execFile(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { maxBuffer: 1 << 26, timeout }, (e, _o, se) => e ? rej(new Error(String(se || e.message).split('\n').filter(Boolean).slice(-3).join(' '))) : res()))
const probe = (file) => new Promise((res) => execFile(FFMPEG, ['-hide_banner', '-i', file], { timeout: 20000 }, (_e, _o, se) => {
  se = String(se || ''); const d = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(se), sz = /Video:.*?,\s*(\d{2,5})x(\d{2,5})/.exec(se)
  res({ duration: d ? (+d[1]) * 3600 + (+d[2]) * 60 + parseFloat(d[3]) : null, hasAudio: /Audio:/.test(se), hasVideo: /Video:/.test(se), w: sz ? +sz[1] : null, h: sz ? +sz[2] : null })
}))
function parseTime(s) {
  s = String(s || '').trim(); if (!s) return NaN
  const p = s.split(':'); if (p.length > 3) return NaN
  let t = 0; for (const x of p) { if (!/^\d+(\.\d+)?$/.test(x)) return NaN; t = t * 60 + parseFloat(x) }
  return t
}
function parseRange(arg) {
  const mm = /^\s*([\d:.]*)\s*[-–—]\s*([\d:.]*)\s*$/.exec(String(arg || '')); if (!mm || (!mm[1] && !mm[2])) return null
  const a = mm[1] ? parseTime(mm[1]) : 0, b = mm[2] ? parseTime(mm[2]) : null
  if (Number.isNaN(a) || (b !== null && Number.isNaN(b)) || (b !== null && b <= a)) return null
  return { a, b }
}
function atempoChain(f) {
  const out = []; while (f > 2) { out.push(2); f /= 2 } while (f < 0.5) { out.push(0.5); f /= 0.5 } out.push(f)
  return out.map(x => `atempo=${+x.toFixed(4)}`).join(',')
}
const X264 = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']
function fitVidFilter(W, H, crop) {
  if (crop) return `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1[v]`
  return `[0:v]split[a][b];[a]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=24:6[bg];[b]scale=${W}:${H}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1[v]`
}
// bangun argumen ffmpeg per perintah (dipisah agar mudah diuji)
function buildVideoArgs(cmd, inp, out, o) {
  const aud = o.hasAudio
  switch (cmd) {
    case 'potongvideo': {
      const args = ['-ss', String(o.a), ...(o.b != null ? ['-to', String(o.b)] : []), '-i', inp, ...X264]
      return [...args, ...(aud ? ['-c:a', 'aac', '-b:a', '128k'] : ['-an']), out]
    }
    case 'kecepatan': {
      const f = o.factor, args = ['-i', inp, '-filter:v', `setpts=PTS/${f}`, ...X264]
      return [...args, ...(aud ? ['-filter:a', atempoChain(f), '-c:a', 'aac', '-b:a', '128k'] : ['-an']), out]
    }
    case 'mundur': return ['-i', inp, '-vf', 'reverse', ...(aud ? ['-af', 'areverse', '-c:a', 'aac'] : ['-an']), ...X264, out]
    case 'bisu': return ['-i', inp, '-an', '-c:v', 'copy', '-movflags', '+faststart', out]
    case 'loopvid': return ['-stream_loop', String(o.n - 1), '-i', inp, '-c', 'copy', '-movflags', '+faststart', out]
    case 'fitvid': return ['-i', inp, '-filter_complex', fitVidFilter(o.W, o.H, o.crop), '-map', '[v]', ...(aud ? ['-map', '0:a?', '-c:a', 'aac', '-b:a', '128k'] : ['-an']), ...X264, out]
  }
  return null
}

const busy = new Set()
const lastUse = new Map()

module.exports = {
  name: 'studioedit', alias: CMDS, category: 'kreasi', cmds: CMDS,
  desc: 'Edit Studio sosmed: fitpost, filter, teksfoto, bingkai, puzzle, thumbnail, quotepost, potongvideo, kecepatan, mundur, bisu, loopvid, fitvid, framevideo',
  INFO, PRESET, FILTER_NAMES, GRADIENT, presetOf, wrap, layoutText, fitPost, applyFilter, memeText, frame, parseGrid, puzzle, quotePost, thumbnail, parseTime, parseRange, atempoChain, buildVideoArgs, fitVidFilter,
  run: async ({ sock, m, text, args, command, prefix, reply, sender }) => {
    const cmd = command, U = (c) => `${prefix}${c}`
    const usage = () => reply(`🎬 *${cmd.toUpperCase()}*\n\n> ${INFO[cmd][0].replace('.', prefix)}\n_${INFO[cmd][1]}_\n\nKirim atau reply ${VID_CMDS.includes(cmd) ? '*video*' : 'sebuah *foto*'} dengan perintah ini.${cmd === 'fitpost' ? '\n\nUkuran: ' + Object.keys(PRESET).join(', ') : ''}${cmd === 'filter' ? '\n\nFilter: ' + FILTER_NAMES.join(', ') : ''}`)
    const media = L.pickMedia(m), arg = (text || '').trim()
    const who = (m && m.sender) || sender || 'anon'

    // ── foto ──
    if (IMG_CMDS.includes(cmd)) {
      const isImg = media && ['image', 'sticker'].includes(media.kind)
      const needImg = !['thumbnail', 'quotepost'].includes(cmd)
      if (cmd === 'quotepost') {
        if (!arg) return usage()
      } else if (cmd === 'thumbnail') {
        if (!arg) return usage()
      } else if (!isImg) return usage()
      if (isImg && media.node && Number(media.node.fileLength) > MAX_IMG) return reply(`❌ Foto terlalu besar (maks ${MAX_IMG / 1048576} MB).`)
      try {
        const buf = isImg && (needImg || cmd === 'thumbnail') ? await L.download(media) : null
        if (needImg && (!buf || !buf.length)) return reply('❌ Gagal mengunduh foto.')
        const send = (img, cap) => sock.sendMessage(m.chat, { image: img, caption: cap }, { quoted: m })
        if (cmd === 'fitpost') {
          const [k, ...rest] = args, p = presetOf(k); if (!p) return reply(`Ukuran "${k || ''}" tidak dikenal.\n\nUkuran: ${Object.keys(PRESET).join(', ')}\nContoh: ${U('fitpost story blur')}`)
          const mode = (rest[0] || 'crop').toLowerCase()
          if (!['crop', 'blur', 'putih', 'hitam'].includes(mode) && !K2.parseColor(mode)) return reply(`Mode "${mode}" tidak dikenal. Pakai: crop, blur, putih, hitam, atau nama warna / #hex.`)
          return send(await fitPost(buf, p[0], p[1], mode), `📐 ${p[0]}×${p[1]} (${k.toLowerCase()}, ${mode})`)
        }
        if (cmd === 'filter') {
          if (!args[0]) return reply(`🎞️ *FILTER FOTO*\n\n${FILTER_NAMES.map(n => `> ${U('filter ' + n)}`).join('\n')}`)
          const out = await applyFilter(buf, args[0]); if (!out) return reply(`Filter "${args[0]}" tidak ada.\n\nPilihan: ${FILTER_NAMES.join(', ')}`)
          return send(out, `🎞️ Filter ${args[0].toLowerCase()}`)
        }
        if (cmd === 'teksfoto') {
          if (!arg) return usage()
          const [top, ...b] = arg.split('|'), bottom = b.join('|').trim()
          const only = !arg.includes('|')
          const t1 = only ? '' : top.trim(), t2 = only ? arg : bottom
          if (!t1 && !t2) return usage()
          if (Math.max(t1.length, t2.length) > 140) return reply('❌ Teks terlalu panjang (maks 140 huruf per bagian).')
          return send(await memeText(buf, t1, t2), '🔤 Teks ditempel')
        }
        if (cmd === 'bingkai') {
          let color = '#ffffff', pct = 6, square = false
          for (const a of args) { const lo = a.toLowerCase(); if (lo === 'kotak') square = true; else if (/^\d{1,2}$/.test(a)) pct = Math.min(25, Math.max(1, +a)); else if (K2.parseColor(a)) color = K2.parseColor(a) }
          return send(await frame(buf, color, pct, square), `🖼️ Bingkai ${color} ${pct}%${square ? ' • 1:1' : ''}`)
        }
        if (cmd === 'puzzle') {
          const g = parseGrid(args[0] || '3x3'); if (!g) return reply(`Format kisi: ${U('puzzle 3x3')} (kolom x baris, masing-masing 1–4, minimal 2 kotak).`)
          if (lastUse.get(who) > Date.now() - 15000) return reply('⏳ Tunggu sebentar sebelum memakai puzzle lagi.')
          lastUse.set(who, Date.now())
          const tiles = await puzzle(buf, g.c, g.r)
          await reply(`🧩 ${g.c}×${g.r} = ${tiles.length} kotak. Unggah ke Instagram *sesuai urutan kiriman* (kotak 1 dulu) supaya tersusun rapi di profil.`)
          for (let i = 0; i < tiles.length; i++) {
            await send(tiles[i].buf, `#${i + 1}/${tiles.length} • baris ${tiles[i].row}, kolom ${tiles[i].col}`)
            await new Promise(r => setTimeout(r, 700))
          }
          return
        }
        if (cmd === 'thumbnail') {
          const parts = arg.split(/\s+/), last = parts[parts.length - 1], col = parts.length > 1 ? K2.parseColor(last) : null
          const title = (col ? parts.slice(0, -1) : parts).join(' ')
          if (title.length > 90) return reply('❌ Judul terlalu panjang (maks 90 huruf).')
          return send(await thumbnail(title, buf, col), '🖼️ Thumbnail 1280×720')
        }
        if (cmd === 'quotepost') {
          const flag = /--(gelap|terang|senja|laut|hutan|ungu)\b/i.exec(arg), theme = flag ? flag[1].toLowerCase() : 'gelap'
          const clean = arg.replace(/--\w+/g, '').trim(), [q, ...au] = clean.split('|'), quote = q.trim(), author = au.join('|').trim()
          if (!quote) return usage()
          if (quote.length > 400) return reply('❌ Kutipan terlalu panjang (maks 400 huruf).')
          return send(await quotePost(quote, author.slice(0, 60), theme), `💬 Kartu kutipan (${theme})`)
        }
      } catch (e) { console.log('[studioedit]', cmd, e.message); return reply('❌ Gagal memproses foto: ' + e.message) }
      return
    }

    // ── video ──
    if (!media || media.kind !== 'video') return usage()
    if (media.node && Number(media.node.fileLength) > MAX_VID) return reply(`❌ Video terlalu besar (maks ${MAX_VID / 1048576} MB).`)
    if (busy.has(who)) return reply('⏳ Masih ada proses video milikmu yang berjalan. Tunggu selesai dulu.')
    if (lastUse.get(who) > Date.now() - 8000) return reply('⏳ Tunggu beberapa detik sebelum memproses video lagi.')

    // validasi argumen sebelum mengunduh
    const opt = {}
    if (cmd === 'potongvideo') { const r = parseRange(arg); if (!r) return usage(); Object.assign(opt, r) }
    if (cmd === 'kecepatan') { const f = parseFloat(String(arg).replace(',', '.').replace(/x$/i, '')); if (!Number.isFinite(f) || f < 0.25 || f > 4) return usage(); opt.factor = f }
    if (cmd === 'loopvid') { const n = args[0] ? parseInt(args[0]) : 2; if (!Number.isInteger(n) || n < 2 || n > 5) return reply(`Jumlah ulang 2–5. Contoh: ${U('loopvid 3')}`); opt.n = n }
    if (cmd === 'fitvid') { const p = presetOf(args[0]); if (!p || !['story', 'reel', 'reels', 'tiktok', 'status', 'short', 'shorts', 'feed', 'persegi', 'potret', 'yt', 'youtube'].includes(String(args[0]).toLowerCase())) return usage(); opt.W = p[0] / (p[0] > 1500 ? 1.5 : 1); opt.H = p[1] / (p[0] > 1500 ? 1.5 : 1); opt.crop = /^crop$/i.test(args[1] || '') }
    if (cmd === 'framevideo') { const t = args[0] ? parseTime(args[0]) : 0; if (Number.isNaN(t)) return usage(); opt.t = t }

    busy.add(who); lastUse.set(who, Date.now())
    const inp = tmpFile('mp4'), out = tmpFile(cmd === 'framevideo' ? 'jpg' : 'mp4')
    L.react(sock, m, '🕕')
    try {
      const buf = await L.download(media); if (!buf || !buf.length) throw new Error('Gagal mengunduh video')
      if (buf.length > MAX_VID) throw new Error(`Video terlalu besar (maks ${MAX_VID / 1048576} MB)`)
      fs.writeFileSync(inp, buf)
      const info = await probe(inp)
      if (!info.hasVideo) throw new Error('Berkas ini bukan video')
      if (info.duration && info.duration > MAX_SEC) throw new Error(`Video terlalu panjang (maks ${MAX_SEC} detik)`)
      opt.hasAudio = info.hasAudio
      if (cmd === 'mundur' && info.duration && info.duration > 30) throw new Error('Untuk .mundur maksimal 30 detik')
      if (cmd === 'potongvideo') { if (info.duration && opt.a >= info.duration) throw new Error(`Titik mulai (${opt.a}s) melewati durasi video (${info.duration.toFixed(1)}s)`); if (info.duration && opt.b != null && opt.b > info.duration) opt.b = info.duration }
      if (cmd === 'loopvid' && info.duration && info.duration * opt.n > MAX_SEC) throw new Error(`Hasil ${Math.round(info.duration * opt.n)} detik melebihi batas ${MAX_SEC} detik`)
      if (cmd === 'kecepatan' && info.duration && info.duration / opt.factor > MAX_SEC * 2) throw new Error('Hasil terlalu panjang')
      if (cmd === 'framevideo') {
        const t = info.duration ? Math.min(opt.t, Math.max(0, info.duration - 0.1)) : opt.t
        await ff(['-ss', String(t), '-i', inp, '-frames:v', '1', '-q:v', '2', out])
        L.react(sock, m, '✅')
        return sock.sendMessage(m.chat, { image: fs.readFileSync(out), caption: `🖼️ Frame detik ke-${t.toFixed(1)}` }, { quoted: m })
      }
      await ff(buildVideoArgs(cmd, inp, out, opt))
      const res = fs.readFileSync(out); if (!res.length) throw new Error('Hasil kosong')
      L.react(sock, m, '✅')
      const cap = { potongvideo: '✂️ Video dipotong', kecepatan: `⏩ Kecepatan ${opt.factor}x`, mundur: '⏪ Diputar mundur', bisu: '🔇 Suara dihapus', loopvid: `🔁 Diulang ${opt.n}x`, fitvid: '📐 Disesuaikan ke rasio platform' }[cmd]
      return sock.sendMessage(m.chat, { video: res, caption: cap, mimetype: 'video/mp4' }, { quoted: m })
    } catch (e) {
      console.log('[studioedit]', cmd, e.message); L.react(sock, m, '❌'); return reply('❌ Gagal memproses video: ' + e.message)
    } finally { rm(inp, out); busy.delete(who) }
  },
}

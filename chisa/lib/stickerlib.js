/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Helper stiker Chisa: unduh media, ubah ke WebP (ffmpeg), tempel EXIF packname/author, kirim.
// Dipakai plugin: .s  .brat  .smeme  .swm/.wm
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { execFile } = require('child_process')
const { downloadContentFromMessage } = require('./baileys')
const S = require('./settingsdb')
let sharp = null
try { sharp = require('sharp') } catch {}
const https = require('https')
const http = require('http')

let FFMPEG = 'ffmpeg'
try { FFMPEG = require('@ffmpeg-installer/ffmpeg').path } catch {}
const TMP = path.join(__dirname, '..', 'tmp')
const tmpFile = (ext) => { fs.mkdirSync(TMP, { recursive: true }); return path.join(TMP, `stk_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`) }
const rm = (...fs_) => { for (const f of fs_) try { fs.unlinkSync(f) } catch {} }

// ── media dari pesan (atau pesan yang di-reply) ──
// kembalikan { kind: 'image'|'video'|'sticker', node } atau null
function pickMedia(m) {
  const look = (node, mtype) => {
    if (!node || typeof node !== 'object') return null
    const mime = String(node.mimetype || '')
    if (mtype === 'stickerMessage' || mime === 'image/webp') return { kind: 'sticker', node }
    if (mtype === 'imageMessage' || mime.startsWith('image/')) return { kind: 'image', node }
    if (mtype === 'videoMessage' || mime.startsWith('video/')) return { kind: 'video', node }
    return null
  }
  const q = m.quoted && look(m.quoted, m.quoted.mtype || guessType(m.quoted))
  return q || look(m.msg, m.mtype)
}
function guessType(n) {
  if (n.mimetype === 'image/webp') return 'stickerMessage'
  if (String(n.mimetype || '').startsWith('image/')) return 'imageMessage'
  if (String(n.mimetype || '').startsWith('video/')) return 'videoMessage'
  return ''
}
async function download(media) {
  const stream = await downloadContentFromMessage(media.node, media.kind)
  const chunks = []
  for await (const c of stream) chunks.push(c)
  return Buffer.concat(chunks)
}

function ff(args) {
  return new Promise((res, rej) => execFile(FFMPEG, args, { maxBuffer: 1 << 26 }, (e, _o, se) => e ? rej(new Error(String(se || e.message).split('\n').slice(-4).join(' '))) : res()))
}

// ── opsi filter (.s --crop --resize WxH --circle --rounded) ──
function buildFilters(o = {}) {
  const f = []
  if (o.resize) {
    const [w, h] = o.resize.split('x').map(Number)
    f.push(`scale=${w}:${h}:force_original_aspect_ratio=decrease`, `pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=0x00000000`)
  }
  if (o.crop) f.push(`crop='min(iw,ih)':'min(iw,ih)'`)
  f.push('scale=512:512:force_original_aspect_ratio=decrease', 'pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000', 'setsar=1')
  if (o.circle) f.push('format=rgba', `geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(gt(pow(X-W/2,2)+pow(Y-H/2,2),pow(min(W,H)/2,2)),0,255)'`)
  if (o.rounded) {
    const r = 50
    f.push('format=rgba', `geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lt(X,${r})*lt(Y,${r})*gt(pow(${r}-X,2)+pow(${r}-Y,2),pow(${r},2)),0,if(gt(X,W-${r})*lt(Y,${r})*gt(pow(X-W+${r},2)+pow(${r}-Y,2),pow(${r},2)),0,if(lt(X,${r})*gt(Y,H-${r})*gt(pow(${r}-X,2)+pow(Y-H+${r},2),pow(${r},2)),0,if(gt(X,W-${r})*gt(Y,H-${r})*gt(pow(X-W+${r},2)+pow(Y-H+${r},2),pow(${r},2)),0,255))))'`)
  }
  return f
}

async function toWebp(buffer, { video = false, ...opts } = {}) {
  const inp = tmpFile(video ? 'mp4' : 'png'), out = tmpFile('webp')
  fs.writeFileSync(inp, buffer)
  try {
    const vf = (video ? ['fps=15'] : []).concat(buildFilters(opts)).join(',')
    const args = ['-y', '-i', inp, '-vcodec', 'libwebp', '-vf', vf, '-loop', '0', '-an', '-fps_mode', 'passthrough']
    if (video) args.push('-t', '10', '-preset', 'default', '-compression_level', '6', '-q:v', '50')
    else args.push('-quality', '80')
    await ff([...args, out])
    return fs.readFileSync(out)
  } finally { rm(inp, out) }
}



// ── Premium sticker effects (local-first, optional AI API) ──
const PREMIUM_STYLES = new Set(['gold', 'neon', 'anime', 'meme', 'glow'])
async function applyPremiumStyle(buffer, style) {
  if (!PREMIUM_STYLES.has(style)) throw new Error('Gaya premium tidak dikenal.')
  if (!sharp) throw new Error('Library sharp belum terpasang; jalankan npm install.')
  const base = sharp(buffer, { failOn: 'none' }).rotate()
  const meta = await base.metadata()
  const w = Math.max(1, Math.min(meta.width || 512, 1024)), h = Math.max(1, Math.min(meta.height || 512, 1024))
  const colors = {
    gold: ['#fff0a6', '#b87908', '#fff7cf'],
    neon: ['#00f5ff', '#b000ff', '#ff39d4'],
    anime: ['#ffb7df', '#9be7ff', '#ffffff'],
    meme: ['#ffffff', '#ffffff', '#ffe600'],
    glow: ['#ffffff', '#9c7bff', '#00e5ff'],
  }[style]
  const width = style === 'meme' ? 8 : 12
  const svg = Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${colors[0]}"/><stop offset="0.55" stop-color="${colors[1]}"/><stop offset="1" stop-color="${colors[2]}"/></linearGradient></defs><rect x="${width/2}" y="${width/2}" width="${Math.max(1,w-width)}" height="${Math.max(1,h-width)}" rx="${Math.min(w,h)*0.09}" fill="none" stroke="url(#g)" stroke-width="${width}"/></svg>`)
  let img = base.resize({ width: w, height: h, fit: 'inside', withoutEnlargement: true })
  if (style === 'gold') img = img.modulate({ saturation: 1.15 }).linear(1.06, 2)
  else if (style === 'neon' || style === 'glow') img = img.modulate({ saturation: 1.45, brightness: 1.04 }).sharpen()
  else if (style === 'anime') img = img.modulate({ saturation: 1.3, brightness: 1.06 }).sharpen({ sigma: 1.1 })
  else if (style === 'meme') img = img.modulate({ saturation: 1.1 }).sharpen()
  return img.png().composite([{ input: svg }]).png().toBuffer()
}

// Optional API adapter. Configure STICKER_AI_API_URL and STICKER_AI_API_KEY.
// Expected JSON response: { image: "<base64>" } or { imageUrl: "https://..." }.
async function applyAiStyle(buffer, style = 'anime') {
  const endpoint = process.env.STICKER_AI_API_URL
  if (!endpoint) throw new Error('API AI belum dikonfigurasi. Gunakan efek lokal: --gold, --neon, --anime, --meme, atau --glow.')
  const fetch = require('node-fetch')
  const headers = { 'content-type': 'application/json' }
  if (process.env.STICKER_AI_API_KEY) headers.authorization = `Bearer ${process.env.STICKER_AI_API_KEY}`
  const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify({ image: buffer.toString('base64'), style }) , timeout: 60000 })
  if (!response.ok) throw new Error(`API AI gagal (${response.status}).`)
  const data = await response.json()
  if (data.image) return Buffer.from(data.image, 'base64')
  if (data.imageUrl) {
    const r = await fetch(data.imageUrl, { timeout: 60000 })
    if (!r.ok) throw new Error('Gagal mengambil hasil gambar dari API AI.')
    return r.buffer()
  }
  throw new Error('Format respons API AI tidak dikenali; butuh field image atau imageUrl.')
}

// ── EXIF (packname & author) ──
function makeExif({ packname, author, emojis = ['🤖'] }) {
  const json = Buffer.from(JSON.stringify({
    'sticker-pack-id': 'com.chisa.sticker', 'sticker-pack-name': packname, 'sticker-pack-publisher': author,
    emojis, 'is-avatar-sticker': 0, 'android-app-store-link': '', 'ios-app-store-link': '',
  }), 'utf8')
  const head = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00])
  const exif = Buffer.concat([head, json]); exif.writeUIntLE(json.length, 14, 4)
  return exif
}
async function addExif(webp, meta) {
  let webpmux
  try { const mod = require('node-webpmux'); webpmux = mod.default || mod } catch { return webp }   // tanpa node-webpmux: kirim tanpa packname
  const img = new webpmux.Image()
  await img.load(webp)
  img.exif = makeExif(meta)
  return await img.save(null)
}

const defaults = () => ({ packname: S.get('botname') || 'Chisa AI', author: 'by Chisa AI' })

// ── kirim ──
async function sendWebp(sock, m, webp, meta = {}) {
  const buf = await addExif(webp, { ...defaults(), ...meta })
  return sock.sendMessage(m.chat, { sticker: buf }, { quoted: m })
}
async function sendImageAsSticker(sock, m, buffer, meta = {}, opts = {}) { return sendWebp(sock, m, await toWebp(buffer, opts), meta) }
async function sendVideoAsSticker(sock, m, buffer, meta = {}, opts = {}) { return sendWebp(sock, m, await toWebp(buffer, { ...opts, video: true }), meta) }
const react = (sock, m, text) => sock.sendMessage(m.chat, { react: { text, key: m.key } }).catch(() => {})

async function videoDuration(buffer) {
  const f = tmpFile('mp4'); fs.writeFileSync(f, buffer)
  try {
    return await new Promise((res) => execFile(FFMPEG, ['-i', f], (_e, _o, se) => {
      const x = /Duration:\s*(\d+):(\d+):(\d+\.\d+)/.exec(se || '')
      res(x ? (+x[1]) * 3600 + (+x[2]) * 60 + parseFloat(x[3]) : null)
    }))
  } finally { rm(f) }
}

module.exports = { pickMedia, download, toWebp, addExif, makeExif, sendWebp, sendImageAsSticker, sendVideoAsSticker, react, videoDuration, defaults, applyPremiumStyle, applyAiStyle, PREMIUM_STYLES }

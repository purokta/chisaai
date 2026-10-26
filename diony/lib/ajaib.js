/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Helper bersama fitur AJAIB: ambil media dari pesan/reply, unduh, ffmpeg, RNG berbiji, file sementara
const fs = require('fs'), path = require('path'), crypto = require('crypto')
const { execFile } = require('child_process')

let FFMPEG = 'ffmpeg'
try { FFMPEG = require('@ffmpeg-installer/ffmpeg').path } catch {}
const TMP = path.join(__dirname, '..', 'tmp')
const tmpFile = (ext) => { fs.mkdirSync(TMP, { recursive: true }); return path.join(TMP, `ajb_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`) }
const rm = (...a) => { for (const f of a) try { fs.unlinkSync(f) } catch {} }

// ── media: cari di pesan yang di-reply dulu, lalu di pesan itu sendiri ──
// kinds: subset dari ['image','audio','video','document']; hasil { kind, node, mime } atau null
function kindOf(node, mtype) {
  const mime = String(node.mimetype || '')
  if (mtype === 'documentMessage' || mtype === 'documentWithCaptionMessage') return 'document'
  if (mtype === 'audioMessage' || mime.startsWith('audio/')) return 'audio'
  if (mtype === 'videoMessage' || mime.startsWith('video/')) return 'video'
  if (mtype === 'imageMessage' || mime.startsWith('image/')) return mime === 'image/webp' ? 'sticker' : 'image'
  return null
}
function pickNode(m, kinds) {
  const tryNode = (node, mtype) => {
    if (mtype === 'documentWithCaptionMessage') { node = node && node.message && node.message.documentMessage; mtype = 'documentMessage' }
    if (!node || typeof node !== 'object' || !node.mimetype) return null
    const kind = kindOf(node, mtype); if (!kind || !kinds.includes(kind)) return null
    return { kind, node, mime: String(node.mimetype) }
  }
  // tipe ASLI pesan yang di-reply dibaca dari contextInfo (m.quoted hanya berisi isi dalamnya).
  // Penting: dokumen dan gambar memakai kunci dekripsi media yang berbeda.
  const qm = m.msg && m.msg.contextInfo && m.msg.contextInfo.quotedMessage
  if (qm) {
    const qt = Object.keys(qm).find(k => k !== 'messageContextInfo' && k !== 'senderKeyDistributionMessage')
    const r = qt && tryNode(qm[qt], qt); if (r) return r
  }
  return tryNode(m.msg, m.mtype)
}
async function download(media) {
  const { downloadContentFromMessage } = require('./baileys')
  const stream = await downloadContentFromMessage(media.node, media.kind === 'sticker' ? 'sticker' : media.kind)
  const chunks = []; for await (const c of stream) chunks.push(c)
  return Buffer.concat(chunks)
}

// ── ffmpeg ──
const ff = (args, timeout = 120000) => new Promise((res, rej) => execFile(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', ...args], { maxBuffer: 1 << 26, timeout }, (e, _o, se) => e ? rej(new Error(String(se || e.message).split('\n').slice(-3).join(' ').trim())) : res()))
// buffer masuk -> buffer keluar. ext = ekstensi masuk, out = ekstensi keluar
async function runFF(buf, inExt, outExt, args, pre = []) {
  const a = tmpFile(inExt), b = tmpFile(outExt)
  try { fs.writeFileSync(a, buf); await ff([...pre, '-i', a, ...args, b]); return fs.readFileSync(b) } finally { rm(a, b) }
}

// ── RNG berbiji: teks yang sama selalu menghasilkan urutan yang sama ──
function hash32(str) { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19) } return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return (h ^= h >>> 16) >>> 0 } }
function rng(seedStr) { const s = hash32(String(seedStr)); let a = s(), b = s(), c = s(), d = s(); return () => { a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; let t = (a + b) | 0; a = b ^ (b >>> 9); b = (c + (c << 3)) | 0; c = (c << 21) | (c >>> 11); d = (d + 1) | 0; t = (t + d) | 0; c = (c + t) | 0; return (t >>> 0) / 4294967296 } }

// ── penyimpanan JSON kecil dengan tulis tertunda ──
function store(file, fallback) {
  const f = path.join(global.dionyData, file); let db = fallback, t = null
  try { db = JSON.parse(fs.readFileSync(f, 'utf8')) } catch {}
  const flush = () => { try { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(db)) } catch (e) { console.log('[ajaib store]', e.message) } }
  process.on('exit', flush)
  return { get: () => db, set: (v) => { db = v; return db }, save: () => { if (t) return; t = setTimeout(() => { t = null; flush() }, 1500) }, flush }
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
module.exports = { FFMPEG, tmpFile, rm, pickNode, download, ff, runFF, hash32, rng, store, esc }

/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Mesin stiker BRAT Dionysus: render teks jadi gambar/video (lokal, pakai sharp + ffmpeg),
// ambil dari API (varian karakter), lalu kirim sebagai stiker lewat stickerlib.
// Dipakai plugin: .brat .bratimg .bratgreen .bratwhite .brathd .bratvid .bratvid2
//                 .bratanime .bratcewek .bratbahlil .bratpatrick .bratsquidward
//                 .bratgojo .bratgojovid .bratvermeil .bratvermeilvid
const fs = require('fs')
const path = require('path')
const os = require('os')
const axios = require('axios')
const sharp = require('./sharp.js')
const { execFile } = require('child_process')
const L = require('./stickerlib')

let FFMPEG = 'ffmpeg'
try { FFMPEG = require('@ffmpeg-installer/ffmpeg').path } catch {}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

// ── sumber eksternal (ubah di sini bila endpoint pindah) ──
const SRC = {
  anime: 'https://api.nexray.web.id/maker/bratanime',
  cewek: 'https://api.deline.web.id/maker/cewekbrat',
  char: 'https://api.haidar.my.id/api/',                    // + bratbahlil | bratpatrick | bratsquidward
  tpl: {
    gojo: { url: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Brat/Gojo.jpeg', zone: { a: 660, b: 1180, c: 270, d: 990 } },
    vermeil: { url: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Brat/Vermile.jpg', zone: { a: 655, b: 1118, c: 282, d: 993 } },
  },
}

// ── daftar varian (dipakai menu .brat) ──
const VARIANTS = [
  ['Brat Obsidian', 'Plakat gotik hitam, teks perak bercahaya', 'bratimg'],
  ['Brat Emerald', 'Hijau zamrud dengan teks emas', 'bratgreen'],
  ['Brat Ivory', 'Perkamen krem, tinta hitam', 'bratwhite'],
  ['Brat HD', 'Obsidian resolusi tinggi', 'brathd'],
  ['Brat Anime', 'Gaya anime', 'bratanime'],
  ['Brat Cewek', 'Gaya cewek', 'bratcewek'],
  ['Brat Bahlil', 'Gaya Bahlil', 'bratbahlil'],
  ['Brat Patrick', 'Gaya Patrick', 'bratpatrick'],
  ['Brat Squidward', 'Gaya Squidward', 'bratsquidward'],
  ['Brat Gojo', 'Gaya Gojo', 'bratgojo'],
  ['Brat Vermeil', 'Gaya Vermeil', 'bratvermeil'],
  ['Brat Video', 'Obsidian bergerak, kata muncul satu per satu', 'bratvid'],
  ['Brat Video V2', 'Emerald bergerak', 'bratvid2'],
  ['Brat Gojo Video', 'Gojo bergerak', 'bratgojovid'],
  ['Brat Vermeil Video', 'Vermeil bergerak', 'bratvermeilvid'],
  ['Brat Warna', 'Plakat warna bebas: pink, ungu, hex, dll', 'bratwarna'],
  ['Brat Warna Video', 'Warna bebas, bergerak (lokal)', 'bratwarnavid'],
]

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const clean = (t) => String(t || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()

// ── 1) render lokal ──
// teks diskalakan otomatis sampai pas di kotak (w x h), lalu dilebur sedikit seperti gaya brat
async function textLayer(text, w, h, { color = '#000000', font = 'Arial Narrow, Liberation Sans Narrow, Sans', align = 'left', justify = false, blur = 0 } = {}) {
  let img = sharp({ text: { text: `<span foreground="${color}">${esc(text)}</span>`, font, width: w, height: h, align, justify, rgba: true } })
  let buf = await img.png().toBuffer()
  if (blur > 0) buf = await sharp(buf).blur(blur).png().toBuffer()
  return buf
}

// gaya Dionysus (lib/bratstyle.js): plakat gotik, bukan hijau-blur brat bawaan
const ST = require('./bratstyle')
const renderBrat = (text, { bg, theme = 'obsidian', size = 512 } = {}) => ST.render(text, bg ? { bg } : theme, size)

const tplCache = new Map()
async function getTemplate(key) {
  if (tplCache.has(key)) return tplCache.get(key)
  const r = await axios.get(SRC.tpl[key].url, { responseType: 'arraybuffer', timeout: 25000, headers: { 'User-Agent': UA } })
  const buf = await sharp(Buffer.from(r.data)).resize(1254, 1254, { fit: 'fill' }).png().toBuffer()
  tplCache.set(key, buf); return buf
}
async function renderTemplate(text, key, tplBuf) {
  const z = SRC.tpl[key].zone, w = z.d - z.c, h = z.b - z.a
  const base = tplBuf || await getTemplate(key)
  const layer = await textLayer(clean(text), w, h, { color: '#111111', font: 'Poppins, Sans', align: 'centre' })
  const { width: lw, height: lh } = await sharp(layer).metadata()
  return sharp(base).composite([{ input: layer, left: z.c + Math.round((w - lw) / 2), top: z.a + Math.round((h - lh) / 2) }]).resize(512, 512).png().toBuffer()
}

// ── 2) video: kata muncul satu per satu ──
function revealFrames(text, perLayer = 5, maxWords = 40) {
  const words = clean(text).replace(/[,，]/g, ' ').split(/\s+/).filter(Boolean).slice(0, maxWords)
  const frames = []
  for (let i = 0; i < words.length; i += perLayer) {
    const layer = words.slice(i, i + perLayer)
    layer.forEach((_, k) => frames.push({ text: layer.slice(0, k + 1).join(' '), dur: k === layer.length - 1 ? 1.5 : 0.7 }))
  }
  return frames
}
const sh = (args) => new Promise((res, rej) => execFile(FFMPEG, args, { maxBuffer: 1 << 26 }, (e, _o, se) => e ? rej(new Error(String(se || e.message).split('\n').slice(-3).join(' '))) : res()))

async function renderVideo(text, drawFrame) {
  const frames = revealFrames(text)
  if (!frames.length) throw new Error('Teks kosong')
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bratvid-'))
  try {
    const files = frames.map((_, i) => path.join(dir, `f${String(i).padStart(3, '0')}.png`))
    for (let s = 0; s < frames.length; s += 5) {
      await Promise.all(frames.slice(s, s + 5).map(async (f, i) => fs.writeFileSync(files[s + i], await drawFrame(f.text))))
    }
    const list = frames.map((f, i) => `file '${files[i].replace(/'/g, "'\\''")}'\nduration ${f.dur}`).join('\n') + `\nfile '${files[files.length - 1].replace(/'/g, "'\\''")}'`
    fs.writeFileSync(path.join(dir, 'list.txt'), list)
    const out = path.join(dir, 'out.mp4')
    await sh(['-y', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'list.txt'), '-vf', 'fps=15,scale=512:512:flags=lanczos', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '32', '-pix_fmt', 'yuv420p', out])
    return fs.readFileSync(out)
  } finally { fs.rmSync(dir, { recursive: true, force: true }) }
}

// ── 3) ambil gambar dari API ──
async function fetchImage(url, params) {
  const res = await axios.get(url, { params, responseType: 'arraybuffer', timeout: 25000, headers: { 'User-Agent': UA }, validateStatus: () => true })
  const buf = Buffer.from(res.data), ct = String(res.headers['content-type'] || '')
  const head = buf.toString('utf8', 0, Math.min(80, buf.length)).trim()
  const json = ct.includes('application/json') || (buf.length < 3000 && (head.startsWith('{') || head.startsWith('[')))
  if (res.status < 200 || res.status >= 300 || json) {
    let why = `HTTP ${res.status}`
    if (json) { try { const p = JSON.parse(buf.toString('utf8')); why = p.message || p.msg || p.error || why } catch {} }
    throw new Error(`API brat tidak membalas gambar (${why})`)
  }
  if (buf.length < 100) throw new Error('API brat mengembalikan data kosong')
  return buf
}

// ── 4) pembuat tiap varian: kembalikan { video, buffer } ──
const MAKERS = {
  bratimg: async (t) => ({ buffer: await renderBrat(t, { theme: 'obsidian' }) }),
  bratgreen: async (t) => ({ buffer: await renderBrat(t, { theme: 'emerald' }) }),
  bratwhite: async (t) => ({ buffer: await renderBrat(t, { theme: 'ivory' }) }),
  brathd: async (t) => ({ buffer: await renderBrat(t, { theme: 'obsidian', size: 1024 }) }),
  bratanime: async (t) => ({ buffer: await fetchImage(SRC.anime, { text: t }) }),
  bratcewek: async (t) => ({ buffer: await fetchImage(SRC.cewek, { text: t }) }),
  bratbahlil: async (t) => ({ buffer: await fetchImage(SRC.char + 'bratbahlil', { text: t }) }),
  bratpatrick: async (t) => ({ buffer: await fetchImage(SRC.char + 'bratpatrick', { text: t }) }),
  bratsquidward: async (t) => ({ buffer: await fetchImage(SRC.char + 'bratsquidward', { text: t }) }),
  bratgojo: async (t) => ({ buffer: await renderTemplate(t, 'gojo') }),
  bratvermeil: async (t) => ({ buffer: await renderTemplate(t, 'vermeil') }),
  bratvid: async (t) => ({ video: true, buffer: await renderVideo(t, (x) => renderBrat(x)) }),
  bratvid2: async (t) => ({ video: true, buffer: await renderVideo(t, (x) => renderBrat(x, { theme: 'emerald' })) }),
  bratgojovid: async (t) => { const b = await getTemplate('gojo'); return { video: true, buffer: await renderVideo(t, (x) => renderTemplate(x, 'gojo', b)) } },
  bratvermeilvid: async (t) => { const b = await getTemplate('vermeil'); return { video: true, buffer: await renderVideo(t, (x) => renderTemplate(x, 'vermeil', b)) } },
}

// ── 5) pembuat plugin: satu panggilan = satu perintah .brat... ──
function makePlugin(cmd, { alias = [], title, desc }) {
  return {
    name: cmd, alias, category: 'sticker', desc,
    run: async ({ sock, m, text, prefix, reply }) => {
      const t = clean(text || (m.quoted && m.quoted.text) || '')
      if (!t) return reply(`🖼️ *${title}*\n\n> Masukkan teks, atau reply sebuah pesan teks.\n\n*Contoh:* ${prefix}${cmd} Hai semua`)
      L.react(sock, m, '🕕')
      try {
        const r = await MAKERS[cmd](t)
        await (r.video ? L.sendVideoAsSticker(sock, m, r.buffer) : L.sendImageAsSticker(sock, m, r.buffer))
        L.react(sock, m, '✅')
      } catch (e) {
        console.log(`[${cmd}]`, e.message); L.react(sock, m, '❌')
        reply(`❌ *Gagal membuat stiker*\n\n> ${e.message}\n> Coba lagi sebentar lagi, atau pakai varian lain (${prefix}brat).`)
      }
    },
  }
}

module.exports = { VARIANTS, MAKERS, makePlugin, renderBrat, renderTemplate, renderVideo, revealFrames }

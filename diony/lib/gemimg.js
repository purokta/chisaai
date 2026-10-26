/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// GEMINI IMAGE — buat gambar dari teks & edit gambar (foto + instruksi) lewat Gemini ("Nano Banana").
// Dipakai .toanime, .tochibi, .gimg dan niat gambar di .ai (plugins/kreasi/aigambar.js).
//   • API key: global.apikey.gemini / google (boleh array → dirotasi otomatis saat kena limit)
//   • Model: global.aiModels.geminiImage bila diisi; kalau kosong dipilih otomatis dari daftar model API
//     (nama berisi "image", mendukung generateContent) sehingga tahan perubahan nama model.
//   • Error dilempar dengan e.code: nokey | quota | blocked | noimage | auth | fail  (+ e.details untuk owner)
const axios = require('axios')
const ai = require('./ai')

const BASE = 'https://generativelanguage.googleapis.com/v1beta'
const TIMEOUT = 120000, MAX_SIDE = 1536
const FALLBACK = [
  'gemini-2.5-flash-image',
  'gemini-2.5-flash-image-preview',
  'gemini-2.0-flash-preview-image-generation',
  'gemini-2.0-flash-exp-image-generation',
]
const ASPECT = { square: '1:1', wide: '16:9', tall: '9:16' }

const arr = (v) => (Array.isArray(v) ? v : [v]).filter(k => typeof k === 'string' && k.trim() && !/^ISI_/i.test(k.trim())).map(k => k.trim())
const keys = () => [...new Set([...arr(global.apikey && global.apikey.gemini), ...arr(global.apikey && global.apikey.google)])]
const errText = (e) => {
  const st = e.response && e.response.status, d = e.response && e.response.data
  const msg = (d && d.error && d.error.message) || (d && d.message) || e.message
  return `${st ? st + ' ' : ''}${String(msg).slice(0, 160)}`
}
const mkErr = (code, message, details) => { const e = new Error(message); e.code = code; if (details) e.details = details; return e }

// ── pilih model gambar ──
const cache = new Map()
function rank(list) {
  const rows = []
  for (const m of list || []) {
    const name = String(m.name || '').replace('models/', '')
    if (!/^gemini-/.test(name) || !/image/i.test(name) || /(imagen|veo|embed|tts|live|audio)/i.test(name)) continue
    if (!(m.supportedGenerationMethods || []).includes('generateContent')) continue
    const v = name.match(/^gemini-(\d+(?:\.\d+)?)/)
    rows.push({ name, ver: v ? parseFloat(v[1]) : 0, pro: /pro/.test(name) ? 1 : 0, pre: /(preview|exp)/.test(name) ? 1 : 0 })
  }
  // flash dulu (lebih murah & punya jatah gratis), stabil sebelum preview, versi terbaru dulu
  return rows.sort((a, b) => a.pro - b.pro || a.pre - b.pre || b.ver - a.ver).map(r => r.name).slice(0, 3)
}
async function models(key) {
  const cfg = global.aiModels && global.aiModels.geminiImage
  if (cfg && ai.modelOf(cfg, '')) return [cfg]
  const c = cache.get(key); if (c && Date.now() - c.at < 6 * 3600 * 1000) return c.list
  let list = []
  try {
    const r = await axios.get(`${BASE}/models?pageSize=200`, { headers: { 'x-goog-api-key': key }, timeout: 15000 })
    list = rank(r.data && r.data.models)
  } catch {}
  if (!list.length) list = FALLBACK
  cache.set(key, { at: Date.now(), list }); return list
}

// ── siapkan gambar masukan: putar sesuai EXIF, perkecil, JPEG ──
async function prep(buf, mime) {
  try {
    const sharp = require('./sharp.js')
    const out = await sharp(buf).rotate().resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer()
    return { data: out, mime: 'image/jpeg' }
  } catch { return { data: buf, mime: /^image\//.test(mime || '') ? mime : 'image/jpeg' } }
}

function parse(d) {
  const block = d && d.promptFeedback && d.promptFeedback.blockReason
  const cand = d && d.candidates && d.candidates[0]
  const parts = (cand && cand.content && cand.content.parts) || []
  let img = null, text = ''
  for (const p of parts) {
    const inl = p.inlineData || p.inline_data
    if (inl && inl.data && !img) img = { buffer: Buffer.from(inl.data, 'base64'), mime: inl.mimeType || inl.mime_type || 'image/png' }
    else if (p.text) text += p.text
  }
  return { img, text: text.trim(), block, finish: cand && cand.finishReason }
}

// satu permintaan ke satu model
async function call(key, model, parts, aspect) {
  const gen = { responseModalities: ['TEXT', 'IMAGE'], temperature: 1 }
  const body = (withAspect) => ({ contents: [{ role: 'user', parts }], generationConfig: withAspect ? { ...gen, imageConfig: { aspectRatio: aspect } } : gen })
  const url = `${BASE}/models/${model}:generateContent`, h = { headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' }, timeout: TIMEOUT, maxBodyLength: Infinity }
  try { return (await axios.post(url, body(!!aspect), h)).data }
  catch (e) {
    // model lama menolak imageConfig → ulangi tanpa itu (rasio cukup lewat teks prompt)
    if (aspect && e.response && e.response.status === 400) return (await axios.post(url, body(false), h)).data
    throw e
  }
}

// opts: { prompt, images:[{buffer,mime}], aspect:'square'|'wide'|'tall' }  → { buffer, mime, text, model }
async function run({ prompt, images = [], aspect }) {
  const ks = keys(); if (!ks.length) throw mkErr('nokey', 'Belum ada API key Gemini di config.js (apikey.gemini / google).')
  const ratio = ASPECT[aspect]
  const text = ratio && !images.length ? `${prompt}\n\n(Aspect ratio ${ratio}.)` : prompt
  const parts = []
  for (const im of images) { const p = await prep(im.buffer, im.mime); parts.push({ inlineData: { mimeType: p.mime, data: p.data.toString('base64') } }) }
  parts.push({ text })
  const errs = []; let sawQuota = false, sawBlock = null, sawText = ''
  for (const key of ks) {
    let authFail = false
    for (const model of await models(key)) {
      try {
        const out = parse(await call(key, model, parts, ratio && !images.length ? ratio : null))
        if (out.img) return { buffer: out.img.buffer, mime: out.img.mime, text: out.text, model }
        if (out.block || /SAFETY|PROHIBITED|BLOCK|RECITATION/i.test(out.finish || '')) sawBlock = out.block || out.finish
        if (out.text) sawText = out.text
        errs.push(`${model}: tanpa gambar${out.block ? ' (' + out.block + ')' : out.finish ? ' (' + out.finish + ')' : ''}`)
      } catch (e) {
        const st = e.response && e.response.status
        errs.push(`${model}: ${errText(e)}`)
        if (st === 429) { sawQuota = true; break }              // jatah key ini habis → key berikutnya
        if (st === 401 || st === 403) { authFail = true; break }
        cache.delete(key)                                        // 400/404/5xx → coba model berikutnya
      }
    }
    if (authFail) continue
  }
  if (sawBlock) throw mkErr('blocked', 'Gemini menolak permintaan ini karena kebijakan keamanannya. Coba foto / deskripsi yang berbeda.', errs)
  if (sawText) throw mkErr('noimage', `Gemini membalas teks tanpa gambar:\n${sawText.slice(0, 300)}`, errs)
  if (sawQuota) throw mkErr('quota', 'Jatah Gemini (gambar) sedang habis. Coba lagi beberapa saat, atau owner perlu mengaktifkan penagihan / menambah API key.', errs)
  throw mkErr('fail', 'Gemini gagal membuat gambar. Coba lagi sebentar.', errs)
}

const generate = (o) => run({ prompt: o.prompt, aspect: o.aspect })
const edit = (o) => run({ prompt: o.prompt, images: [{ buffer: o.image, mime: o.mime }] })

module.exports = { run, generate, edit, rank, parse, keys, ASPECT }

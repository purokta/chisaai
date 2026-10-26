/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Mesin DIONYSUS MUSIK: daftar lagu dari folder Google Drive, gambar thumbnail (di-embed base64), dan unduh lagu.
// Folder Drive HARUS dibagikan "Siapa saja yang memiliki link" (Anyone with the link).
const fs = require('fs')
const path = require('path')
const axios = require('axios')

const FOLDER_ID = '124tvFzGBgAmcZ0KxVyl2-T_2As3WRQ4X'
const IMG = {
  thumb: 'https://i.ibb.co.com/k6rtzVL9/Proyek-Baru-65-F00-DEE2.png', // thumbnail musik + thumbnail fitur
  bg: 'https://i.ibb.co.com/whrprzJQ/Proyek-Baru-66-F2-FA53-D.png',   // background kartu
}
const UA = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36'
const DB = path.join(global.dionyData, 'musik.json')      // { tracks:[...cache scan], manual:[...tambahan owner] }
const MEDIA = path.join(__dirname, 'media')
const TTL = 10 * 60 * 1000
const AUDIO_EXT = /\.(mp3|m4a|wav|ogg|opus|aac|flac|wma)$/i

const readDb = () => { try { return JSON.parse(fs.readFileSync(DB, 'utf8')) } catch { return { tracks: [], manual: [] } } }
const writeDb = (d) => { try { fs.mkdirSync(path.dirname(DB), { recursive: true }); fs.writeFileSync(DB, JSON.stringify(d, null, 2)) } catch (e) { console.log('[musik] gagal simpan db:', e.message) } }

const decode = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).trim()

// buang watermark situs unduhan & sampah penamaan: "spotdown.org", "(Official Video)", "[320kbps]", dst.
const JUNK = [
  /\b[\w-]+\.(?:org|com|net|co|id|io|me|cc|xyz|app|to|ru)\b/gi,            // spotdown.org, y2mate.com, dst.
  /[\(\[\{]\s*(?:official|lyrics?|lirik|video|audio|music|mv|hd|hq|4k|remix video|visuali[sz]er|download|free)[^\)\]\}]*[\)\]\}]/gi,
  /[\(\[]\s*\d{2,3}\s*kbps\s*[\)\]]/gi,
  /\b(?:official\s+(?:music\s+)?(?:video|audio)|lyric\s+video|free\s+download|full\s+song)\b/gi,
]
const cleanName = (x) => {
  let t = String(x || '')
  for (const re of JUNK) t = t.replace(re, ' ')
  return t.replace(/[_]+/g, ' ').replace(/\s*[-–—|•·]\s*$/g, '').replace(/^\s*[-–—|•·]\s*/g, '').replace(/\s{2,}/g, ' ').trim()
}
// "Artis - Judul.mp3" -> { title, artist }
function parseName(file) {
  const base = cleanName(decode(file).replace(AUDIO_EXT, '')) || 'Tanpa judul'
  const i = base.indexOf(' - ')
  if (i > 0) return { artist: base.slice(0, i).trim(), title: base.slice(i + 3).trim() || base }
  return { artist: 'Chisa AI Musik', title: base || 'Tanpa judul' }
}
const mk = (id, file) => ({ id, file: decode(file), ...parseName(file) })

// id Drive dari tautan/ID mentah
function driveId(s) {
  const t = String(s || '')
  return (t.match(/\/d\/([\w-]{15,})/) || t.match(/[?&]id=([\w-]{15,})/) || t.match(/^([\w-]{25,})$/) || [])[1] || null
}

// scan folder publik Drive tanpa API key
async function scanFolder() {
  const r = await axios.get(`https://drive.google.com/embeddedfolderview?id=${FOLDER_ID}`, { timeout: 30000, headers: { 'User-Agent': UA, 'Accept-Language': 'id,en;q=0.8' } })
  const html = String(r.data || ''), out = [], seen = new Set()
  const re = /<div class="flip-entry"[^>]*id="entry-([\w-]+)"[\s\S]*?<div class="flip-entry-title">([^<]*)<\/div>/g
  let x
  while ((x = re.exec(html))) { if (!seen.has(x[1])) { seen.add(x[1]); out.push(mk(x[1], x[2])) } }
  if (!out.length) { // cadangan: pola lain
    const re2 = /\/file\/d\/([\w-]{15,})\/view[^>]*>[\s\S]{0,400}?<div[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)</g
    while ((x = re2.exec(html))) { if (!seen.has(x[1])) { seen.add(x[1]); out.push(mk(x[1], x[2])) } }
  }
  if (!out.length) { // cadangan 2: halaman folder biasa (data file ada di JSON tertanam)
    try {
      const r2 = await axios.get(`https://drive.google.com/drive/folders/${FOLDER_ID}?hl=id`, { timeout: 30000, headers: { 'User-Agent': UA, 'Accept-Language': 'id,en;q=0.8' } })
      const h2 = String(r2.data || '').replace(/\\x22/g, '"').replace(/\\\//g, '/')
      const re3 = /\["([\w-]{25,})",\["[\w-]+"\],"([^"]+?)","(?:audio\/[^"]*|application\/octet-stream)"/g
      while ((x = re3.exec(h2))) { if (!seen.has(x[1])) { seen.add(x[1]); out.push(mk(x[1], x[2].replace(/\\u([0-9a-f]{4})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))))) } }
    } catch (e) { console.log('[musik] scan cadangan gagal:', e.message) }
  }
  return out.filter(t => AUDIO_EXT.test(t.file) || !/\.[a-z0-9]{2,4}$/i.test(t.file)).sort((a, b) => a.file.localeCompare(b.file, 'id', { numeric: true }))
}

let memo = { at: 0, list: null }
async function getTracks(force) {
  if (!force && memo.list && Date.now() - memo.at < TTL) return memo.list
  const db = readDb()
  let scanned = db.tracks || []
  try { const s = await scanFolder(); if (s.length) { scanned = s; db.tracks = s; writeDb(db) } else console.log('[musik] scan folder kosong (pastikan folder publik)') }
  catch (e) { console.log('[musik] scan gagal, pakai cache:', e.message) }
  const ids = new Set(scanned.map(t => t.id))
  const list = scanned.concat((db.manual || []).filter(t => !ids.has(t.id)))
  memo = { at: Date.now(), list }
  return list
}

function addManual(link, nameRaw) {
  const id = driveId(link); if (!id) return null
  const db = readDb(); db.manual = db.manual || []
  const t = mk(id, nameRaw || 'Tanpa judul')
  db.manual = db.manual.filter(x => x.id !== id).concat(t); writeDb(db); memo.at = 0
  return t
}
function removeManual(id) { const db = readDb(), n = (db.manual || []).length; db.manual = (db.manual || []).filter(x => x.id !== id); writeDb(db); memo.at = 0; return n !== db.manual.length }

// cari lagu: nomor (1-based) atau potongan judul/artis
function find(list, q) {
  const s = String(q || '').trim().toLowerCase(); if (!s) return null
  if (/^\d+$/.test(s)) return list[+s - 1] || null
  return list.find(t => `${t.artist} ${t.title}`.toLowerCase().includes(s)) || null
}

// ── gambar: unduh sekali, kecilkan, simpan ke lib/media, lalu embed sebagai data URI (kartu WA tanpa jaringan) ──
// Anti gagal: coba beberapa host (i.ibb.co.com <-> i.ibb.co), lalu cadangan file lokal (lib/media/thumb.jpg),
// dan kalau tetap gagal jangan mencoba lagi selama 5 menit supaya perintah tidak menunggu timeout berulang.
const imgCache = {}, imgFail = {}
const IMG_RETRY = 5 * 60 * 1000
const urlVariants = (u) => {
  const out = [u]
  if (/\/\/i\.ibb\.co\.com\//.test(u)) out.push(u.replace('//i.ibb.co.com/', '//i.ibb.co/'))
  else if (/\/\/i\.ibb\.co\//.test(u)) out.push(u.replace('//i.ibb.co/', '//i.ibb.co.com/'))
  return out
}
async function fetchImage(url) {
  let last
  for (const u of urlVariants(url)) {
    try { return Buffer.from((await axios.get(u, { responseType: 'arraybuffer', timeout: 15000, headers: { 'User-Agent': UA } })).data) }
    catch (e) { last = e }
  }
  throw last
}
async function getImage(kind) {
  if (imgCache[kind]) return imgCache[kind]
  if (imgFail[kind] && Date.now() - imgFail[kind] < IMG_RETRY) return null
  let sharp; try { sharp = require('sharp') } catch (e) { console.log('[musik] sharp tidak tersedia:', e.message); imgFail[kind] = Date.now(); return null }
  const px = kind === 'thumb' ? 128 : 420
  const shrink = (b) => sharp(b).resize(px, px, { fit: kind === 'thumb' ? 'cover' : 'inside', withoutEnlargement: true }).jpeg({ quality: kind === 'thumb' ? 72 : 55 }).toBuffer()
  const file = path.join(MEDIA, `musik_${kind}.jpg`)
  let buf = null
  try { buf = fs.readFileSync(file) } catch {}
  if (!buf) {
    try {
      buf = await shrink(await fetchImage(IMG[kind]))
      fs.mkdirSync(MEDIA, { recursive: true }); fs.writeFileSync(file, buf)
    } catch (e) {
      console.log(`[musik] gambar ${kind} gagal: ${e.message}`)
      // cadangan lokal: thumb -> lib/media/thumb.jpg (bg tidak punya cadangan, kartu memakai gradasi bawaan)
      if (kind === 'thumb') { try { buf = await shrink(fs.readFileSync(path.join(MEDIA, 'thumb.jpg'))) } catch {} }
      if (!buf) { imgFail[kind] = Date.now(); return null }
    }
  }
  return (imgCache[kind] = { buf, uri: 'data:image/jpeg;base64,' + buf.toString('base64') })
}

// ── unduh lagu dari Drive ke file ──
// Drive kadang membalas halaman HTML "tidak bisa scan virus" untuk file besar: formnya berisi uuid/confirm yang harus dikirim ulang.
function confirmUrl(html, id) {
  const form = String(html).match(/<form[^>]+action="([^"]+)"[^>]*>([\s\S]*?)<\/form>/i)
  if (form) {
    const q = new URLSearchParams()
    for (const m of form[2].matchAll(/<input[^>]+name="([^"]+)"[^>]*value="([^"]*)"/gi)) q.set(m[1], decode(m[2]))
    if (q.has('id')) return decode(form[1]) + '?' + q.toString()
  }
  const uuid = (String(html).match(/uuid=([\w-]+)/) || [])[1]
  return uuid ? `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t&uuid=${uuid}` : null
}
async function openStream(u) {
  return axios.get(u, { responseType: 'stream', timeout: 120000, maxRedirects: 8, headers: { 'User-Agent': UA }, validateStatus: s => s < 500 })
}
async function download(id, dir, nameHint) {
  const urls = [`https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`, `https://drive.google.com/uc?export=download&confirm=t&id=${id}`]
  let last
  for (const u0 of urls) {
    try {
      let res = await openStream(u0)
      let type = String(res.headers['content-type'] || '')
      if (/text\/html/i.test(type)) {   // coba lewati halaman konfirmasi sekali
        const html = await new Promise((ok, no) => { let b = ''; res.data.on('data', c => { b += c; if (b.length > 300000) res.data.destroy() }); res.data.on('end', () => ok(b)); res.data.on('close', () => ok(b)); res.data.on('error', no) })
        const next = confirmUrl(html, id)
        if (!next) throw new Error('Drive menolak (file belum publik atau kuota unduh habis)')
        res = await openStream(next); type = String(res.headers['content-type'] || '')
        if (/text\/html/i.test(type)) { res.data.destroy(); throw new Error('Drive menolak (file belum publik atau kuota unduh habis)') }
      }
      if (res.status >= 400) { res.data.destroy(); throw new Error('Drive membalas ' + res.status) }
      const cd = String(res.headers['content-disposition'] || '')
      let ext = (cd.match(/filename\*?=(?:UTF-8'')?"?([^";]+)/i) || [])[1]; ext = ext ? path.extname(decodeURIComponent(ext)) : ''
      if (!ext) ext = /mpeg|mp3/.test(type) ? '.mp3' : /mp4|m4a|aac/.test(type) ? '.m4a' : /ogg/.test(type) ? '.ogg' : /wav/.test(type) ? '.wav' : '.mp3'
      const safe = String(nameHint || id).replace(/[\\/:*?"<>|]+/g, ' ').slice(0, 80).trim() || id
      const dest = path.join(dir, safe + ext.toLowerCase())
      let got = 0
      await new Promise((ok, no) => {
        const w = fs.createWriteStream(dest)
        res.data.on('data', c => { got += c.length; if (got > 60 * 1048576) res.data.destroy(new Error('file lebih dari 60 MB')) })
        res.data.on('error', no); w.on('error', no); w.on('finish', ok); res.data.pipe(w)
      })
      if (got < 2048) throw new Error('berkas kosong')
      return dest
    } catch (e) { last = e }
  }
  throw last || new Error('gagal mengunduh dari Drive')
}

// ── audio untuk diputar LANGSUNG di dalam kartu: ubah ke mp3 mono kecil lalu embed sebagai data URI ──
// Kartu WA tidak punya akses jaringan, jadi lagu harus ditanam di HTML. Total ukuran dibatasi (BUDGET) agar pesan tetap terkirim.
const { execFile } = require('child_process')
const AUDIO_DIR = path.join(MEDIA, 'musik')
const BUDGET = Math.max(300, Number(process.env.MUSIK_BUDGET_KB) || 420) * 1024   // total audio per kartu (byte, sebelum base64)
const KBPS = Math.max(16, Number(process.env.MUSIK_KBPS) || 24)                      // bitrate mp3 mono
const CLIP = Math.max(8, Number(process.env.MUSIK_CLIP_SEC) || 20)                   // lama preview per lagu (detik); diambil dari bagian tengah lagu
const ffmpeg = () => { try { return require('./ytdlp').ffmpegPath() } catch { return 'ffmpeg' } }
const safeId = (id) => String(id).replace(/[^\w-]/g, '')
const cachePath = (id) => path.join(AUDIO_DIR, 'v2_' + safeId(id) + '.mp3')   // v2 = klip preview (cache lama lagu penuh diabaikan)
const inflight = new Map()

const run = (bin, a, o) => new Promise((ok, no) => execFile(bin, a, { timeout: 240000, maxBuffer: 8 * 1048576, ...o }, (e, out, err) => e ? no(e) : ok(String(err || '') + String(out || ''))))
// durasi (detik) dari keluaran ffmpeg -i; 0 bila gagal
async function probe(src) {
  let out = ''; try { out = await run(ffmpeg(), ['-i', src]) } catch (e) { out = String(e.stderr || e.message || '') }
  const m = out.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/)
  return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : 0
}
async function encode(src, dest) {
  const dur = await probe(src)
  const ss = dur > CLIP * 2 ? Math.max(0, Math.floor(dur * 0.35)) : 0   // lewati intro: mulai di ±35% lagu
  const args = ['-y', ...(ss ? ['-ss', String(ss)] : []), '-i', src, '-t', String(CLIP), '-vn', '-map_metadata', '-1', '-ac', '1', '-ar', '24000', '-af', 'afade=t=in:d=0.4,afade=t=out:st=' + Math.max(0, CLIP - 1.2) + ':d=1.2', '-c:a', 'libmp3lame', '-b:a', KBPS + 'k', dest]
  await run(ffmpeg(), args)
  try { fs.writeFileSync(dest + '.json', JSON.stringify({ dur: Math.round(dur) })) } catch {}
  return dest
}
const durOf = (id) => { try { return JSON.parse(fs.readFileSync(cachePath(id) + '.json', 'utf8')).dur || 0 } catch { return 0 } }
// ambil mp3 kecil (dari cache, atau unduh dari Drive lalu ubah). Mengembalikan Buffer.
function ensureAudio(t) {
  const f = cachePath(t.id)
  if (fs.existsSync(f) && fs.statSync(f).size > 2048) return Promise.resolve(fs.readFileSync(f))
  if (inflight.has(t.id)) return inflight.get(t.id)
  const job = (async () => {
    const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'dmusik-'))
    try {
      fs.mkdirSync(AUDIO_DIR, { recursive: true })
      const raw = await download(t.id, tmp, 'src')
      await encode(raw, f)
      return fs.readFileSync(f)
    } finally { try { fs.rmSync(tmp, { recursive: true, force: true }) } catch {} inflight.delete(t.id) }
  })()
  inflight.set(t.id, job); return job
}
// mp3 kualitas bagus (128k stereo) untuk DIKIRIM sebagai pesan audio WhatsApp asli. Mengembalikan path file.
const HQ_DIR = path.join(AUDIO_DIR, 'hq')
const hqJobs = new Map()
function ensureHq(t) {
  const f = path.join(HQ_DIR, safeId(t.id) + '.mp3')
  if (fs.existsSync(f) && fs.statSync(f).size > 4096) return Promise.resolve(f)
  if (hqJobs.has(t.id)) return hqJobs.get(t.id)
  const job = (async () => {
    const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'dmusikhq-'))
    try {
      fs.mkdirSync(HQ_DIR, { recursive: true })
      const raw = await download(t.id, tmp, 'src')
      await new Promise((ok, no) => execFile(ffmpeg(), ['-y', '-i', raw, '-vn', '-map_metadata', '-1', '-ac', '2', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '128k', f], { timeout: 300000 }, (e) => e ? no(e) : ok()))
      return f
    } finally { try { fs.rmSync(tmp, { recursive: true, force: true }) } catch {} hqJobs.delete(t.id) }
  })()
  hqJobs.set(t.id, job); return job
}
// susun playlist mulai dari lagu ke-start (urutan berputar) sampai anggaran ukuran habis
async function buildPlaylist(tracks, start = 0, prefer = []) {
  const n = tracks.length, base = Array.from({ length: n }, (_, i) => (start + i) % n), pf = prefer.filter(k => k >= 0 && k < n)
  const order = pf.length ? [...new Set([...pf, ...base])] : base   // lagu pilihan (mis. favorit) didahulukan
  const got = new Map(); let used = 0
  for (let i = 0; i < n && used < BUDGET; i += 3) {
    const batch = order.slice(i, i + 3)
    const res = await Promise.all(batch.map(k => ensureAudio(tracks[k]).then(b => [k, b], e => { console.log('[musik] lagu gagal:', tracks[k].title, '-', e.message); return null })))
    for (const r of res) {
      if (!r) continue
      let [k, b] = r
      const left = BUDGET - used
      if (b.length > left) { if (got.size) continue; b = b.subarray(0, left) }   // lagu pertama terlalu besar -> dipotong (preview)
      got.set(k, b.toString('base64')); used += b.length
    }
  }
  return { audio: got, bytes: used }
}
// unduh & ubah semua lagu di belakang layar supaya kartu berikutnya cepat
let warming = false
async function warm(tracks) {
  if (warming) return; warming = true
  try { for (const t of tracks) { try { await ensureAudio(t) } catch (e) { console.log('[musik] warm gagal:', t.title, e.message) } } } finally { warming = false }
}

// ── favorit per user & statistik putar ──
const SDB = path.join(global.dionyData, 'musikuser.json')   // { fav:{jid:[id]}, plays:{id:n}, last:{jid:id} }
const sRead = () => { try { return JSON.parse(fs.readFileSync(SDB, 'utf8')) } catch { return { fav: {}, plays: {}, last: {} } } }
const sWrite = (d) => { try { fs.writeFileSync(SDB, JSON.stringify(d)) } catch (e) { console.log('[musik] gagal simpan statistik:', e.message) } }
const favs = (jid) => (sRead().fav || {})[jid] || []
function toggleFav(jid, id) {
  const d = sRead(); d.fav = d.fav || {}; const a = d.fav[jid] || []
  const has = a.includes(id); d.fav[jid] = has ? a.filter(x => x !== id) : a.concat(id).slice(-100); sWrite(d); return !has
}
function countPlay(jid, id) { const d = sRead(); d.plays = d.plays || {}; d.last = d.last || {}; d.plays[id] = (d.plays[id] || 0) + 1; d.last[jid] = id; sWrite(d) }
const topPlays = (n = 10) => Object.entries(sRead().plays || {}).sort((a, b) => b[1] - a[1]).slice(0, n)
const lastPlayed = (jid) => (sRead().last || {})[jid] || null
// cari beberapa lagu sekaligus (judul/artis mengandung semua kata)
function search(list, q) {
  const w = String(q || '').toLowerCase().split(/\s+/).filter(Boolean); if (!w.length) return []
  return list.map((t, i) => ({ t, i })).filter(({ t }) => { const h = `${t.artist} ${t.title}`.toLowerCase(); return w.every(x => h.includes(x)) })
}
const fmtDur = (x) => x ? `${Math.floor(x / 60)}:${String(Math.round(x % 60)).padStart(2, '0')}` : '-'

module.exports = { search, favs, toggleFav, countPlay, topPlays, lastPlayed, durOf, fmtDur, cleanName, probe, FOLDER_ID, IMG, BUDGET, getTracks, addManual, removeManual, find, getImage, download, driveId, ensureAudio, ensureHq, buildPlaylist, warm }
